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
