(function(root,factory){
  const engine=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=engine;
  if(root) root.ModelEngine=engine;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const ITEMS={
 IS:[
  ["revenue","Revenue"],["cogs","Cost of goods sold"],["grossProfit","Gross profit"],["employeeExpenses","Employee expenses"],["otherOpex","Other operating expenses"],["ebitda","EBITDA"],["da","Depreciation & amortisation"],["ebit","EBIT"],["interestExpense","Interest expense"],["pbt","Profit before tax"],["tax","Tax expense"],["netIncome","Net income"],["otherIncome","Other income"]
 ],
 BS:[
  ["cash","Cash & cash equivalents"],["ar","Accounts receivable"],["inventory","Inventory"],["otherCurrentAssets","Other current assets"],["ppe","Property, plant & equipment"],["totalAssets","Total assets"],["ap","Accounts payable"],["shortDebt","Short-term debt"],["longDebt","Long-term debt"],["otherLiabilities","Other operating liabilities"],["equity","Shareholders' equity"],["totalLiabEquity","Total liabilities & equity"]
 ],
 CF:[
  ["cfo","Cash flow from operations"],["capex","Capital expenditure"],["cfi","Cash flow from investing"],["cff","Cash flow from financing"],["fcf","Free cash flow"]
 ]
};
const ALIASES={
 revenue:"IS.revenue",cashcashequivalents:"BS.cash",totalliabilitiesequity:"BS.totalLiabEquity",sales:"IS.revenue",turnover:"IS.revenue",netrevenue:"IS.revenue",totalrevenue:"IS.revenue",
 costofgoods:"IS.cogs",costofgoodssold:"IS.cogs",cogs:"IS.cogs",costofsales:"IS.cogs",
 grossprofit:"IS.grossProfit",grossincome:"IS.grossProfit",
 employeeexpenses:"IS.employeeExpenses",employeeexpense:"IS.employeeExpenses",staffcosts:"IS.employeeExpenses",salaries:"IS.employeeExpenses",personnelcosts:"IS.employeeExpenses",
 otheroperatingexpenses:"IS.otherOpex",operatingexpenses:"IS.otherOpex",otheropex:"IS.otherOpex",sellinggeneralandadministrative:"IS.otherOpex",sganda:"IS.otherOpex",
 ebitda:"IS.ebitda",depreciation:"IS.da",amortisation:"IS.da",amortization:"IS.da",depreciationamortisation:"IS.da",depreciationandamortisation:"IS.da",da:"IS.da",
 ebit:"IS.ebit",operatingprofit:"IS.ebit",operatingincome:"IS.ebit",interestexpense:"IS.interestExpense",financecosts:"IS.interestExpense",interestcost:"IS.interestExpense",
 pbt:"IS.pbt",profitbeforetax:"IS.pbt",earningsbeforetax:"IS.pbt",otherincome:"IS.otherIncome",nonoperatingincome:"IS.otherIncome",tax:"IS.tax",taxexpense:"IS.tax",incometax:"IS.tax",netincome:"IS.netIncome",profitaftertax:"IS.netIncome",pat:"IS.netIncome",
 cash:"BS.cash",cashandcashequivalents:"BS.cash",cashandbank:"BS.cash",cashandequivalents:"BS.cash",
 ar:"BS.ar",accountsreceivable:"BS.ar",tradereceivables:"BS.ar",tradeandotherreceivables:"BS.ar",
 inventory:"BS.inventory",inventories:"BS.inventory",stock:"BS.inventory",
 othercurrentassets:"BS.otherCurrentAssets",othercurrentasset:"BS.otherCurrentAssets",
 ppe:"BS.ppe",propertyplantequipment:"BS.ppe",propertyplantandequipment:"BS.ppe",fixedassets:"BS.ppe",netppe:"BS.ppe",
 totalassets:"BS.totalAssets",accountspayable:"BS.ap",tradepayables:"BS.ap",tradeandotherpayables:"BS.ap",
 shorttermdebt:"BS.shortDebt",shorttermborrowings:"BS.shortDebt",currentdebt:"BS.shortDebt",currentborrowings:"BS.shortDebt",
 longtermdebt:"BS.longDebt",longtermborrowings:"BS.longDebt",noncurrentdebt:"BS.longDebt",noncurrentborrowings:"BS.longDebt",
 otherliabilities:"BS.otherLiabilities",othercurrentliabilities:"BS.otherLiabilities",otheroperatingliabilities:"BS.otherLiabilities",
 equity:"BS.equity",shareholdersequity:"BS.equity",totalequity:"BS.equity",shareholdersfunds:"BS.equity",
 totalliabilitiesandequity:"BS.totalLiabEquity",totalliabilitiesplusequity:"BS.totalLiabEquity",
 cfo:"CF.cfo",cashflowfromoperations:"CF.cfo",operatingcashflow:"CF.cfo",netcashfromoperatingactivities:"CF.cfo",
 capex:"CF.capex",capitalexpenditure:"CF.capex",purchaseofppe:"CF.capex",purchasesofpropertyplantequipment:"CF.capex",
 cfi:"CF.cfi",cashflowfrominvesting:"CF.cfi",netcashfrominvestingactivities:"CF.cfi",
 cff:"CF.cff",cashflowfromfinancing:"CF.cff",netcashfromfinancingactivities:"CF.cff",
 fcf:"CF.fcf",freecashflow:"CF.fcf",freecashflowtofirm:"CF.fcf"
};
const DEFAULT_ASSUMPTIONS={revenueGrowth:.10,grossMargin:.48,employeePct:.138,otherOpexPct:.118,daPct:.045,taxRate:.25,capexPct:.067,arDays:45,inventoryDays:64,apDays:55,otherCurrentAssetsPct:.03,otherLiabilitiesPct:.052,annualDebtRepayment:20,interestRate:.085,dividendPayout:.20};
const DEFAULT_DCF={riskFreeRate:.07,equityRiskPremium:.06,beta:1.05,costOfDebt:.085,equityMarketValue:1800,debtMarketValue:700,sharesOutstanding:100,terminalMethod:"growth",perpetualGrowth:.04,exitMultiple:9};
const DEFAULT_PEERS=[
 {name:"Sample peer Alpha · synthetic",ev:2600,revenue:2200,ebitda:420,ebit:330,netIncome:180,marketCap:1450,bookEquity:1200,synthetic:true},
 {name:"Sample peer Beta · synthetic",ev:3100,revenue:2700,ebitda:465,ebit:350,netIncome:205,marketCap:1720,bookEquity:1450,synthetic:true},
 {name:"Sample peer Gamma · synthetic",ev:1950,revenue:1850,ebitda:290,ebit:215,netIncome:120,marketCap:1050,bookEquity:930,synthetic:true}
];
const SAMPLE={
 name:"Aster Industries",analyst:"Financial Analyst",industry:"Industrials",valuationDate:"2026-11-03",currency:"INR",unit:"millions",frequency:"Annual",sharesOutstanding:100,
 periods:["2021","2022","2023","2024","2025"],
 IS:{revenue:[1200,1392,1591,1782,1996],otherIncome:[0,0,0,0,0],cogs:[-660,-752,-859,-944,-1038],grossProfit:[540,640,732,838,958],employeeExpenses:[-180,-202,-227,-249,-275],otherOpex:[-150,-170,-191,-214,-235],ebitda:[210,268,314,375,448],da:[-55,-61,-68,-76,-84],ebit:[155,207,246,299,364],interestExpense:[-34,-36,-39,-42,-45],pbt:[121,171,207,257,319],tax:[-30,-43,-52,-64,-80],netIncome:[91,128,155,193,239]},
 BS:{cash:[90,105,125,152,185],ar:[150,172,195,219,246],inventory:[120,132,148,164,181],otherCurrentAssets:[40,45,49,54,60],ppe:[420,455,492,530,573],totalAssets:[820,909,1009,1119,1245],ap:[100,112,127,141,158],shortDebt:[55,58,60,62,65],longDebt:[250,240,225,205,180],otherLiabilities:[75,82,89,96,104],equity:[340,417,508,615,738],totalLiabEquity:[820,909,1009,1119,1245]},
 CF:{cfo:[145,180,210,251,294],capex:[-90,-100,-110,-120,-132],cfi:[-90,-100,-110,-120,-132],cff:[-45,-65,-80,-104,-129],fcf:[55,80,100,131,162]}
};
function blankHistory(periods){
 const h={periods:(periods||[]).slice()};
 for(const g of Object.keys(ITEMS)){h[g]={};for(const [k] of ITEMS[g])h[g][k]=h.periods.map(()=>null);}
 return h;
}
function defaultProject(){
 const h=clone(SAMPLE);return {profile:{name:h.name,analyst:h.analyst,industry:h.industry,valuationDate:h.valuationDate,currency:h.currency,unit:h.unit,frequency:h.frequency,sharesOutstanding:h.sharesOutstanding},history:{periods:h.periods,IS:h.IS,BS:h.BS,CF:h.CF},assumptions:clone(DEFAULT_ASSUMPTIONS),dcf:clone(DEFAULT_DCF),peers:clone(DEFAULT_PEERS),mapping:{},rawRecords:[],theme:"light",forecastYears:5};
}
function normaliseLabel(s){return String(s??"").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g,"");}
function mapLabel(s){return ALIASES[normaliseLabel(s)]||null;}
function parseNumber(value){
 if(value===null||value===undefined||value==="")return null;
 if(typeof value==="number")return Number.isFinite(value)?value:null;
 let s=String(value).trim();if(!s||s==="-"||s==="—"||s.toLowerCase()==="n/a")return null;
 let negative=/^\(.*\)$/.test(s);s=s.replace(/[₹$€£,\s()]/g,"").replace(/%$/,"");
 let n=Number(s);return Number.isFinite(n)?(negative?-Math.abs(n):n):null;
}

function recordsFromRows(rows,sheetName="",fileName=""){
 if(!Array.isArray(rows)||!rows.length)return [];
 const keys=Object.keys(rows[0]||{}),header=(wanted)=>keys.find(k=>wanted.includes(normaliseLabel(k)));
 const periodKey=header(["period","year","date","fiscalyear","quarter"]);
 const itemKey=header(["item","lineitem","account","description","particulars"]);
 const valueKey=header(["value","amount","balance","reportedvalue","financialvalue"]);
 const statementKey=header(["statement","statementtype","category"]);
 const periodText=value=>{
  if(value instanceof Date)return String(value.getFullYear());
  const s=String(value??"").trim();
  const q=s.match(/Q[1-4][ -]?(?:19|20)\d{2}/i);
  if(q)return q[0].replace(/([Qq][1-4])[ -]?((?:19|20)\d{2})/,"$1 $2").toUpperCase();
  const y=s.match(/(?:19|20)\d{2}/);
  return y?y[0]:s;
 };
 const out=[];
 if(periodKey&&itemKey&&valueKey){
  rows.forEach(row=>{
   const period=periodText(row[periodKey]),value=parseNumber(row[valueKey]);
   if(period&&String(row[itemKey]??"").trim()&&value!==null)out.push({period,label:String(row[itemKey]).trim(),value,statement:row[statementKey]||sheetName||fileName||""});
  });
  return out;
 }
 if(periodKey){
  rows.forEach(row=>{
   const period=periodText(row[periodKey]);if(!period)return;
   keys.forEach(key=>{
    if([periodKey,statementKey].includes(key)||["currency","unit","company"].includes(normaliseLabel(key)))return;
    const value=parseNumber(row[key]);
    if(value!==null)out.push({period,label:key,value,statement:row[statementKey]||sheetName||fileName||""});
   });
  });
  return out;
 }
 const periodColumns=keys.filter(key=>/^(?:19|20)\d{2}$|^Q[1-4][ -]?(?:19|20)\d{2}$/i.test(String(key).trim()));
 const labelKey=itemKey||keys.find(key=>!periodColumns.includes(key));
 if(labelKey&&periodColumns.length){
  rows.forEach(row=>periodColumns.forEach(periodKey=>{
   const value=parseNumber(row[periodKey]),label=String(row[labelKey]??"").trim();
   if(value!==null&&label)out.push({period:periodText(periodKey),label,value,statement:sheetName||fileName||""});
  }));
 }
 return out;
}

function parseScreenerDataSheet(matrix){
 if(!Array.isArray(matrix)||!matrix.length)return null;
 const rows=matrix;
 const rowLabel=row=>normaliseLabel(row?.[0]??"");
 const section=names=>rows.findIndex(row=>names.includes(rowLabel(row)));
 const pStart=section(["profitloss"]),bStart=section(["balancesheet"]),cStart=section(["cashflow"]);
 if(pStart<0||bStart<0||cStart<0)return null;
 const qStart=section(["quarters"]);
 const nextAfter=(start,candidates)=>candidates.filter(x=>x>start).sort((a,b)=>a-b)[0]??rows.length;
 const pEnd=nextAfter(pStart,[qStart,bStart,cStart]),bEnd=nextAfter(bStart,[cStart]),cEnd=rows.length;
 const findRow=(start,end,names)=>{
  for(let i=start+1;i<end;i++)if(names.includes(rowLabel(rows[i])))return rows[i];
  return null;
 };
 const findRows=(start,end,name)=>rows.slice(start+1,end).filter(row=>rowLabel(row)===normaliseLabel(name));
 const numValue=value=>{
  if(value===null||value===undefined||value==="")return null;
  if(typeof value==="number")return Number.isFinite(value)?value:null;
  let s=String(value).trim().replace(/,/g,"").replace(/[₹$€£\s]/g,"");
  if(!s||s==="-"||s==="—"||s.toLowerCase()==="n/a")return null;
  const negative=/^\(.*\)$/.test(s);s=s.replace(/[()]/g,"");
  const n=Number(s);return Number.isFinite(n)?(negative?-Math.abs(n):n):null;
 };
 const periodFromDate=value=>{
  const serial=numValue(value);
  if(serial!==null&&serial>20000&&serial<80000){
   const d=new Date(Date.UTC(1899,11,30)+Math.round(serial)*86400000);
   const year=d.getUTCFullYear(),month=d.getUTCMonth()+1,day=d.getUTCDate();
   if(month===3&&day===31)return "FY"+year;
   const fy=month>=4?year+1:year,quarter=month>=4&&month<=6?1:month>=7&&month<=9?2:month>=10?3:4;
   return "Q"+quarter+" FY"+fy;
  }
  const match=String(value??"").trim().match(/(?:19|20)\d{2}/);
  return match?"FY"+match[0]:String(value??"").trim();
 };
 const at=(row,index)=>numValue(row?.[index+1]);
 const sumAbs=(start,end,names,index)=>{
  let found=false,total=0;
  for(let i=start+1;i<end;i++){
   if(names.includes(rowLabel(rows[i]))){
    const value=at(rows[i],index);
    if(value!==null){found=true;total+=Math.abs(value);}
   }
  }
  return found?total:null;
 };
 const pDates=findRow(pStart,pEnd,["reportdate"]),bDates=findRow(bStart,bEnd,["reportdate"]),cDates=findRow(cStart,cEnd,["reportdate"]);
 if(!pDates||!bDates||!cDates)return null;
 const pPeriods=pDates.slice(1).map(periodFromDate),bPeriods=bDates.slice(1).map(periodFromDate),cPeriods=cDates.slice(1).map(periodFromDate);
 const records=[];
 const add=(period,label,value,mapped)=>{
  if(value===null||value===undefined||!Number.isFinite(Number(value)))return;
  records.push({period,label,value:Number(value),mapped,statement:"Screener.in Data Sheet"});
 };
 const pRow=names=>findRow(pStart,pEnd,names);
 const sales=pRow(["sales","revenue"]),employee=pRow(["employeecost"]),selling=pRow(["sellingandadmin"]),otherExpense=pRow(["otherexpenses"]);
 const depreciation=pRow(["depreciation"]),interest=pRow(["interest"]),otherIncome=pRow(["otherincome"]);
 const pbt=pRow(["profitbeforetax"]),tax=pRow(["tax"]),netProfit=pRow(["netprofit"]),dividend=pRow(["dividendamount"]);
 for(let i=0;i<pPeriods.length;i++){
  const period=pPeriods[i],revenue=at(sales,i);
  if(!period||revenue===null)continue;
  add(period,"Revenue",revenue,"IS.revenue");
  const cogs=sumAbs(pStart,pEnd,["rawmaterialcost","changeininventory","powerandfuel","othermfrexp"],i);
  if(cogs!==null){
   add(period,"Cost of goods sold",-cogs,"IS.cogs");
   add(period,"Gross profit",revenue-cogs,"IS.grossProfit");
  }
  const emp=at(employee,i),sell=at(selling,i),other=at(otherExpense,i);
  if(emp!==null)add(period,"Employee expenses",-Math.abs(emp),"IS.employeeExpenses");
  if(sell!==null||other!==null)add(period,"Other operating expenses",-(Math.abs(sell||0)+Math.abs(other||0)),"IS.otherOpex");
  const gross=cogs===null?null:revenue-cogs;
  if(gross!==null&&emp!==null&&(sell!==null||other!==null)){
   const ebitda=gross-Math.abs(emp)-Math.abs(sell||0)-Math.abs(other||0);
   add(period,"EBITDA",ebitda,"IS.ebitda");
   const da=at(depreciation,i);
   if(da!==null){
    add(period,"Depreciation",-Math.abs(da),"IS.da");
    add(period,"EBIT",ebitda-Math.abs(da),"IS.ebit");
   }
  }
  const oi=at(otherIncome,i),int=at(interest,i),beforeTax=at(pbt,i),taxValue=at(tax,i),ni=at(netProfit,i);
  if(oi!==null)add(period,"Other income",oi,"IS.otherIncome");
  if(int!==null)add(period,"Interest expense",-Math.abs(int),"IS.interestExpense");
  if(beforeTax!==null)add(period,"Profit before tax",beforeTax,"IS.pbt");
  if(taxValue!==null)add(period,"Tax expense",-Math.abs(taxValue),"IS.tax");
  if(ni!==null)add(period,"Net income",ni,"IS.netIncome");
 }
 const bLabels={
  sharecapital:["equitysharecapital"],reserves:["reserves"],borrowings:["borrowings"],otherliabilities:["otherliabilities"],
  netblock:["netblock"],cwip:["capitalworkinprogress"],investments:["investments"],otherassets:["otherassets"],
  receivables:["receivables","debtors"],inventory:["inventory"],cash:["cashbank","cashandbank"]
 };
 const bRows={};Object.entries(bLabels).forEach(([key,names])=>bRows[key]=findRow(bStart,bEnd,names));
 const totals=findRows(bStart,bEnd,"total"),liabilitiesTotal=totals[0]||null,assetsTotal=totals[1]||totals[0]||null;
 for(let i=0;i<bPeriods.length;i++){
  const period=bPeriods[i];if(!period)continue;
  const get=key=>at(bRows[key],i);
  const capital=get("sharecapital"),reserves=get("reserves"),borrowings=get("borrowings"),otherLiabilities=get("otherliabilities");
  const netBlock=get("netblock"),cwip=get("cwip"),investments=get("investments"),otherAssets=get("otherassets");
  const equity=capital===null&&reserves===null?null:(capital||0)+(reserves||0);
  const ppe=netBlock===null&&cwip===null?null:(netBlock||0)+(cwip||0);
  const otherCurrent=investments===null&&otherAssets===null?null:(investments||0)+(otherAssets||0);
  if(equity!==null)add(period,"Shareholders' equity",equity,"BS.equity");
  if(borrowings!==null)add(period,"Long-term debt",Math.abs(borrowings),"BS.longDebt");
  if(otherLiabilities!==null)add(period,"Other operating liabilities",Math.abs(otherLiabilities),"BS.otherLiabilities");
  add(period,"Short-term debt",0,"BS.shortDebt");
  add(period,"Accounts payable",0,"BS.ap");
  if(ppe!==null)add(period,"Property, plant & equipment",ppe,"BS.ppe");
  if(otherCurrent!==null)add(period,"Other current assets",otherCurrent,"BS.otherCurrentAssets");
  const receivables=get("receivables"),inventory=get("inventory"),cash=get("cash");
  if(receivables!==null)add(period,"Accounts receivable",Math.abs(receivables),"BS.ar");
  if(inventory!==null)add(period,"Inventory",Math.abs(inventory),"BS.inventory");
  if(cash!==null)add(period,"Cash & cash equivalents",Math.abs(cash),"BS.cash");
  const totalAssets=at(assetsTotal,i),totalLiabilities=at(liabilitiesTotal,i);
  if(totalAssets!==null)add(period,"Total assets",totalAssets,"BS.totalAssets");
  if(totalLiabilities!==null)add(period,"Total liabilities & equity",totalLiabilities,"BS.totalLiabEquity");
 }
 const cfo=findRow(cStart,cEnd,["cashfromoperatingactivity"]);
 const cfi=findRow(cStart,cEnd,["cashfrominvestingactivity"]);
 const cff=findRow(cStart,cEnd,["cashfromfinancingactivity"]);
 for(let i=0;i<cPeriods.length;i++){
  const period=cPeriods[i];if(!period)continue;
  const operating=at(cfo,i),investing=at(cfi,i),financing=at(cff,i);
  if(operating!==null)add(period,"Cash flow from operations",operating,"CF.cfo");
  if(investing!==null)add(period,"Cash flow from investing",investing,"CF.cfi");
  if(financing!==null)add(period,"Cash flow from financing",financing,"CF.cff");
  // Screener summary exports do not give a standalone capex line.
  if(operating!==null&&investing!==null)add(period,"Free cash flow",operating+investing,"CF.fcf");
 }
 const metaRow=key=>rows.find(row=>rowLabel(row)===normaliseLabel(key));
 const companyName=String(metaRow("companyname")?.[1]??"").trim();
 const currentPrice=numValue(metaRow("currentprice")?.[1]);
 const marketCapCrores=numValue(metaRow("marketcapitalization")?.[1]);
 const shareRow=findRow(bStart,bEnd,["noofequityshares"]);
 const shareValues=shareRow?shareRow.slice(1).map(numValue).filter(value=>value!==null):[];
 const sharesOutstandingCrores=shareValues.length?shareValues.at(-1)/10000000:null;
 const dividendValues=dividend?dividend.slice(1).map(numValue).filter(value=>value!==null):[];
 const latestPeriod=pPeriods.filter(Boolean).at(-1)||bPeriods.filter(Boolean).at(-1)||null;
 const latestYear=latestPeriod?Number(latestPeriod.match(/(?:19|20)\d{2}/)?.[0]):null;
 return {
  records,companyName,currentPrice,marketCapCrores,sharesOutstandingCrores,
  dividendAmount:dividendValues.at(-1)??null,latestPeriod,latestDate:latestYear?latestYear+"-03-31":null,
  source:"Screener.in",frequency:"Annual",unit:"crores",currency:"INR",
  sourceNotes:["Annual financials were imported from the Data Sheet. Quarterly data, when present, remains separate so annual and quarterly periods are not mixed.","Standalone capex is not separately supplied; historical free cash flow is shown as operating cash flow plus net investing cash flow."]
 };
}
function num(x, fallback=0){return x===null||x===undefined||x===""||!Number.isFinite(Number(x))?fallback:Number(x);}
function lastValue(h,g,k){const arr=h[g]?.[k]||[];return num(arr[arr.length-1]);}
function atValue(h,g,k,i){return h[g]?.[k]?.[i]??null;}
function derivedValue(h,g,k,i){
 const direct=atValue(h,g,k,i);if(direct!==null&&direct!==undefined)return num(direct);
 const v=x=>num(atValue(h,g,x,i));
 if(g==="IS"&&k==="grossProfit"&&atValue(h,g,"revenue",i)!==null&&atValue(h,g,"cogs",i)!==null)return v("revenue")+v("cogs");
 if(g==="IS"&&k==="ebitda"&&atValue(h,g,"grossProfit",i)!==null)return v("grossProfit")+v("employeeExpenses")+v("otherOpex");
 if(g==="IS"&&k==="ebit"&&atValue(h,g,"ebitda",i)!==null)return v("ebitda")+v("da");
 if(g==="IS"&&k==="pbt"&&atValue(h,g,"ebit",i)!==null)return v("ebit")+v("interestExpense")+(atValue(h,g,"otherIncome",i)===null?0:v("otherIncome"));
 if(g==="IS"&&k==="netIncome"&&atValue(h,g,"pbt",i)!==null)return v("pbt")+v("tax");
 if(g==="CF"&&k==="fcf"&&atValue(h,g,"cfo",i)!==null&&atValue(h,g,"capex",i)!==null)return v("cfo")+v("capex");
 if(g==="CF"&&k==="fcf"&&atValue(h,g,"cfo",i)!==null&&atValue(h,g,"cfi",i)!==null)return v("cfo")+v("cfi");
 return null;
}
function periodSort(a,b){
 const pa=String(a),pb=String(b),na=Number(pa),nb=Number(pb);
 if(Number.isFinite(na)&&Number.isFinite(nb))return na-nb;
 const da=Date.parse(pa),db=Date.parse(pb);if(Number.isFinite(da)&&Number.isFinite(db))return da-db;
 return pa.localeCompare(pb,undefined,{numeric:true});
}
function historyFromRecords(records,mapping){
 const periods=Array.from(new Set(records.map(r=>String(r.period).trim()).filter(Boolean))).sort(periodSort);
 const h=blankHistory(periods);
 records.forEach(r=>{
  const mapped=mapping?.[r.label]??r.mapped??mapLabel(r.label);if(!mapped||mapped==="ignore")return;
  const bits=mapped.split(".");if(bits.length!==2||!h[bits[0]]||!Object.hasOwn(h[bits[0]],bits[1]))return;
  const i=periods.indexOf(String(r.period).trim());if(i>=0)h[bits[0]][bits[1]][i]=parseNumber(r.value);
 });
 return h;
}
function historicalRatios(h){
 const out=[],periods=h.periods||[];
 for(let i=0;i<periods.length;i++){
  const V=k=>derivedValue(h,"IS",k,i),B=k=>atValue(h,"BS",k,i)===null?null:num(atValue(h,"BS",k,i));
  const rev=V("revenue"),gp=V("grossProfit"),ebitda=V("ebitda"),ebit=V("ebit"),ni=V("netIncome");
  const currentAssets=["cash","ar","inventory","otherCurrentAssets"].reduce((s,k)=>s+(B(k)||0),0);
  const currentLiabilities=["ap","shortDebt","otherLiabilities"].reduce((s,k)=>s+(B(k)||0),0);
  const debt=(B("shortDebt")||0)+(B("longDebt")||0),equity=B("equity");
  const prevEq=i>0?B("equity")===null?null:((B("equity")||0)+(num(atValue(h,"BS","equity",i-1))))/2:equity;
  const prevAssets=i>0?((B("totalAssets")||0)+num(atValue(h,"BS","totalAssets",i-1)))/2:B("totalAssets");
  const prevRev=i>0?num(atValue(h,"IS","revenue",i-1)):null;
  const interest=V("interestExpense");
  out.push({
   period:periods[i],revenueGrowth:i>0&&prevRev?rev/prevRev-1:null,grossMargin:rev?gp/rev:null,ebitdaMargin:rev?ebitda/rev:null,
   ebitMargin:rev?ebit/rev:null,netMargin:rev?ni/rev:null,roe:prevEq?ni/prevEq:null,roa:prevAssets?ni/prevAssets:null,
   roce:(prevEq!==null&&debt+prevEq)?ebit/(debt+prevEq):null,currentRatio:currentLiabilities?currentAssets/currentLiabilities:null,
   quickRatio:currentLiabilities?((B("cash")||0)+(B("ar")||0))/currentLiabilities:null,
   debtEquity:equity?debt/equity:null,interestCoverage:interest?ebit/Math.abs(interest):null,
   assetTurnover:B("totalAssets")?rev/B("totalAssets"):null,workingCapital:currentAssets-currentLiabilities,
   freeCashFlow:derivedValue(h,"CF","fcf",i)
  });
 }
 return out;
}
function validateHistory(h){
 const out=[],n=h.periods?.length||0;
 const add=(ok,title,detail,severity)=>out.push({ok:!!ok,title,detail,severity:severity||(ok?"ok":"warning")});
 if(!n)add(false,"Historical periods","No historical data has been imported or loaded.");
 for(let i=0;i<n;i++){
  const p=h.periods[i];
  const required=[["Revenue",atValue(h,"IS","revenue",i)],["Cash and cash equivalents",atValue(h,"BS","cash",i)],["Total assets",atValue(h,"BS","totalAssets",i)],["Shareholders' equity",atValue(h,"BS","equity",i)],["Cash flow from operations",atValue(h,"CF","cfo",i)],["Investing cash flow / capital expenditure",atValue(h,"CF","capex",i)??atValue(h,"CF","cfi",i)]];
  const missing=required.filter(([,v])=>v===null||v===undefined).map(([label])=>label);
  add(missing.length===0,"Missing core statement data · "+p,missing.length?"Missing: "+missing.join(", "):"Core income statement, balance sheet and cash flow items are present.");
  const ta=atValue(h,"BS","totalAssets",i),tle=atValue(h,"BS","totalLiabEquity",i);
  if(ta!==null&&tle!==null)add(Math.abs(num(ta)-num(tle))<.01,"Balance sheet · "+p,Math.abs(num(ta)-num(tle))<.01?"Reported assets equal liabilities plus equity.":"Difference: "+(num(ta)-num(tle)).toFixed(2));
  else add(false,"Balance sheet · "+p,"Total assets or total liabilities and equity is missing.");
  if(i>0){
   const cashNow=atValue(h,"BS","cash",i),cashPrev=atValue(h,"BS","cash",i-1);
   const cfo=atValue(h,"CF","cfo",i),cfi=atValue(h,"CF","cfi",i),cff=atValue(h,"CF","cff",i);
   if([cashNow,cashPrev,cfo,cfi,cff].every(x=>x!==null)){
    const d=num(cashNow)-num(cashPrev)-num(cfo)-num(cfi)-num(cff);
    add(Math.abs(d)<.02,"Cash flow bridge · "+p,Math.abs(d)<.02?"Net cash flows reconcile to the change in cash.":"Change in cash differs from reported net cash flows by "+d.toFixed(2)+".");
   }else add(false,"Cash flow bridge · "+p,"Cash balances or one or more cash flow sections are missing.");
  }
  const subtotals=[
   ["Gross profit",["revenue","cogs"],"grossProfit",(a)=>a[0]+a[1]],
   ["EBITDA",["grossProfit","employeeExpenses","otherOpex"],"ebitda",(a)=>a.reduce((s,x)=>s+x,0)],
   ["EBIT",["ebitda","da"],"ebit",(a)=>a[0]+a[1]],
   ["Profit before tax",["ebit","interestExpense"],"pbt",(a)=>a[0]+a[1]+(atValue(h,"IS","otherIncome",i)??0)],
   ["Net income",["pbt","tax"],"netIncome",(a)=>a[0]+a[1]]
  ];
  subtotals.forEach(([label,inputs,result,fn])=>{
   const vals=inputs.map(k=>atValue(h,"IS",k,i)),reported=atValue(h,"IS",result,i);
   if(vals.every(x=>x!==null)&&reported!==null){const diff=fn(vals)-num(reported);add(Math.abs(diff)<.02,label+" subtotal · "+p,Math.abs(diff)<.02?"Reported subtotal agrees with its components.":"Calculated subtotal differs from reported by "+diff.toFixed(2)+".");}
  });
 }
 const ordered=h.periods.every((p,i)=>i===0||periodSort(h.periods[i-1],p)<0);
 add(ordered,"Period sequence",ordered?"Periods are unique and in ascending order.":"Periods are duplicated or out of order.");
 const missingRevenue=h.IS.revenue?.some(x=>x!==null);add(missingRevenue,"Revenue data",missingRevenue?"Revenue data is present for at least one period.":"Revenue is missing; forecasts and valuation will not be meaningful.");
 add(true,"Currency and reporting unit","Project currency and unit are metadata. Confirm that every uploaded file uses the same currency and scale; the static app does not infer or convert source units.");
 return out;
}
function buildForecast(h,a,years){
 const n=h.periods.length,last=n-1,period=h.periods[last]||"2025";
 const H=(g,k)=>num(derivedValue(h,g,k,last));
 let revenue=H("IS","revenue"),cash=H("BS","cash"),ar=H("BS","ar"),inventory=H("BS","inventory"),oca=H("BS","otherCurrentAssets"),
 ppe=H("BS","ppe"),ap=H("BS","ap"),shortDebt=H("BS","shortDebt"),longDebt=H("BS","longDebt"),otherLiabilities=H("BS","otherLiabilities"),equity=H("BS","equity");
 let baseNWC=ar+inventory+oca-ap-otherLiabilities,out=[];
 const parsed=Number(String(period).match(/(?:19|20)\d{2}/)?.[0]||period);
 for(let t=1;t<=years;t++){
  const rev=revenue*(1+a.revenueGrowth),gross=rev*a.grossMargin,cogs=gross-rev,
   emp=-rev*a.employeePct,opex=-rev*a.otherOpexPct,ebitda=gross+emp+opex,
   da=-ppe*a.daPct,ebit=ebitda+da,interest=-(shortDebt+longDebt)*a.interestRate,
   pbt=ebit+interest,tax=-Math.max(0,pbt*a.taxRate),netIncome=pbt+tax,
   nextAR=rev*a.arDays/365,nextInv=-cogs*a.inventoryDays/365,nextAP=-cogs*a.apDays/365,
   nextOCA=rev*a.otherCurrentAssetsPct,nextOtherLiab=rev*a.otherLiabilitiesPct,
   capex=rev*a.capexPct,daAddback=-da,nextPPE=ppe+capex-daAddback,
   debtRepayment=Math.min(longDebt,Math.max(0,a.annualDebtRepayment)),nextLongDebt=longDebt-debtRepayment,
   dividend=Math.max(0,netIncome*a.dividendPayout),nextEquity=equity+netIncome-dividend,
   nextNWC=nextAR+nextInv+nextOCA-nextAP-nextOtherLiab,changeNWC=nextNWC-baseNWC,
   cfo=netIncome+daAddback-changeNWC,cfi=-capex,cff=-debtRepayment-dividend,
   netChangeCash=cfo+cfi+cff,nextCash=cash+netChangeCash,
   assets=nextCash+nextAR+nextInv+nextOCA+nextPPE,
   totalLiabEquity=nextAP+shortDebt+nextLongDebt+nextOtherLiab+nextEquity;
  const year=Number.isFinite(parsed)?String(parsed+t):String(period)+" +"+t;
  out.push({year,revenueGrowth:a.revenueGrowth,revenue:rev,cogs,grossProfit:gross,employeeExpenses:emp,otherOpex:opex,ebitda,da,ebit,interestExpense:interest,pbt,tax,netIncome,
   cash:nextCash,ar:nextAR,inventory:nextInv,otherCurrentAssets:nextOCA,ppe:nextPPE,totalAssets:assets,ap:nextAP,shortDebt,longDebt:nextLongDebt,otherLiabilities:nextOtherLiab,equity:nextEquity,totalLiabEquity,check:assets-totalLiabEquity,
   cfo,capex,cfi,cff,debtRepayment,dividend,changeNWC,netChangeCash,fcf:cfo-capex});
  revenue=rev;cash=nextCash;ar=nextAR;inventory=nextInv;oca=nextOCA;ppe=nextPPE;ap=nextAP;longDebt=nextLongDebt;otherLiabilities=nextOtherLiab;equity=nextEquity;baseNWC=nextNWC;
 }
 return out;
}
function calculateWACC(d,taxRate){
 const costEquity=d.riskFreeRate+d.beta*d.equityRiskPremium,total=d.equityMarketValue+d.debtMarketValue;
 if(total<=0)return {costEquity,wacc:null,equityWeight:null,debtWeight:null};
 const equityWeight=d.equityMarketValue/total,debtWeight=d.debtMarketValue/total;
 return {costEquity,equityWeight,debtWeight,wacc:equityWeight*costEquity+debtWeight*d.costOfDebt*(1-taxRate)};
}
function calculateDCF(forecast,h,d,assumptions){
 const w=calculateWACC(d,assumptions.taxRate),tax=assumptions.taxRate;
 const flows=forecast.map((x,i)=>({year:x.year,ebit:x.ebit,nopat:x.ebit*(1-tax),daAddback:-x.da,capex:x.capex,changeNWC:x.changeNWC,ufcf:x.ebit*(1-tax)-x.da-x.capex-x.changeNWC,discountFactor:w.wacc?1/Math.pow(1+w.wacc,i+1):null}));
 const pvForecast=flows.reduce((s,x)=>s+(x.discountFactor===null?0:x.ufcf*x.discountFactor),0);
 const tail=flows[flows.length-1]||{ufcf:0},lastForecast=forecast[forecast.length-1]||{ebitda:0};
 let terminalValue=null;
 if(d.terminalMethod==="growth"&&w.wacc!==null&&w.wacc>d.perpetualGrowth)terminalValue=tail.ufcf*(1+d.perpetualGrowth)/(w.wacc-d.perpetualGrowth);
 if(d.terminalMethod==="multiple")terminalValue=lastForecast.ebitda*d.exitMultiple;
 const pvTerminal=terminalValue===null||!flows.length||!w.wacc?null:terminalValue/Math.pow(1+w.wacc,flows.length);
 const enterpriseValue=pvTerminal===null?null:pvForecast+pvTerminal;
 const netDebt=lastValue(h,"BS","shortDebt")+lastValue(h,"BS","longDebt")-lastValue(h,"BS","cash");
 const equityValue=enterpriseValue===null?null:enterpriseValue-netDebt;
 const perShare=equityValue===null||!d.sharesOutstanding?null:equityValue/d.sharesOutstanding;
 return {wacc:w.wacc,costEquity:w.costEquity,equityWeight:w.equityWeight,debtWeight:w.debtWeight,flows,pvForecast,terminalValue,pvTerminal,enterpriseValue,netDebt,equityValue,perShare};
}
function peerMultiples(peer){
 const ratio=(a,b)=>a>0&&b>0?a/b:null;
 return {evRevenue:ratio(peer.ev,peer.revenue),evEbitda:ratio(peer.ev,peer.ebitda),evEbit:ratio(peer.ev,peer.ebit),pe:ratio(peer.marketCap,peer.netIncome),pb:ratio(peer.marketCap,peer.bookEquity)};
}
function median(values){const a=values.filter(x=>Number.isFinite(x)&&x>0).sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function average(values){const a=values.filter(x=>Number.isFinite(x)&&x>0);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null;}
function peerStatistics(peers){
 const keys=["evRevenue","evEbitda","evEbit","pe","pb"],out={};
 keys.forEach(k=>{const v=peers.map(p=>peerMultiples(p)[k]);out[k]={median:median(v),average:average(v),count:v.filter(x=>Number.isFinite(x)&&x>0).length};});
 return out;
}
function operatingScenario(h,a,years,dcfInputs,terminalGrowth,terminalMultiple,method){
 const f=buildForecast(h,a,years),d={...dcfInputs,terminalMethod:method||dcfInputs.terminalMethod,perpetualGrowth:terminalGrowth??dcfInputs.perpetualGrowth,exitMultiple:terminalMultiple??dcfInputs.exitMultiple};
 return calculateDCF(f,h,d,a).enterpriseValue;
}
function formatNumber(value,d=1){return Number.isFinite(value)?value.toLocaleString("en-IN",{minimumFractionDigits:d,maximumFractionDigits:d}):"—";}
return {ITEMS,ALIASES,DEFAULT_ASSUMPTIONS,DEFAULT_DCF,DEFAULT_PEERS,SAMPLE,clone,blankHistory,defaultProject,normaliseLabel,mapLabel,parseNumber,recordsFromRows,parseScreenerDataSheet,num,historyFromRecords,historicalRatios,validateHistory,buildForecast,calculateWACC,calculateDCF,peerMultiples,peerStatistics,operatingScenario,formatNumber};
});