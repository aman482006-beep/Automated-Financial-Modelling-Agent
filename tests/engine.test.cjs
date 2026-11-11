const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../engine.js");

test("sample historical balance sheets reconcile", () => {
  const p=E.defaultProject();
  const checks=E.validateHistory(p.history).filter(x=>x.title.startsWith("Balance sheet"));
  assert.equal(checks.length,5);
  assert.ok(checks.every(x=>x.ok));
});

test("missing core statement inputs are clearly flagged", () => {
  const p=E.defaultProject();
  p.history.IS.revenue[0]=null;
  const warnings=E.validateHistory(p.history);
  assert.ok(warnings.some(x=>x.title==="Missing core statement data · 2021"&&!x.ok));
});

test("sample cash flow bridges reconcile", () => {
  const p=E.defaultProject();
  const checks=E.validateHistory(p.history).filter(x=>x.title.startsWith("Cash flow bridge"));
  assert.equal(checks.length,4);
  assert.ok(checks.every(x=>x.ok));
});

test("historical revenue growth and margin calculations are correct", () => {
  const p=E.defaultProject(), r=E.historicalRatios(p.history);
  assert.ok(Math.abs(r[1].revenueGrowth-0.16)<1e-10);
  assert.ok(Math.abs(r[4].grossMargin-0.48)<1e-4);
  assert.ok(Math.abs(r[4].ebitdaMargin-(448/1996))<1e-10);
});

test("forecast horizon is adjustable and all three statements link", () => {
  const p=E.defaultProject();
  const f=E.buildForecast(p.history,p.assumptions,5);
  assert.equal(f.length,5);
  assert.ok(f.every(x=>Math.abs(x.check)<1e-8));
  assert.ok(f.every(x=>Math.abs(x.netChangeCash-(x.cfo+x.cfi+x.cff))<1e-8));
  assert.ok(f.every(x=>Math.abs(x.fcf-(x.cfo-x.capex))<1e-8));
  const f3=E.buildForecast(p.history,p.assumptions,3);
  assert.equal(f3.length,3);
});

test("working capital, PP&E, debt and retained earnings roll forward", () => {
  const p=E.defaultProject(), f=E.buildForecast(p.history,p.assumptions,5);
  const first=f[0];
  assert.ok(Math.abs(first.ppe-(p.history.BS.ppe.at(-1)+first.capex+first.da))<1e-8);
  assert.ok(Math.abs(first.equity-(p.history.BS.equity.at(-1)+first.netIncome-first.dividend))<1e-8);
  assert.ok(Math.abs(first.longDebt-(p.history.BS.longDebt.at(-1)-first.debtRepayment))<1e-8);
});

test("WACC uses CAPM and market value capital weights", () => {
  const p=E.defaultProject(), w=E.calculateWACC(p.dcf,p.assumptions.taxRate);
  const ke=p.dcf.riskFreeRate+p.dcf.beta*p.dcf.equityRiskPremium;
  const ew=p.dcf.equityMarketValue/(p.dcf.equityMarketValue+p.dcf.debtMarketValue);
  assert.ok(Math.abs(w.costEquity-ke)<1e-10);
  assert.ok(Math.abs(w.equityWeight-ew)<1e-10);
  assert.ok(w.wacc>0 && w.wacc<0.3);
});

test("DCF terminal value and EV-to-equity bridge reconcile", () => {
  const p=E.defaultProject(), f=E.buildForecast(p.history,p.assumptions,5);
  const d=E.calculateDCF(f,p.history,p.dcf,p.assumptions);
  assert.ok(d.terminalValue>0);
  assert.ok(Math.abs(d.enterpriseValue-(d.pvForecast+d.pvTerminal))<1e-8);
  assert.ok(Math.abs(d.equityValue-(d.enterpriseValue-d.netDebt))<1e-8);
  assert.ok(Math.abs(d.perShare-d.equityValue/p.dcf.sharesOutstanding)<1e-8);
});

test("exit-multiple terminal value is supported", () => {
  const p=E.defaultProject();p.dcf.terminalMethod="multiple";
  const f=E.buildForecast(p.history,p.assumptions,5),d=E.calculateDCF(f,p.history,p.dcf,p.assumptions);
  assert.ok(Math.abs(d.terminalValue-f.at(-1).ebitda*p.dcf.exitMultiple)<1e-8);
  assert.ok(Number.isFinite(d.enterpriseValue));
});

