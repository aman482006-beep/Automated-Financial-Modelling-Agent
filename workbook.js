(function(root){
"use strict";
function col(n){let s="";while(n>0){let r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26)}return s}
function ref(c,r){return col(c)+r}
function q(sheet){return "'"+sheet.replace(/'/g,"''")+"'"}
function fcell(ws,cell,formula,value){ws[cell]={t:"n",f:formula,v:Number.isFinite(value)?value:0};}
function setStyle(ws,cell,style){if(ws[cell])ws[cell].s=style}
const styles={
 title:{font:{name:"Aptos Display",sz:16,bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"14263F"}},alignment:{vertical:"center"}},
 section:{font:{name:"Aptos",sz:10,bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"2E5F9E"}}},
 header:{font:{name:"Aptos",sz:10,bold:true,color:{rgb:"233750"}},fill:{fgColor:{rgb:"EAF0F7"}},border:{bottom:{style:"thin",color:{rgb:"CBD5E1"}}},alignment:{vertical:"center",wrapText:true}},
 input:{font:{name:"Aptos",sz:10,color:{rgb:"1F5FBF"}},fill:{fgColor:{rgb:"F1F6FF"}}},
 formula:{font:{name:"Aptos",sz:10,color:{rgb:"26384F"}}},
 text:{font:{name:"Aptos",sz:10,color:{rgb:"40516A"}}}
};
function addSheet(wb,name,rows,widths){
 const ws=XLSX.utils.aoa_to_sheet(rows);
 ws["!cols"]=(widths||[]).map(w=>({wch:w}));
 ws["!views"]=[{state:"frozen",ySplit:4,xSplit:1,topLeftCell:"B5",activePane:"bottomRight"}];
 XLSX.utils.book_append_sheet(wb,ws,name);return ws;
}
function title(ws,lastCol,titleText){ws["A1"]={v:titleText,t:"s",s:styles.title};ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:lastCol-1}}];ws["!rows"]=ws["!rows"]||[];ws["!rows"][0]={hpt:28};}
function headerRow(ws,row,cols){for(let c=1;c<=cols;c++)setStyle(ws,ref(c,row),styles.header)}
function inputCell(ws,cell,value){ws[cell]={v:value??"",t:typeof value==="number"?"n":"s",s:styles.input}}
function formulaCell(ws,cell,formula,value){fcell(ws,cell,formula,value);setStyle(ws,cell,styles.formula)}
function styleData(ws,fromRow,toRow,lastCol){for(let r=fromRow;r<=toRow;r++)for(let c=1;c<=lastCol;c++)if(ws[ref(c,r)])setStyle(ws,ref(c,r),c===1?styles.text:styles.formula)}
function addHistorical(wb,titleText,periods,group,items){
 const rows=[[titleText],["Source values · reported / imported"],["Source currency and unit are defined on the Inputs sheet."],["Line item"].concat(periods)];
 items.forEach(([key,label])=>rows.push([label].concat(periods.map((p,i)=>group[key]?.[i]??null))));
 const ws=addSheet(wb,titleText,rows,[34].concat(periods.map(()=>14)));title(ws,periods.length+1,titleText);headerRow(ws,4,periods.length+1);
 for(let r=5;r<5+items.length;r++)for(let c=2;c<=periods.length+1;c++)setStyle(ws,ref(c,r),styles.input);
 return ws;
}
function exportWorkbook(project,forecast,valuation,ratios){
 if(!root.XLSX)throw new Error("Excel writer is not available. Reload this page with internet access.");
 const X=root.XLSX,p=project.profile,h=project.history,a=project.assumptions,d=project.dcf,n=forecast.length,periods=h.periods,lastHist=h.periods.length,wb=X.utils.book_new();
 const iRows={revenue:5,cogs:6,grossProfit:7,employeeExpenses:8,otherOpex:9,ebitda:10,da:11,ebit:12,interestExpense:13,pbt:14,tax:15,netIncome:16};
 const bRows={cash:5,ar:6,inventory:7,otherCurrentAssets:8,ppe:9,totalAssets:10,ap:11,shortDebt:12,longDebt:13,otherLiabilities:14,equity:15,totalLiabEquity:16};
 const cRows={cfo:5,capex:6,cfi:7,cff:8,fcf:9};
 const histIS=addHistorical(wb,"Historical IS",periods,h.IS,[["revenue","Revenue"],["cogs","Cost of goods sold"],["grossProfit","Gross profit"],["employeeExpenses","Employee expenses"],["otherOpex","Other operating expenses"],["ebitda","EBITDA"],["da","D&A"],["ebit","EBIT"],["interestExpense","Interest expense"],["pbt","Profit before tax"],["tax","Tax expense"],["netIncome","Net income"]]);
 const histBS=addHistorical(wb,"Historical BS",periods,h.BS,[["cash","Cash and cash equivalents"],["ar","Accounts receivable"],["inventory","Inventory"],["otherCurrentAssets","Other current assets"],["ppe","PP&E"],["totalAssets","Total assets"],["ap","Accounts payable"],["shortDebt","Short-term debt"],["longDebt","Long-term debt"],["otherLiabilities","Other operating liabilities"],["equity","Shareholders' equity"],["totalLiabEquity","Total liabilities and equity"]]);
 const histCF=addHistorical(wb,"Historical CF",periods,h.CF,[["cfo","Cash flow from operations"],["capex","Capital expenditure"],["cfi","Cash flow from investing"],["cff","Cash flow from financing"],["fcf","Free cash flow"]]);
 const inputsRows=[
  ["ModelForge | Inputs and assumptions"],["Blue font / blue fill = editable source or assumption input. Formula cells link to these values."],
  ["Company",p.name],["Prepared by",p.analyst],["Industry",p.industry],["Valuation date",p.valuationDate],["Currency",p.currency],["Reporting unit",p.unit],["Reporting frequency",p.frequency],["Forecast years",project.forecastYears],
  ["FORECAST OPERATING ASSUMPTIONS"],["Revenue growth",a.revenueGrowth],["Gross margin",a.grossMargin],["Employee costs / revenue",a.employeePct],["Other operating expenses / revenue",a.otherOpexPct],["D&A / opening PP&E",a.daPct],["Effective tax rate",a.taxRate],["Capex / revenue",a.capexPct],["Receivable days",a.arDays],["Inventory days",a.inventoryDays],["Payable days",a.apDays],["Other current assets / revenue",a.otherCurrentAssetsPct],["Other operating liabilities / revenue",a.otherLiabilitiesPct],["Annual debt repayment",a.annualDebtRepayment],["Interest rate",a.interestRate],["Dividend payout ratio",a.dividendPayout],
  ["DCF AND WACC ASSUMPTIONS"],["Risk-free rate",d.riskFreeRate],["Equity risk premium",d.equityRiskPremium],["Levered beta",d.beta],["Pre-tax cost of debt",d.costOfDebt],["Market value of equity",d.equityMarketValue],["Market value of debt",d.debtMarketValue],["Shares outstanding (millions)",d.sharesOutstanding],["Terminal value method",d.terminalMethod==="growth"?"Perpetuity growth":"Exit EBITDA multiple"],["Perpetual growth rate",d.perpetualGrowth],["Exit EBITDA multiple",d.exitMultiple],["Cost of equity",""],["Equity weight",""],["Debt weight",""],["WACC",""]
 ];
 const inputs=addSheet(wb,"Inputs",inputsRows,[39,25]);title(inputs,2,"ModelForge | Inputs and assumptions");
 const inputRows={revenueGrowth:12,grossMargin:13,employeePct:14,otherOpexPct:15,daPct:16,taxRate:17,capexPct:18,arDays:19,inventoryDays:20,apDays:21,otherCurrentAssetsPct:22,otherLiabilitiesPct:23,annualDebtRepayment:24,interestRate:25,dividendPayout:26,riskFreeRate:28,equityRiskPremium:29,beta:30,costOfDebt:31,equityMarketValue:32,debtMarketValue:33,sharesOutstanding:34,terminalMethod:35,perpetualGrowth:36,exitMultiple:37};
 Object.keys(inputRows).forEach(k=>inputCell(inputs,"B"+inputRows[k],k==="terminalMethod"?(d.terminalMethod==="growth"?"Perpetuity growth":"Exit EBITDA multiple"):k==="sharesOutstanding"?d.sharesOutstanding:(d[k]??a[k])));
 formulaCell(inputs,"B38","=B28+B30*B29",valuation.costEquity);
 formulaCell(inputs,"B39","=IFERROR(B32/(B32+B33),0)",valuation.equityWeight);
 formulaCell(inputs,"B40","=IFERROR(B33/(B32+B33),0)",valuation.debtWeight);
 formulaCell(inputs,"B41","=B39*B38+B40*B31*(1-B17)",valuation.wacc);
 [3,4,5,6,7,8,9,10,11,27].forEach(r=>setStyle(inputs,"A"+r,styles.section));
 [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,28,29,30,31,32,33,34,35,36,37].forEach(r=>setStyle(inputs,"B"+r,styles.input));
 [38,39,40,41].forEach(r=>setStyle(inputs,"B"+r,styles.formula));
 inputs["!autofilter"]={ref:"A11:B26"};
 // Forecast worksheet shells.
 function forecastSheet(name,rows){const arr=[ [name],["All projected values are formulas linked to Inputs and the adjacent statement schedules."],["Currency / unit",p.currency+" / "+p.unit],["Line item"].concat(forecast.map(x=>x.year)) ];rows.forEach(label=>arr.push([label]));const ws=addSheet(wb,name,arr,[34].concat(forecast.map(()=>14)));title(ws,n+1,name);headerRow(ws,4,n+1);return ws;}
 const fis=forecastSheet("Forecast IS",["Revenue","Revenue growth","Cost of goods sold","Gross profit","Employee expenses","Other operating expenses","EBITDA","D&A","EBIT","Interest expense","Profit before tax","Tax expense","Net income"]);
 const fbs=forecastSheet("Forecast BS",["Cash and cash equivalents","Accounts receivable","Inventory","Other current assets","PP&E","Total assets","Accounts payable","Short-term debt","Long-term debt","Other operating liabilities","Shareholders' equity","Total liabilities and equity","Balance sheet check"]);
 const fcf=forecastSheet("Forecast CF",["Net income","D&A add-back","Change in net working capital","Cash flow from operations","Capital expenditure (outflow)","Cash flow from investing","Debt repayment (outflow)","Dividends (outflow)","Cash flow from financing","Net change in cash","Free cash flow"]);
 const fisr={revenue:5,growth:6,cogs:7,gross:8,employee:9,opex:10,ebitda:11,da:12,ebit:13,interest:14,pbt:15,tax:16,netIncome:17};
 const fbsr={cash:5,ar:6,inventory:7,oca:8,ppe:9,assets:10,ap:11,shortDebt:12,longDebt:13,otherLiab:14,equity:15,liabEquity:16,check:17};
 const fcfr={ni:5,da:6,deltaNWC:7,cfo:8,capex:9,cfi:10,debtRepay:11,dividends:12,cff:13,netCash:14,fcf:15};
 const histLast=col(lastHist+1);
 const histRef=(sheet,row)=>q(sheet)+"!$"+histLast+"$"+row;
 for(let j=0;j<n;j++){
  const c=j+2,C=col(c),prev=col(c-1),first=j===0;
  const hIS=(r)=>first?q("Historical IS")+"!$"+histLast+"$"+r:q("Forecast IS")+"!$"+prev+"$"+r;
  const hBS=(r)=>first?q("Historical BS")+"!$"+histLast+"$"+r:q("Forecast BS")+"!$"+prev+"$"+r;
  formulaCell(fis, C+5, "="+hIS(5)+"*(1+'Inputs'!$B$12)",forecast[j].revenue);
  formulaCell(fis, C+6, "='Inputs'!$B$12",forecast[j].revenueGrowth);
  formulaCell(fis, C+8, "="+C+"5*'Inputs'!$B$13",forecast[j].grossProfit);
  formulaCell(fis, C+7, "="+C+"8-"+C+"5",forecast[j].cogs);
  formulaCell(fis, C+9, "=-"+C+"5*'Inputs'!$B$14",forecast[j].employeeExpenses);
  formulaCell(fis, C+10, "=-"+C+"5*'Inputs'!$B$15",forecast[j].otherOpex);
  formulaCell(fis, C+11, "="+C+"8+"+C+"9+"+C+"10",forecast[j].ebitda);
  formulaCell(fis, C+12, "=-"+hBS(9)+"*'Inputs'!$B$16",forecast[j].da);
  formulaCell(fis, C+13, "="+C+"11+"+C+"12",forecast[j].ebit);
  formulaCell(fis, C+14, "=-("+hBS(12)+"+"+hBS(13)+")*'Inputs'!$B$25",forecast[j].interestExpense);
  formulaCell(fis, C+15, "="+C+"13+"+C+"14",forecast[j].pbt);
  formulaCell(fis, C+16, "=-MAX(0,"+C+"15*'Inputs'!$B$17)",forecast[j].tax);
  formulaCell(fis, C+17, "="+C+"15+"+C+"16",forecast[j].netIncome);
  formulaCell(fcf,C+5,"="+q("Forecast IS")+"!"+C+"17",forecast[j].netIncome);
  formulaCell(fcf,C+6,"=-"+q("Forecast IS")+"!"+C+"12",-forecast[j].da);
  const prevNWC=first?"("+q("Historical BS")+"!"+histLast+"6+"+q("Historical BS")+"!"+histLast+"7+"+q("Historical BS")+"!"+histLast+"8-"+q("Historical BS")+"!"+histLast+"11-"+q("Historical BS")+"!"+histLast+"14)": "("+q("Forecast BS")+"!"+prev+"6+"+q("Forecast BS")+"!"+prev+"7+"+q("Forecast BS")+"!"+prev+"8-"+q("Forecast BS")+"!"+prev+"11-"+q("Forecast BS")+"!"+prev+"14)";
  const currNWC="("+q("Forecast BS")+"!"+C+"6+"+q("Forecast BS")+"!"+C+"7+"+q("Forecast BS")+"!"+C+"8-"+q("Forecast BS")+"!"+C+"11-"+q("Forecast BS")+"!"+C+"14)";
  formulaCell(fcf,C+7,"="+currNWC+"-"+prevNWC,forecast[j].changeNWC);
  formulaCell(fcf,C+8,"="+C+"5+"+C+"6-"+C+"7",forecast[j].cfo);
  formulaCell(fcf,C+9,"=-"+q("Forecast IS")+"!"+C+"5*'Inputs'!$B$18",-forecast[j].capex);
  formulaCell(fcf,C+10,"="+C+"9",-forecast[j].capex);
  formulaCell(fcf,C+11,"=-MIN('Inputs'!$B$24,"+hBS(13)+")",-forecast[j].debtRepayment);
  formulaCell(fcf,C+12,"=-MAX(0,"+C+"5*'Inputs'!$B$26)",-forecast[j].dividend);
  formulaCell(fcf,C+13,"="+C+"11+"+C+"12",forecast[j].cff);
  formulaCell(fcf,C+14,"="+C+"8+"+C+"10+"+C+"13",forecast[j].netChangeCash);
  formulaCell(fcf,C+15,"="+C+"8+"+C+"9",forecast[j].fcf);
  formulaCell(fbs,C+5,"="+hBS(5)+"+"+q("Forecast CF")+"!"+C+"14",forecast[j].cash);
  formulaCell(fbs,C+6,"="+q("Forecast IS")+"!"+C+"5*'Inputs'!$B$19/365",forecast[j].ar);
  formulaCell(fbs,C+7,"=-"+q("Forecast IS")+"!"+C+"7*'Inputs'!$B$20/365",forecast[j].inventory);
  formulaCell(fbs,C+8,"="+q("Forecast IS")+"!"+C+"5*'Inputs'!$B$22",forecast[j].otherCurrentAssets);
  formulaCell(fbs,C+9,"="+hBS(9)+"-"+q("Forecast CF")+"!"+C+"9-"+q("Forecast CF")+"!"+C+"6",forecast[j].ppe);
  formulaCell(fbs,C+10,"=SUM("+C+"5:"+C+"9)",forecast[j].totalAssets);
  formulaCell(fbs,C+11,"=-"+q("Forecast IS")+"!"+C+"7*'Inputs'!$B$21/365",forecast[j].ap);
  formulaCell(fbs,C+12,"="+hBS(12),forecast[j].shortDebt);
  formulaCell(fbs,C+13,"="+hBS(13)+"+"+q("Forecast CF")+"!"+C+"11",forecast[j].longDebt);
  formulaCell(fbs,C+14,"="+q("Forecast IS")+"!"+C+"5*'Inputs'!$B$23",forecast[j].otherLiabilities);
  formulaCell(fbs,C+15,"="+hBS(15)+"+"+q("Forecast IS")+"!"+C+"17+"+q("Forecast CF")+"!"+C+"12",forecast[j].equity);
  formulaCell(fbs,C+16,"=SUM("+C+"11:"+C+"15)",forecast[j].totalLiabEquity);
  formulaCell(fbs,C+17,"="+C+"10-"+C+"16",forecast[j].check);
 }
 // Formula-linked historical ratios.
 const ratioNames=[["Revenue growth","revenueGrowth"],["Gross margin","grossMargin"],["EBITDA margin","ebitdaMargin"],["EBIT margin","ebitMargin"],["Net margin","netMargin"],["ROE","roe"],["ROA","roa"],["ROCE","roce"],["Current ratio","currentRatio"],["Quick ratio","quickRatio"],["Debt / equity","debtEquity"],["Interest coverage","interestCoverage"],["Asset turnover","assetTurnover"],["Working capital","workingCapital"],["Free cash flow","freeCashFlow"]];
 const ratioRows=[["Historical ratios"],["Calculated formulas link to historical statement inputs."],["Metric"].concat(periods)];
 ratioNames.forEach(x=>ratioRows.push([x[0]].concat(periods.map(()=>null))));
 const ratioSheet=addSheet(wb,"Ratios",ratioRows,[30].concat(periods.map(()=>14)));title(ratioSheet,periods.length+1,"Historical financial ratios");headerRow(ratioSheet,3,periods.length+1);
 for(let j=0;j<periods.length;j++){
  const C=col(j+2),prev=col(j+1),pfx=q("Historical IS")+"!"+C,pbfx=q("Historical BS")+"!"+C,pcfx=q("Historical CF")+"!"+C;
  const fx=[
   j===0?"=NA()":"=IFERROR("+pfx+"5/"+q("Historical IS")+"!"+prev+"5-1,NA())",
   "=IFERROR("+pfx+"7/"+pfx+"5,NA())",
   "=IFERROR("+pfx+"10/"+pfx+"5,NA())",
   "=IFERROR("+pfx+"12/"+pfx+"5,NA())",
   "=IFERROR("+pfx+"16/"+pfx+"5,NA())",
   "=IFERROR("+pfx+"16/AVERAGE("+pbfx+"15,"+(j===0?pbfx+"15":q("Historical BS")+"!"+prev+"15")+"),NA())",
   "=IFERROR("+pfx+"16/AVERAGE("+pbfx+"10,"+(j===0?pbfx+"10":q("Historical BS")+"!"+prev+"10")+"),NA())",
   "=IFERROR("+pfx+"12/(AVERAGE("+pbfx+"15,"+(j===0?pbfx+"15":q("Historical BS")+"!"+prev+"15")+")+AVERAGE("+pbfx+"12+"+pbfx+"13,"+(j===0?pbfx+"12+"+pbfx+"13":q("Historical BS")+"!"+prev+"12+"+q("Historical BS")+"!"+prev+"13")+")),NA())",
   "=IFERROR(("+pbfx+"5+"+pbfx+"6+"+pbfx+"7+"+pbfx+"8)/("+pbfx+"11+"+pbfx+"12+"+pbfx+"14+0),NA())",
   "=IFERROR(("+pbfx+"5+"+pbfx+"6)/("+pbfx+"11+"+pbfx+"12+"+pbfx+"14+0),NA())",
   "=IFERROR(("+pbfx+"12+"+pbfx+"13)/"+pbfx+"15,NA())",
   "=IFERROR("+pfx+"12/ABS("+pfx+"13),NA())",
   "=IFERROR("+pfx+"5/"+pbfx+"10,NA())",
   "="+pbfx+"5+"+pbfx+"6+"+pbfx+"7+"+pbfx+"8-"+pbfx+"11-"+pbfx+"12-"+pbfx+"14",
   "=IFERROR("+pcfx+"5+"+pcfx+"6,NA())"
  ];
  fx.forEach((formula,i)=>formulaCell(ratioSheet,C+(4+i),formula,Number.isFinite(ratios[j]?.[ratioNames[i][1]])?ratios[j][ratioNames[i][1]]:0));
 }
 // DCF schedule, with formula references to forecasts.
 const dcfRows=[["Discounted cash flow valuation"],["All valuation lines are calculated from Forecast IS, Forecast CF and Inputs."],["WACC",""],["Cost of equity",""],["Tax rate",""],["Terminal value method",""],[""],["Forecast period","EBIT","NOPAT","D&A add-back","Capex","Change in NWC","UFCF","Discount factor","PV of UFCF"]];
 for(let i=0;i<n;i++)dcfRows.push([forecast[i].year,null,null,null,null,null,null,null,null]);
 const dcfSheet=addSheet(wb,"DCF",dcfRows,[29,15,15,16,15,17,15,15,15]);title(dcfSheet,9,"Discounted cash flow valuation");
 formulaCell(dcfSheet,"B3","='Inputs'!$B$41",valuation.wacc);formulaCell(dcfSheet,"B4","='Inputs'!$B$38",valuation.costEquity);formulaCell(dcfSheet,"B5","='Inputs'!$B$17",a.taxRate);
 dcfSheet["B6"]={v:d.terminalMethod==="growth"?"Perpetuity growth":"Exit EBITDA multiple",t:"s",s:styles.input};
 for(let j=0;j<n;j++){const C=col(j+2),r=9+j;
  formulaCell(dcfSheet,"B"+r,"="+q("Forecast IS")+"!"+C+"13",forecast[j].ebit);
  formulaCell(dcfSheet,"C"+r,"=B"+r+"*(1-$B$5)",forecast[j].ebit*(1-a.taxRate));
  formulaCell(dcfSheet,"D"+r,"=-"+q("Forecast IS")+"!"+C+"12",-forecast[j].da);
  formulaCell(dcfSheet,"E"+r,"=-"+q("Forecast CF")+"!"+C+"9",forecast[j].capex);
  formulaCell(dcfSheet,"F"+r,"="+q("Forecast CF")+"!"+C+"7",forecast[j].changeNWC);
  formulaCell(dcfSheet,"G"+r,"=C"+r+"+D"+r+"-E"+r+"-F"+r,valuation.flows[j].ufcf);
  formulaCell(dcfSheet,"H"+r,"=1/(1+$B$3)^"+(j+1),valuation.flows[j].discountFactor||0);
  formulaCell(dcfSheet,"I"+r,"=G"+r+"*H"+r,valuation.flows[j].ufcf*(valuation.flows[j].discountFactor||0));
 }
 const lastDcf=8+n, terminalRow=lastDcf+2, lastFc=col(n+1);
 dcfSheet["A"+terminalRow]={v:"Terminal value",t:"s"};dcfSheet["A"+(terminalRow+1)]={v:"PV of terminal value",t:"s"};dcfSheet["A"+(terminalRow+2)]={v:"PV of forecast UFCF",t:"s"};dcfSheet["A"+(terminalRow+3)]={v:"Enterprise value",t:"s"};dcfSheet["A"+(terminalRow+4)]={v:"Net debt",t:"s"};dcfSheet["A"+(terminalRow+5)]={v:"Equity value",t:"s"};dcfSheet["A"+(terminalRow+6)]={v:"Shares outstanding",t:"s"};dcfSheet["A"+(terminalRow+7)]={v:"Implied value per share",t:"s"};
 formulaCell(dcfSheet,"B"+terminalRow,'=IF(\'Inputs\'!$B$35="Perpetuity growth",IF($B$3>\'Inputs\'!$B$36,\'DCF\'!G'+lastDcf+'*(1+\'Inputs\'!$B$36)/($B$3-\'Inputs\'!$B$36),NA()),\'Forecast IS\'!'+lastFc+'11*\'Inputs\'!$B$37)',valuation.terminalValue||0);
 formulaCell(dcfSheet,"B"+(terminalRow+1),"=B"+terminalRow+"*H"+lastDcf,valuation.pvTerminal||0);
 formulaCell(dcfSheet,"B"+(terminalRow+2),"=SUM(I9:I"+lastDcf+")",valuation.pvForecast);
 formulaCell(dcfSheet,"B"+(terminalRow+3),"=B"+(terminalRow+1)+"+B"+(terminalRow+2),valuation.enterpriseValue||0);
 formulaCell(dcfSheet,"B"+(terminalRow+4),"="+q("Historical BS")+"!"+histLast+"12+"+q("Historical BS")+"!"+histLast+"13-"+q("Historical BS")+"!"+histLast+"5",valuation.netDebt);
 formulaCell(dcfSheet,"B"+(terminalRow+5),"=B"+(terminalRow+3)+"-B"+(terminalRow+4),valuation.equityValue||0);
 formulaCell(dcfSheet,"B"+(terminalRow+6),"='Inputs'!$B$34",d.sharesOutstanding);
 formulaCell(dcfSheet,"B"+(terminalRow+7),"=IFERROR(B"+(terminalRow+5)+"/B"+(terminalRow+6)+",NA())",valuation.perShare||0);
 headerRow(dcfSheet,8,9);styleData(dcfSheet,9,lastDcf,9);
 // Comparables: entered peer facts are blue; every multiple and summary is formula-driven.
 const compsRows=[["Trading comparables"],["Synthetic labels are sample data only; replace with sourced peer values."],["Company","Synthetic?","EV","Revenue","EBITDA","EBIT","Net income","Market cap","Book equity","EV / Revenue","EV / EBITDA","EV / EBIT","P / E","P / Book"]];
 const peerStart=4;
 project.peers.forEach(p=>compsRows.push([p.name,p.synthetic?"YES":"NO",p.ev,p.revenue,p.ebitda,p.ebit,p.netIncome,p.marketCap,p.bookEquity,null,null,null,null,null]));
 compsRows.push(["Median","","","","","","","","",null,null,null,null,null]);compsRows.push(["Average","","","","","","","","",null,null,null,null,null]);
 const comps=addSheet(wb,"Comparables",compsRows,[32,12,14,14,14,14,14,14,14,14,14,14,12,12]);title(comps,14,"Trading comparables");
 const peerEnd=peerStart+project.peers.length-1,medianRow=peerEnd+1,averageRow=peerEnd+2;
 project.peers.forEach((peer,i)=>{const r=peerStart+i;for(let c=1;c<=9;c++)setStyle(comps,ref(c,r),styles.input);formulaCell(comps,"J"+r,"=IFERROR(C"+r+"/D"+r+",NA())",E.peerMultiples(peer).evRevenue||0);formulaCell(comps,"K"+r,"=IFERROR(C"+r+"/E"+r+",NA())",E.peerMultiples(peer).evEbitda||0);formulaCell(comps,"L"+r,"=IFERROR(C"+r+"/F"+r+",NA())",E.peerMultiples(peer).evEbit||0);formulaCell(comps,"M"+r,"=IFERROR(H"+r+"/G"+r+",NA())",E.peerMultiples(peer).pe||0);formulaCell(comps,"N"+r,"=IFERROR(H"+r+"/I"+r+",NA())",E.peerMultiples(peer).pb||0)});
 ["J","K","L","M","N"].forEach(C=>{formulaCell(comps,C+medianRow,"=IFERROR(MEDIAN("+C+peerStart+":"+C+peerEnd+"),NA())",0);formulaCell(comps,C+averageRow,"=IFERROR(AVERAGE("+C+peerStart+":"+C+peerEnd+"),NA())",0)});
 comps["A"+medianRow]={v:"Median",t:"s"};comps["A"+averageRow]={v:"Average",t:"s"};
 const impRow=averageRow+2;comps["A"+impRow]={v:"Target implied enterprise value",t:"s"};comps["A"+(impRow+1)]={v:"EV / Revenue",t:"s"};comps["A"+(impRow+2)]={v:"EV / EBITDA",t:"s"};comps["A"+(impRow+3)]={v:"EV / EBIT",t:"s"};
 formulaCell(comps,"B"+(impRow+1),"=J"+medianRow+"*"+q("Historical IS")+"!"+histLast+"5",null);
 formulaCell(comps,"B"+(impRow+2),"=K"+medianRow+"*"+q("Historical IS")+"!"+histLast+"10",null);
 formulaCell(comps,"B"+(impRow+3),"=L"+medianRow+"*"+q("Historical IS")+"!"+histLast+"12",null);
 headerRow(comps,3,14);
 // Sensitivity formulas: formula cells are live in Excel, not hard-coded snapshots.
 const sensRows=[["Sensitivity analysis"],["Formula-driven scenario values. Change the WACC / terminal inputs on Inputs to update."],["WACC vs Perpetual Growth"],["WACC ↓ / Growth →",-2,-1,0,1,2],[""]];
 for(let s=-2;s<=2;s++)sensRows.push([null]);
 const sens=addSheet(wb,"Sensitivity",sensRows,[31,14,14,14,14,14]);title(sens,6,"Sensitivity analysis");
 for(let j=0;j<5;j++){const c=col(j+2);formulaCell(sens,c+"4","='Inputs'!$B$36"+(j-2>=0?"+":"")+(j-2)*.01,project.dcf.perpetualGrowth+(j-2)*.01)}
 for(let i=0;i<5;i++){const r=5+i;formulaCell(sens,"A"+r,"='Inputs'!$B$41"+(i-2>=0?"+":"")+(i-2)*.01,valuation.wacc+(i-2)*.01);for(let j=0;j<5;j++){const C=col(j+2),terms=[];for(let t=0;t<n;t++)terms.push(q("DCF")+"!$G$"+(9+t)+"/(1+$A"+r+")^"+(t+1));const term="IF($A"+r+">"+C+"$4,"+q("DCF")+"!$G$"+lastDcf+"*(1+"+C+"$4)/($A"+r+"-"+C+"$4)/(1+$A"+r+")^"+n+",NA())";const cached=dcfAt(valuation.wacc+(i-2)*.01,"growth",project.dcf.perpetualGrowth+(j-2)*.01,project.dcf.exitMultiple);formulaCell(sens,C+r,"="+terms.join("+")+"+"+term,cached)}}
 const start2=14;sens["A"+start2]={v:"WACC vs Exit EBITDA multiple",t:"s"};sens["A"+(start2+1)]={v:"WACC ↓ / Multiple →",t:"s"};
 for(let j=0;j<5;j++){const C=col(j+2);formulaCell(sens,C+(start2+1),"='Inputs'!$B$37"+(j-2>=0?"+":"")+(j-2)*1,project.dcf.exitMultiple+(j-2)*1)}
 for(let i=0;i<5;i++){const r=start2+2+i;const rate=valuation.wacc+(i-2)*.01;formulaCell(sens,"A"+r,"='Inputs'!$B$41"+(i-2>=0?"+":"")+(i-2)*.01,rate);for(let j=0;j<5;j++){const C=col(j+2),terms=[];for(let t=0;t<n;t++)terms.push(q("DCF")+"!$G$"+(9+t)+"/(1+$A"+r+")^"+(t+1));const terminal=q("Forecast IS")+"!"+lastFc+"11*"+C+(start2+1)+"/(1+$A"+r+")^"+n;formulaCell(sens,C+r,"="+terms.join("+")+"+"+terminal,dcfAt(rate,"multiple",project.dcf.perpetualGrowth,project.dcf.exitMultiple+(j-2)*1))}}
 // Third sensitivity: each growth / EBITDA-margin pair has its own transparent formula schedule.
 const opBase=26;sens["A"+opBase]={v:"Revenue growth vs EBITDA margin",t:"s"};sens["A"+(opBase+1)]={v:"Growth ↓ / EBITDA margin →",t:"s"};
 const baseEbitda=project.assumptions.grossMargin-project.assumptions.employeePct-project.assumptions.otherOpexPct;
 for(let j=0;j<5;j++){const C=col(j+2);formulaCell(sens,C+(opBase+1),"='Inputs'!$B$13-'Inputs'!$B$14-'Inputs'!$B$15"+(j-2>=0?"+":"")+(j-2)*.02,baseEbitda+(j-2)*.02)}
 for(let i=0;i<5;i++){const r=opBase+2+i;formulaCell(sens,"A"+r,"='Inputs'!$B$12"+(i-2>=0?"+":"")+(i-2)*.02,project.assumptions.revenueGrowth+(i-2)*.02)}
 const scen=addSheet(wb,"Scenario Calc",[["Operating scenario detail"],["Every scenario is calculated from the editable growth and EBITDA-margin axes on Sensitivity."],["Scenario","Year","Revenue","EBITDA margin","Revenue","Gross profit","COGS","EBITDA","Opening PP&E","D&A","EBIT","NOPAT","D&A add-back","Capex","PP&E","AR","Inventory","Other CA","AP","Other liabilities","NWC","Change NWC","UFCF","Discount factor","PV UFCF"]],[34,13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,16,14,14,14,14,14]);
 title(scen,25,"Operating scenario calculation detail");let row=4,scenarioCells={};
 const hLast=col(lastHist+1),startRev=E.num(h.IS.revenue.at(-1)),startPPE=E.num(h.BS.ppe.at(-1)),startAR=E.num(h.BS.ar.at(-1)),startInv=E.num(h.BS.inventory.at(-1)),startOca=E.num(h.BS.otherCurrentAssets.at(-1)),startAP=E.num(h.BS.ap.at(-1)),startOl=E.num(h.BS.otherLiabilities.at(-1)),startNwc=startAR+startInv+startOca-startAP-startOl;
 for(let i=0;i<5;i++)for(let j=0;j<5;j++){
  const sensGrowthRow=opBase+2+i,sensMarginCol=col(j+2),blockTitle=row;
  scen["A"+row]={v:"Scenario "+(i*5+j+1),t:"s",s:styles.section};row++;
  scen["A"+row]={v:"Revenue growth",t:"s"};formulaCell(scen,"B"+row,"="+q("Sensitivity")+"!$A$"+sensGrowthRow,project.assumptions.revenueGrowth+(i-2)*.02);const growRef="$B$"+row;row++;
  scen["A"+row]={v:"EBITDA margin",t:"s"};formulaCell(scen,"B"+row,"="+q("Sensitivity")+"!"+sensMarginCol+"$"+(opBase+1),baseEbitda+(j-2)*.02);const marginRef="$B$"+row;row++;
  scen["A"+row]={v:"Financial driver",t:"s"};for(let t=0;t<n;t++)scen[ref(t+2,row)]={v:forecast[t].year,t:"s"};headerRow(scen,row,n+1);row++;
  const rows={};const labels=["Revenue","Gross margin","Gross profit","COGS","Employee expense","Other opex","EBITDA","Opening PP&E","D&A","EBIT","NOPAT","D&A add-back","Capex","Closing PP&E","Receivables","Inventory","Other current assets","Accounts payable","Other operating liabilities","Net working capital","Change in NWC","UFCF","Discount factor","PV of UFCF"];
  labels.forEach(label=>{rows[label]=row;scen["A"+row]={v:label,t:"s"};row++});
  let prevRev=null,prevPpe=null,prevNwc=null;
  for(let t=0;t<n;t++){const C=col(t+2),prev=col(t+1),first=t===0;
   const openingRev=first?null:q("Scenario Calc")+"!"+prev+rows.Revenue;
   const revenueFormula=first?"="+startRev+"*(1+"+growRef+")":"="+openingRev+"*(1+"+growRef+")";
   formulaCell(scen,C+rows.Revenue,revenueFormula,forecast[t].revenue);
   formulaCell(scen,C+rows["Gross margin"],"="+marginRef+"+'Inputs'!$B$14+'Inputs'!$B$15",baseEbitda);
   formulaCell(scen,C+rows["Gross profit"],"="+C+rows.Revenue+"*"+C+rows["Gross margin"],forecast[t].grossProfit);
   formulaCell(scen,C+rows.COGS,"="+C+rows["Gross profit"]+"-"+C+rows.Revenue,forecast[t].cogs);
   formulaCell(scen,C+rows["Employee expense"],"=-"+C+rows.Revenue+"*'Inputs'!$B$14",forecast[t].employeeExpenses);
   formulaCell(scen,C+rows["Other opex"],"=-"+C+rows.Revenue+"*'Inputs'!$B$15",forecast[t].otherOpex);
   formulaCell(scen,C+rows.EBITDA,"=SUM("+C+rows["Gross profit"]+","+C+rows["Employee expense"]+","+C+rows["Other opex"]+")",forecast[t].ebitda);
   formulaCell(scen,C+rows["Opening PP&E"],"="+(first?startPPE:q("Scenario Calc")+"!"+prev+rows["Closing PP&E"]),forecast[t].ppe);
   formulaCell(scen,C+rows.DA,"=-"+C+rows["Opening PP&E"]+"*'Inputs'!$B$16",forecast[t].da);
   formulaCell(scen,C+rows.EBIT,"="+C+rows.EBITDA+"+"+C+rows.DA,forecast[t].ebit);
   formulaCell(scen,C+rows.NOPAT,"="+C+rows.EBIT+"*(1-'Inputs'!$B$17)",forecast[t].ebit*(1-a.taxRate));
   formulaCell(scen,C+rows["D&A add-back"],"=-"+C+rows.DA,-forecast[t].da);
   formulaCell(scen,C+rows.Capex,"="+C+rows.Revenue+"*'Inputs'!$B$18",forecast[t].capex);
   formulaCell(scen,C+rows["Closing PP&E"],"="+C+rows["Opening PP&E"]+"+"+C+rows.Capex+"-"+C+rows["D&A add-back"],forecast[t].ppe);
   formulaCell(scen,C+rows.Receivables,"="+C+rows.Revenue+"*'Inputs'!$B$19/365",forecast[t].ar);
   formulaCell(scen,C+rows.Inventory,"=-"+C+rows.COGS+"*'Inputs'!$B$20/365",forecast[t].inventory);
   formulaCell(scen,C+rows["Other current assets"],"="+C+rows.Revenue+"*'Inputs'!$B$22",forecast[t].otherCurrentAssets);
   formulaCell(scen,C+rows["Accounts payable"],"=-"+C+rows.COGS+"*'Inputs'!$B$21/365",forecast[t].ap);
   formulaCell(scen,C+rows["Other operating liabilities"],"="+C+rows.Revenue+"*'Inputs'!$B$23",forecast[t].otherLiabilities);
   formulaCell(scen,C+rows["Net working capital"],"="+C+rows.Receivables+"+"+C+rows.Inventory+"+"+C+rows["Other current assets"]+"-"+C+rows["Accounts payable"]+"-"+C+rows["Other operating liabilities"],forecast[t].ar+forecast[t].inventory+forecast[t].otherCurrentAssets-forecast[t].ap-forecast[t].otherLiabilities);
   const prevNwcRef=first?String(startNwc):q("Scenario Calc")+"!"+prev+rows["Net working capital"];
   formulaCell(scen,C+rows["Change in NWC"],"="+C+rows["Net working capital"]+"-"+prevNwcRef,forecast[t].changeNWC);
   formulaCell(scen,C+rows.UFCF,"="+C+rows.NOPAT+"+"+C+rows["D&A add-back"]+"-"+C+rows.Capex+"-"+C+rows["Change in NWC"],forecast[t].ebit*(1-a.taxRate)-forecast[t].da-forecast[t].capex-forecast[t].changeNWC);
   formulaCell(scen,C+rows["Discount factor"],"=1/(1+'Inputs'!$B$41)^"+(t+1),1/Math.pow(valuation.wacc,t+1));
   formulaCell(scen,C+rows["PV of UFCF"],"="+C+rows.UFCF+"*"+C+rows["Discount factor"],0);
  }
  const terminalFormula="=IF('Inputs'!$B$35=\"Perpetuity growth\",IF('Inputs'!$B$41>'Inputs'!$B$36,"+lastFc+rows.UFCF+"*(1+'Inputs'!$B$36)/('Inputs'!$B$41-'Inputs'!$B$36),NA()),"+lastFc+rows.EBITDA+"*'Inputs'!$B$37)";
  const terminalValue=project.dcf.terminalMethod==="growth"?(valuation.wacc>project.dcf.perpetualGrowth?forecast.at(-1).ufcf*(1+project.dcf.perpetualGrowth)/(valuation.wacc-project.dcf.perpetualGrowth):0):forecast.at(-1).ebitda*project.dcf.exitMultiple;
  row++;scen["A"+row]={v:"Terminal value",t:"s"};formulaCell(scen,"B"+row,terminalFormula,terminalValue);const tvRef="B"+row;row++;
  scen["A"+row]={v:"PV terminal value",t:"s"};formulaCell(scen,"B"+row,"="+tvRef+"*"+lastFc+rows["Discount factor"],terminalValue/Math.pow(1+valuation.wacc,n));const pvtvRef="B"+row;row++;
  scen["A"+row]={v:"Scenario enterprise value",t:"s"};formulaCell(scen,"B"+row,"=SUM("+col(2)+rows["PV of UFCF"]+":"+lastFc+rows["PV of UFCF"]+")+"+pvtvRef,0);scenarioCells[i+","+j]="B"+row;row+=2;
 }
 // Tie operating scenario grid to the detailed scenario formulas.
 for(let i=0;i<5;i++)for(let j=0;j<5;j++){const C=col(j+2),r=opBase+2+i,cell=scenarioCells[i+","+j];const value=E.operatingScenario(h,{...a,revenueGrowth:a.revenueGrowth+(i-2)*.02,grossMargin:baseEbitda+(j-2)*.02+a.employeePct+a.otherOpexPct},project.forecastYears,d);formulaCell(sens,C+r,"="+q("Scenario Calc")+"!"+cell,value||0)}
 headerRow(sens,4,6);headerRow(sens,start2+1,6);headerRow(sens,opBase+1,6);styleData(sens,5,9,6);styleData(sens,start2+2,start2+6,6);styleData(sens,opBase+2,opBase+6,6);
 // Checks: all checks link back to forecast formulas and reported source rows.
 const checkRows=[["Model checks"],["Check","Period","Calculated","Status"],["Forecast balance sheet","",null,null]];
 for(let j=0;j<n;j++){const C=col(j+2);checkRows.push(["Forecast balance sheet",forecast[j].year,null,null])}
 for(let j=0;j<periods.length;j++)checkRows.push(["Reported balance sheet",periods[j],null,null]);
 const checks=addSheet(wb,"Checks",checkRows,[32,16,18,18]);title(checks,4,"Model reconciliation checks");headerRow(checks,3,4);
 for(let j=0;j<n;j++){const r=4+j,C=col(j+2);formulaCell(checks,"C"+r,"="+q("Forecast BS")+"!"+C+"17",forecast[j].check);formulaCell(checks,"D"+r,'=IF(ABS(C'+r+')<0.01,"PASS","REVIEW")',Math.abs(forecast[j].check)<.01?1:0)}
 for(let j=0;j<periods.length;j++){const r=4+n+j,C=col(j+2);formulaCell(checks,"C"+r,"="+q("Historical BS")+"!"+C+"10-"+q("Historical BS")+"!"+C+"16",0);formulaCell(checks,"D"+r,'=IF(ABS(C'+r+')<0.01,"PASS","REVIEW")',1)}
 // Cover sheet: concise, linked and presentable.
 const coverRows=[["MODELFORGE | FINANCIAL ANALYSIS REPORT"],["Company",p.name],["Prepared by",p.analyst],["Industry",p.industry],["Valuation date",p.valuationDate],["Currency / unit",p.currency+" / "+p.unit],["Reporting frequency",p.frequency],["Forecast horizon",n+" years"],[""],["VALUATION SUMMARY"],["WACC",""],["Enterprise value",""],["Net debt",""],["Equity value",""],["Value per share",""],[""],["REPORT STRUCTURE"],["Historical statements","Historical IS / Historical BS / Historical CF"],["Forecast statements","Forecast IS / Forecast BS / Forecast CF"],["Valuation","DCF / Comparables / Sensitivity"],["Controls","Inputs / Checks / Scenario Calc"]];
 const cover=addSheet(wb,"Cover",coverRows,[31,58]);title(cover,2,"MODELFORGE | FINANCIAL ANALYSIS REPORT");
 formulaCell(cover,"B11","="+q("Inputs")+"!B41",valuation.wacc);formulaCell(cover,"B12","="+q("DCF")+"!B"+(terminalRow+3),valuation.enterpriseValue||0);formulaCell(cover,"B13","="+q("DCF")+"!B"+(terminalRow+4),valuation.netDebt);formulaCell(cover,"B14","="+q("DCF")+"!B"+(terminalRow+5),valuation.equityValue||0);formulaCell(cover,"B15","="+q("DCF")+"!B"+(terminalRow+7),valuation.perShare||0);
 [10,17].forEach(r=>setStyle(cover,"A"+r,styles.section));
 // Workbook recalculate in Excel / LibreOffice when opened.
 wb.Workbook=wb.Workbook||{};wb.Workbook.CalcPr={calcId:191029,fullCalcOnLoad:true,forceFullCalc:true,calcMode:"auto"};
 const filename=(p.name||"Company").replace(/[^a-z0-9]+/gi,"_")+"_Integrated_Financial_Model.xlsx";
 X.writeFile(wb,filename,{cellStyles:true});
 return filename;
}
root.ModelWorkbook={exportWorkbook};
})(window);