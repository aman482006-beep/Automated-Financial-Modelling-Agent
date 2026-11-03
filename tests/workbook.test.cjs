const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const XLSX=require("xlsx-js-style");
const E=require("../engine.js");

global.window={XLSX,ModelEngine:E};
require("../workbook.js");

test("Excel report generates formula-linked statement, DCF, comps and sensitivity tabs",t=>{
 const p=E.defaultProject();
 const f=E.buildForecast(p.history,p.assumptions,p.forecastYears);
 const ratios=E.historicalRatios(p.history);
 const valuation=E.calculateDCF(f,p.history,p.dcf,p.assumptions);
 const original=process.cwd(),dir=fs.mkdtempSync(path.join(os.tmpdir(),"modelforge-xlsx-"));
 try{
  process.chdir(dir);
  const file=window.ModelWorkbook.exportWorkbook(p,f,valuation,ratios);
  assert.ok(fs.existsSync(path.join(dir,file)),"Excel export file should exist");
  const wb=XLSX.readFile(path.join(dir,file),{cellFormula:true});
  for(const name of ["Cover","Inputs","Historical IS","Historical BS","Historical CF","Forecast IS","Forecast BS","Forecast CF","Ratios","DCF","Comparables","Sensitivity","Scenario Calc","Checks"])assert.ok(wb.SheetNames.includes(name),"Missing worksheet "+name);
  const formula=(sheet,cell,includes)=>{
   const c=wb.Sheets[sheet][cell];
   assert.ok(c,"Missing cell "+sheet+"!"+cell);
   assert.equal(typeof c.f,"string","Expected Excel formula at "+sheet+"!"+cell);
   assert.ok(c.f.length>0,"Formula must not be blank");
   assert.ok(!c.f.startsWith("="),"SheetJS formula field must not contain leading equals sign");
   if(includes)assert.ok(c.f.includes(includes),"Formula at "+sheet+"!"+cell+" should reference "+includes+"; got "+c.f);
  };
  formula("Inputs","B41","B38");
  formula("Forecast IS","B5","Historical IS");
  formula("Forecast IS","B8","Inputs");
  formula("Forecast BS","B17","B10-B16");
  formula("Forecast CF","B5","Forecast IS");
  formula("DCF","B3","Inputs");
  formula("DCF","B15","Perpetuity growth");
  formula("DCF","B18","B16");
  formula("Comparables","J4","C4/D4");
  formula("Comparables","B11","J7");
  formula("Sensitivity","B5","DCF");
  formula("Sensitivity","F32","Scenario Calc");
  formula("Scenario Calc","B5","Sensitivity");
  formula("Scenario Calc","B8","Historical IS");
  formula("Scenario Calc","B15","Historical BS");
  formula("Scenario Calc","B28","Historical BS");
  formula("Checks","C4","Forecast BS");
  assert.equal(wb.Sheets.Inputs.B12.v,p.assumptions.revenueGrowth);
  assert.equal(wb.Sheets.Inputs.B35.v,"Perpetuity growth");
 }finally{
  process.chdir(original);
  fs.rmSync(dir,{recursive:true,force:true});
 }
});


test("blank Excel data template has three importable sheets and round-trips into history", t => {
  const original=process.cwd(),dir=fs.mkdtempSync(path.join(os.tmpdir(),"modelforge-template-"));
  try {
    process.chdir(dir);
    const filename=window.ModelWorkbook.downloadDataTemplate();
    assert.ok(fs.existsSync(path.join(dir,filename)));
    const wb=XLSX.readFile(path.join(dir,filename),{cellDates:true});
    for(const [sheet,group] of [["Income Statement","IS"],["Balance Sheet","BS"],["Cash Flow","CF"]]){
      assert.ok(wb.SheetNames.includes(sheet));
      const rows=XLSX.utils.sheet_to_json(wb.Sheets[sheet],{defval:null,raw:true});
      assert.equal(rows.length,E.ITEMS[group].length);
      const labels=rows.map(row=>row["Line item"]);
      assert.deepEqual(labels,E.ITEMS[group].map(([,label])=>label));
      for(const [,label] of E.ITEMS[group])assert.ok(E.mapLabel(label),"Template label must auto-map: "+label);
    }
    // Fill one cell on each sheet, then read it through the same parser used by the app.
    wb.Sheets["Income Statement"].B2={t:"n",v:1250};
    wb.Sheets["Balance Sheet"].B2={t:"n",v:240};
    wb.Sheets["Cash Flow"].B2={t:"n",v:175};
    const filled=path.join(dir,"filled-template.xlsx");
    XLSX.writeFile(wb,filled,{cellStyles:true});
    const imported=XLSX.readFile(filled,{cellDates:true});
    const records=[];
    for(const sheet of ["Income Statement","Balance Sheet","Cash Flow"]){
      records.push(...E.recordsFromRows(XLSX.utils.sheet_to_json(imported.Sheets[sheet],{defval:null,raw:true}),sheet));
    }
    const history=E.historyFromRecords(records,{});
    assert.deepEqual(history.periods,["2022"]);
    assert.equal(history.IS.revenue[0],1250);
    assert.equal(history.BS.cash[0],240);
    assert.equal(history.CF.cfo[0],175);
  } finally {
    process.chdir(original);
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