test("comparable-company multiples and statistics ignore invalid peers", () => {
  const p=E.defaultProject(),stats=E.peerStatistics(p.peers);
  assert.equal(stats.evRevenue.count,3);
  assert.ok(stats.evEbitda.median>0);
  const invalid={ev:100,revenue:0,ebitda:0,ebit:0,netIncome:0,marketCap:0,bookEquity:0};
  assert.equal(E.peerMultiples(invalid).evRevenue,null);
});

test("sensitivity scenarios recalculate, rather than re-label base output", () => {
  const p=E.defaultProject(),base=E.operatingScenario(p.history,p.assumptions,5,p.dcf);
  const downside=E.operatingScenario(p.history,{...p.assumptions,revenueGrowth:p.assumptions.revenueGrowth-0.02},5,p.dcf);
  assert.ok(Number.isFinite(base));
  assert.ok(Number.isFinite(downside));
  assert.ok(downside<base);
});

test("CSV import mapping preserves period and signed expense values", () => {
  const records=[
    {period:"2024",label:"Revenue",value:100},
    {period:"2024",label:"Cost of goods sold",value:-55},
    {period:"2025",label:"Revenue",value:120},
    {period:"2025",label:"Cost of goods sold",value:-62}
  ];
  const h=E.historyFromRecords(records,{Revenue:"IS.revenue","Cost of goods sold":"IS.cogs"});
  assert.deepEqual(h.periods,["2024","2025"]);
  assert.equal(h.IS.revenue[1],120);
  assert.equal(h.IS.cogs[1],-62);
});

test("number parser handles commas, currency symbols and brackets", () => {
  assert.equal(E.parseNumber("₹ 1,234.50"),1234.5);
  assert.equal(E.parseNumber("(1,234.50)"),-1234.5);
  assert.equal(E.parseNumber("—"),null);
});


test("all manual-entry and Excel-template line items map automatically", () => {
  for (const [group, items] of Object.entries(E.ITEMS)) {
    for (const [key, label] of items) {
      assert.equal(E.mapLabel(label), group + "." + key, "Expected a mapping for " + label);
    }
  }
});

test("Excel wide-format import handles numeric year headers before Line item", () => {
  // Numeric-looking object keys enumerate before ordinary string keys in JavaScript.
  const rows = [
    {"2024": 100, "2025": 120, "Line item": "Revenue"},
    {"2024": -55, "2025": -62, "Line item": "Cost of goods sold"},
    {"2024": 25, "2025": 35, "Line item": "Cash & cash equivalents"},
    {"2024": 30, "2025": 40, "Line item": "Total liabilities & equity"}
  ];
  const records = E.recordsFromRows(rows, "Template");
  const h = E.historyFromRecords(records, {});
  assert.deepEqual(h.periods, ["2024", "2025"]);
  assert.equal(h.IS.revenue[1], 120);
  assert.equal(h.IS.cogs[1], -62);
  assert.equal(h.BS.cash[1], 35);
  assert.equal(h.BS.totalLiabEquity[1], 40);
});


test("Screener.in Data Sheet imports annual income statement, balance sheet and cash flow", () => {
  const rows=Array.from({length:85},()=>[]);
  const put=(excelRow,values)=>{rows[excelRow-1]=values;};
  put(1,["COMPANY NAME","TATA CONSULTANCY SERVICES LTD"]);
  put(8,["Current Price",2488.3]);
  put(9,["Market Capitalization",900288.69]);
  put(15,["PROFIT & LOSS"]);
  put(16,["Report Date",42825,43190]);
  put(17,["Sales",117966,123104]);
  put(18,["Raw Material Cost",94,86]);
  put(19,["Change in Inventory",1,null]);
  put(21,["Other Mfr. Exp",2715,2614]);
  put(22,["Employee Cost",61621,66396]);
  put(23,["Selling and admin",16392,16808]);
  put(24,["Other Expenses",4834,4684]);
  put(25,["Other Income",4221,3642]);
  put(26,["Depreciation",1987,2014]);
  put(27,["Interest",32,52]);
  put(28,["Profit before tax",34513,34092]);
  put(29,["Tax",8156,8212]);
  put(30,["Net profit",26289,25826]);
  put(40,["Quarters"]);
  put(55,["BALANCE SHEET"]);
  put(56,["Report Date",42825,43190]);
  put(57,["Equity Share Capital",197,191]);
  put(58,["Reserves",86017,84937]);
  put(59,["Borrowings",289,247]);
  put(60,["Other Liabilities",15830,19751]);
  put(61,["Total",102333,105126]);
  put(62,["Net Block",11701,11973]);
  put(63,["Capital Work in Progress",1541,1278]);
  put(64,["Investments",41980,36008]);
  put(65,["Other Assets",47111,55867]);
  put(66,["Total",102333,105126]);
  put(67,["Receivables",22617,24943]);
  put(68,["Inventory",21,26]);
  put(69,["Cash & Bank",4149,7161]);
  put(70,["No. of Equity Shares",1970427941,1914287591]);
  put(80,["CASH FLOW:"]);
  put(81,["Report Date","42825.0",43190]);
  put(82,["Cash from Operating Activity",25223,25067]);
  put(83,["Cash from Investing Activity",-16895,3104]);
  put(84,["Cash from Financing Activity",-11026,-26885]);
  put(85,["Net Cash Flow",-2698,1286]);
  const parsed=E.parseScreenerDataSheet(rows);
  assert.ok(parsed);
  assert.equal(parsed.companyName,"TATA CONSULTANCY SERVICES LTD");
  assert.equal(parsed.marketCapCrores,900288.69);
  assert.ok(Math.abs(parsed.sharesOutstandingCrores-191.4287591)<1e-8);
  const h=E.historyFromRecords(parsed.records,{});
  assert.deepEqual(h.periods,["FY2017","FY2018"]);
  assert.equal(h.IS.revenue[1],123104);
  assert.equal(h.IS.cogs[0],-2810);
  assert.equal(h.IS.employeeExpenses[0],-61621);
  assert.equal(h.IS.otherOpex[0],-21226);
  assert.equal(h.IS.otherIncome[0],4221);
  assert.equal(h.BS.equity[0],86214);
  assert.equal(h.BS.longDebt[0],289);
  assert.equal(h.BS.ppe[0],13242);
  assert.equal(h.BS.otherCurrentAssets[0],20324,"Investments must not be included in operating current assets.");
  assert.equal(h.BS.totalAssets[0],102333);
  assert.equal(h.BS.totalLiabEquity[0],102333);
  assert.equal(h.CF.cfo[0],25223);
  assert.equal(h.CF.cfi[0],-16895);
  assert.equal(h.CF.cff[0],-11026);
  assert.equal(h.CF.capex[0],null);
  assert.equal(h.CF.fcf[0],null,"Total investing cash flow must not be used as a capex proxy.");
  assert.ok(!E.validateHistory(h).some(x=>x.title==="Missing core statement data · FY2017"&&!x.ok));
  const readiness=E.modelReadiness(h);
  assert.equal(readiness.ready,false);
  assert.ok(readiness.blockers.some(x=>x.includes("Accounts payable")));
  assert.ok(readiness.blockers.some(x=>x.includes("Short-term debt")));
});


test("Screener balance-sheet mappings preserve missing AP and short debt and exclude investments from working capital", () => {
  const rows=Array.from({length:85},()=>[]);
  const put=(row,values)=>{rows[row-1]=values;};
  put(15,["PROFIT & LOSS"]);put(16,["Report Date",43190]);put(17,["Sales",1000]);
  put(55,["BALANCE SHEET"]);put(56,["Report Date",43190]);
  put(57,["Equity Share Capital",100]);put(58,["Reserves",300]);
  put(59,["Borrowings",80]);put(60,["Other Liabilities",50]);
  put(61,["Total",700]);put(62,["Net Block",200]);put(63,["Capital Work in Progress",10]);
  put(64,["Investments",90]);put(65,["Other Assets",300]);put(66,["Total",700]);
  put(67,["Receivables",70]);put(68,["Inventory",80]);put(69,["Cash & Bank",60]);
  put(80,["CASH FLOW"]);put(81,["Report Date",43190]);put(82,["Cash from Operating Activity",100]);
  put(83,["Cash from Investing Activity",-50]);put(84,["Cash from Financing Activity",-20]);
  const parsed=E.parseScreenerDataSheet(rows);
  assert.ok(parsed);
  const h=E.historyFromRecords(parsed.records,{});
  assert.equal(h.BS.otherCurrentAssets[0],90);
  assert.equal(h.BS.ap[0],null);
  assert.equal(h.BS.shortDebt[0],null);
  assert.equal(h.BS.longDebt[0],80);
  assert.equal(h.CF.fcf[0],null);
});

test("Screener importer maps AP and debt maturity when the source discloses them", () => {
  const rows=Array.from({length:85},()=>[]);
  const put=(row,values)=>{rows[row-1]=values;};
  put(15,["PROFIT & LOSS"]);put(16,["Report Date",43190]);put(17,["Sales",1000]);
  put(55,["BALANCE SHEET"]);put(56,["Report Date",43190]);
  put(57,["Equity Share Capital",100]);put(58,["Reserves",300]);
  put(59,["Short Term Borrowings",20]);put(60,["Long Term Borrowings",60]);
  put(61,["Trade Payables",40]);put(62,["Other Liabilities",50]);
  put(63,["Total",700]);put(64,["Net Block",200]);put(65,["Capital Work in Progress",10]);
  put(66,["Other Assets",300]);put(67,["Total",700]);put(68,["Receivables",70]);put(69,["Inventory",80]);put(70,["Cash & Bank",60]);
  put(80,["CASH FLOW"]);put(81,["Report Date",43190]);put(82,["Cash from Operating Activity",100]);
  put(83,["Cash from Investing Activity",-50]);put(84,["Cash from Financing Activity",-20]);
  const parsed=E.parseScreenerDataSheet(rows),h=E.historyFromRecords(parsed.records,{});
  assert.equal(h.BS.shortDebt[0],20);
  assert.equal(h.BS.longDebt[0],60);
  assert.equal(h.BS.ap[0],40);
});

test("period sorting is chronological for fiscal quarters across year boundaries", () => {
  const records=[
    {period:"Q1 FY2025",label:"Revenue",value:130},
    {period:"Q4 FY2024",label:"Revenue",value:120},
    {period:"Q2 FY2025",label:"Revenue",value:140},
    {period:"FY2024",label:"Revenue",value:450}
  ];
  const h=E.historyFromRecords(records,{});
  assert.deepEqual(h.periods,["Q4 FY2024","FY2024","Q1 FY2025","Q2 FY2025"]);
  assert.equal(E.parseFinancialPeriod("Q1 FY2025").quarter,1);
  assert.equal(E.parseFinancialPeriod("FY2024").kind,"annual");
});

test("model readiness requires a complete annual balance-sheet starting point", () => {
  const p=E.defaultProject();
  assert.equal(E.modelReadiness(p.history,"Annual").ready,true);
  p.history.BS.ap[p.history.periods.length-1]=null;
  const result=E.modelReadiness(p.history,"Annual");
  assert.equal(result.ready,false);
  assert.ok(result.blockers.some(x=>x.includes("Accounts payable")));
  assert.throws(()=>E.buildForecast(p.history,p.assumptions,5),/Accounts payable/);
});

test("model readiness blocks quarterly inputs from annual forecast calculations", () => {
  const p=E.defaultProject();
  p.history.periods=["Q1 FY2025"];
  for(const group of ["IS","BS","CF"])for(const key of Object.keys(p.history[group]))p.history[group][key]=[p.history[group][key].at(-1)];
  const result=E.modelReadiness(p.history,"Annual");
  assert.equal(result.ready,false);
  assert.ok(result.blockers.some(x=>x.includes("Quarterly periods")));
  assert.throws(()=>E.buildForecast(p.history,p.assumptions,5),/Quarterly periods/);
});

test("forecast assumptions reject invalid or extreme driver values", () => {
  const p=E.defaultProject();
  assert.deepEqual(E.validateForecastAssumptions(p.assumptions),[]);
  const invalid={...p.assumptions,revenueGrowth:8,taxRate:1.2,arDays:-1};
  const errors=E.validateForecastAssumptions(invalid);
  assert.equal(errors.length,3);
});

test("DCF assumption validation prevents invalid WACC and terminal growth combinations", () => {
  const p=E.defaultProject(),f=E.buildForecast(p.history,p.assumptions,5);
  const invalid={...p.dcf,perpetualGrowth:0.5};
  const errors=E.validateDCFInputs(invalid,p.assumptions,p.history);
  assert.ok(errors.some(x=>x.includes("Perpetual growth")));
  assert.equal(E.calculateDCF(f,p.history,invalid,p.assumptions).valid,false);
  const invalidShares={...p.dcf,sharesOutstanding:0};
  assert.ok(E.validateDCFInputs(invalidShares,p.assumptions,p.history).some(x=>x.includes("Shares outstanding")));
});

test("missing FCF remains unavailable when only CFO and CFI are supplied", () => {
  const h=E.historyFromRecords([
    {period:"2025",label:"Cash flow from operations",value:120},
    {period:"2025",label:"Cash flow from investing",value:-75}
  ],{});
  assert.equal(E.historicalRatios(h)[0].freeCashFlow,null);
});


test("model readiness blocks an unreconciled latest balance sheet", () => {
  const p=E.defaultProject();
  const latest=p.history.periods.length-1;
  p.history.BS.totalAssets[latest]+=10;
  const result=E.modelReadiness(p.history,"Annual");
  assert.equal(result.ready,false);
  assert.ok(result.blockers.some(x=>x.includes("does not reconcile")));
  assert.throws(()=>E.buildForecast(p.history,p.assumptions,5),/does not reconcile/);
});


test("Screener importer does not assume generic other liabilities are current", () => {
  const rows=Array.from({length:85},()=>[]);
  const put=(row,values)=>{rows[row-1]=values;};
  put(15,["PROFIT & LOSS"]);put(16,["Report Date",43190]);put(17,["Sales",1000]);
  put(55,["BALANCE SHEET"]);put(56,["Report Date",43190]);
  put(57,["Equity Share Capital",100]);put(58,["Reserves",300]);put(59,["Borrowings",80]);
  put(60,["Other Liabilities",50]);put(61,["Total",700]);put(62,["Net Block",200]);
  put(63,["Capital Work in Progress",10]);put(64,["Other Assets",300]);put(65,["Total",700]);
  put(66,["Receivables",70]);put(67,["Inventory",80]);put(68,["Cash & Bank",60]);
  put(80,["CASH FLOW"]);put(81,["Report Date",43190]);put(82,["Cash from Operating Activity",100]);
  put(83,["Cash from Investing Activity",-50]);put(84,["Cash from Financing Activity",-20]);
  const parsed=E.parseScreenerDataSheet(rows);
  assert.ok(parsed.records.some(record=>record.label==="Unclassified other liabilities"&&record.value===50));
  const h=E.historyFromRecords(parsed.records,{});
  assert.equal(h.BS.otherLiabilities[0],null);
});

test("wide-format Excel import recognises FY-prefixed period columns", () => {
  const rows = [
    {"FY 2024": 100, "FY 2025": 120, "Line item": "Revenue"},
    {"FY 2024": -55, "FY 2025": -62, "Line item": "Cost of goods sold"}
  ];
  const records = E.recordsFromRows(rows, "Income Statement");
  const history = E.historyFromRecords(records, {});
  assert.deepEqual(history.periods, ["2024", "2025"]);
  assert.deepEqual(history.IS.revenue, [100,120]);
  assert.deepEqual(history.IS.cogs, [-55,-62]);
});

test("CSV parser preserves quoted commas, escaped quotes, embedded newlines and UTF-8 BOM", () => {
  const rows = E.parseCsv('\uFEFFPeriod,Company,Notes,Value\r\n2024,"Acme, Inc.","said ""hello""",100\r\n2025,Acme,"line one\r\nline two",120\r\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].Company, "Acme, Inc.");
  assert.equal(rows[0].Notes, 'said "hello"');
  assert.equal(rows[0].Value, "100");
  assert.equal(rows[1].Notes, "line one\r\nline two");
  assert.equal(rows[1].Value, "120");
});

test("CSV parser rejects malformed quotes and configured resource-limit violations", () => {
  assert.throws(() => E.parseCsv('Period,Revenue\n2024,"100'), /unclosed quoted field/i);
  assert.throws(() => E.parseCsv("A,B\n1,2\n3,4", { maxRows: 1 }), /more than 1 data rows/i);
  assert.throws(() => E.parseCsv("A,B,C\n1,2,3", { maxColumns: 2 }), /more than 2 columns/i);
  assert.throws(() => E.parseCsv("A\n"+"x".repeat(20), { maxFieldLength: 10 }), /field longer/i);
});


test("default Aster demo matches published historical and DCF sanity values", () => {
  const project = E.defaultProject();
  const latest = E.historicalRatios(project.history).at(-1);
  assert.ok(Math.abs(latest.revenueGrowth - (1996 / 1782 - 1)) < 1e-12);
  assert.ok(Math.abs(latest.grossMargin - (958 / 1996)) < 1e-12);
  assert.ok(Math.abs(latest.ebitdaMargin - (448 / 1996)) < 1e-12);
  assert.equal(latest.freeCashFlow, 162);

  const forecast = E.buildForecast(project.history, project.assumptions, project.forecastYears);
  const valuation = E.calculateDCF(forecast, project.history, project.dcf, project.assumptions);
  assert.equal(valuation.valid, true);
  assert.ok(Math.abs(valuation.wacc - 0.11361) < 1e-12);
  assert.ok(Math.abs(forecast.at(-1).revenue - 3214.57796) < 1e-8);
  assert.ok(Math.abs(forecast.at(-1).ebitda - 720.06546304) < 1e-8);
  assert.ok(Math.abs(valuation.enterpriseValue - 3409.638687924597) < 1e-7);
  assert.ok(Math.abs(valuation.perShare - 33.49638687924597) < 1e-8);
});
