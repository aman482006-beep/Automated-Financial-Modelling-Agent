(function(){
"use strict";
const E=window.ModelEngine,$=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const KEY="modelforge.project.v2",symbols={INR:"₹",USD:"$",EUR:"€",GBP:"£",SGD:"S$"};
let project=normaliseProject(loadSaved()||E.defaultProject()),forecast=[],ratios=[],valuation,modelStatus,noticeTimer;
const EMPTY_VALUATION={valid:false,errors:["Complete the required historical inputs before calculating valuation."],wacc:null,costEquity:null,equityWeight:null,debtWeight:null,flows:[],pvForecast:null,terminalValue:null,pvTerminal:null,enterpriseValue:null,netDebt:null,equityValue:null,perShare:null};

function normaliseProject(p){
 p=p&&typeof p==="object"?p:{};
 const today=String(new Date().getFullYear());
 p.profile={name:"",analyst:"Financial Analyst",industry:"",valuationDate:new Date().toISOString().slice(0,10),currency:"INR",unit:"millions",frequency:"Annual",sharesOutstanding:100,...(p.profile||{})};
 const old=p.history&&typeof p.history==="object"?p.history:{};
 let periods=Array.isArray(old.periods)?old.periods.map(x=>String(x).trim()).filter(Boolean):[];
 periods=Array.from(new Set(periods));
 if(!periods.length)periods=[today];
 const history=E.blankHistory(periods);
 Object.keys(E.ITEMS).forEach(group=>E.ITEMS[group].forEach(([key])=>{
  const values=Array.isArray(old[group]?.[key])?old[group][key]:[];
  history[group][key]=periods.map((_,i)=>values[i]??null);
 }));
 p.history=history;
 if(!Array.isArray(p.history.IS.otherIncome))p.history.IS.otherIncome=periods.map(()=>0);
 p.assumptions={...E.clone(E.DEFAULT_ASSUMPTIONS),...(p.assumptions||{})};
 p.dcf={...E.clone(E.DEFAULT_DCF),...(p.dcf||{})};
 p.peers=Array.isArray(p.peers)?p.peers:E.clone(E.DEFAULT_PEERS);
 p.mapping=p.mapping&&typeof p.mapping==="object"?p.mapping:{};
 p.rawRecords=Array.isArray(p.rawRecords)?p.rawRecords:[];
 p.importMeta=p.importMeta&&typeof p.importMeta==="object"?p.importMeta:{};
 p.importMeta.sourceFiles=Array.isArray(p.importMeta.sourceFiles)?p.importMeta.sourceFiles:[];
 p.importMeta.sourceNotes=Array.isArray(p.importMeta.sourceNotes)?p.importMeta.sourceNotes:[];
 p.forecastYears=Number(p.forecastYears)||5;
 p.theme=p.theme||"light";
 return p;
}
function loadSaved(){try{const p=JSON.parse(localStorage.getItem(KEY)||"null");return p&&p.profile&&p.history?normaliseProject(p):null}catch(e){return null}}

function persist(){try{localStorage.setItem(KEY,JSON.stringify(project));$("#saveStatus").textContent="● Saved locally"}catch(e){$("#saveStatus").textContent="● Not saved (storage full)"}}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.classList.remove("show"),2500)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function n(v){return E.num(v)}
function fmt(v,d=1){return v===null||v===undefined||v===""?"—":E.formatNumber(Number(v),d)}
function pct(v,d=1){return Number.isFinite(v)?(v*100).toFixed(d)+"%":"—"}
function sym(){return symbols[project.profile.currency]||project.profile.currency+" "}
function cash(v,d=1){return Number.isFinite(v)?sym()+fmt(v,d):"—"}
function showPage(page){const id="page-"+page;if(!$("#"+id))return;$$(".page").forEach(x=>x.classList.toggle("active",x.id===id));$$(".nav-btn").forEach(x=>{const active=x.dataset.page===page;x.classList.toggle("active",active);if(active)x.setAttribute("aria-current","page");else x.removeAttribute("aria-current")});const labels={overview:"Overview",data:"Enter data",history:"History",model:"Forecast",dcf:"DCF",comps:"Peers",sensitivity:"Scenarios",assistant:"Assistant"};$("#pageTitle").textContent=labels[page]||page;window.scrollTo({top:0,behavior:"smooth"});if(["overview","history","dcf"].includes(page))drawCharts()}
document.addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(b){e.preventDefault();showPage(b.dataset.page)}});
function syncProfile(){const p=project.profile;$("#companyName").value=p.name||"";$("#analystName").value=p.analyst||"";$("#industry").value=p.industry||"";$("#valuationDate").value=p.valuationDate||"";$("#currency").value=p.currency||"INR";$("#unit").value=p.unit||"millions";$("#frequency").value=p.frequency||"Annual";$("#shares").value=p.sharesOutstanding??100;$("#sideCompany").textContent=p.name||"Untitled project";$("#overviewCompany").textContent=p.name||"Untitled project";$("#themeSelect").value=project.theme||"light";document.body.dataset.theme=project.theme||"light"}
function getLatest(g,k){const arr=project.history[g]?.[k]||[];const v=arr[arr.length-1];return v===null?null:n(v)}
function rebuild(){
 project.dcf.sharesOutstanding=n(project.profile.sharesOutstanding);
 ratios=E.historicalRatios(project.history);
 modelStatus=E.modelReadiness(project.history,project.profile.frequency);
 const assumptionErrors=E.validateForecastAssumptions(project.assumptions);
 const blockers=[...modelStatus.blockers,...assumptionErrors];
 if(blockers.length){
  forecast=[];
  valuation={...EMPTY_VALUATION,errors:blockers};
 }else{
  try{
   forecast=E.buildForecast(project.history,project.assumptions,n(project.forecastYears)||5);
   valuation=E.calculateDCF(forecast,project.history,project.dcf,project.assumptions);
  }catch(error){
   forecast=[];
   valuation={...EMPTY_VALUATION,errors:[error.message||"The model could not be calculated."]};
  }
 }
 renderEverything();
}
function metric(label,value,desc){return '<div class="metric-card"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><em>'+esc(desc||"")+'</em></div>'}
function table(head,rows){return "<thead><tr>"+head.map((x,i)=>"<th>"+esc(x)+"</th>").join("")+"</tr></thead><tbody>"+rows.map(r=>"<tr>"+r.map(x=>"<td>"+(x===null||x===undefined?"":x)+"</td>").join("")+"</tr>").join("")+"</tbody>"}
function renderOverview(){
 const p=project.profile,h=project.history,r=ratios.at(-1)||{},rev=getLatest("IS","revenue"),cagr=h.periods.length>1&&n(h.IS.revenue[0])>0?Math.pow(n(rev)/n(h.IS.revenue[0]),1/(h.periods.length-1))-1:null,last=forecast.at(-1)||{};
 $("#overviewCompany").textContent=p.name||"Untitled project";$("#sideCompany").textContent=p.name||"Untitled project";
 const cards=[metric("LATEST REVENUE",cash(rev),h.periods.at(-1)||"No period loaded"),metric("EBITDA MARGIN",pct(r.ebitdaMargin),"Latest reported period"),metric("REVENUE CAGR",pct(cagr),h.periods.length>1?h.periods[0]+"–"+h.periods.at(-1):"Not enough data"),metric("FINAL FORECAST EBITDA",cash(last.ebitda),last.year||"No forecast")];if(Number.isFinite(project.importMeta?.marketCapCrores))cards.push(metric("MARKET CAP",cash(project.importMeta.marketCapCrores),"INR crores · source workbook"));if(Number.isFinite(project.importMeta?.currentPrice))cards.push(metric("CURRENT SHARE PRICE",sym()+fmt(project.importMeta.currentPrice,2),"Source workbook quote"));$("#overviewMetrics").innerHTML=cards.join("");
 $("#overviewEV").textContent=cash(valuation.enterpriseValue);$("#overviewEquity").textContent=cash(valuation.equityValue);$("#overviewPerShare").textContent=Number.isFinite(valuation.perShare)?sym()+fmt(valuation.perShare,2):"—";
 const warnings=E.validateHistory(h).filter(x=>!x.ok).length;
 $("#modelStatus").textContent=!modelStatus?.ready?"INPUTS REQUIRED":project.importMeta?.source?project.importMeta.source.toUpperCase()+" DATA":project.rawRecords?.length?"IMPORTED DATA":"SAMPLE PROJECT";
 $("#modelStatus").className="status-pill"+(warnings||!modelStatus?.ready||!valuation?.valid?" warning":"");
}
function renderValidation(){
 const results=E.validateHistory(project.history);
 (modelStatus?.blockers||[]).forEach(detail=>results.push({ok:false,title:"Forecast readiness",detail,severity:"warning"}));
 (valuation?.errors||[]).forEach(detail=>results.push({ok:false,title:"DCF / model input",detail,severity:"warning"}));
 const render=x=>'<div class="validation-item '+(x.ok?"":"warn")+'"><span class="symbol">'+(x.ok?"✓":"⚠")+'</span><div><b>'+esc(x.title)+'</b><small>'+esc(x.detail)+'</small></div></div>';
 $("#validationList").innerHTML=results.map(render).join("")||'<p class="muted">No validation checks are available yet.</p>';
 $("#overviewChecks").innerHTML=results.slice(0,5).map(render).join("");
}
function renderHistoryEditor(){
 const g=$("#historyStatement").value,h=project.history,items=E.ITEMS[g],years=h.periods;
 $("#historyEditor").innerHTML="<thead><tr><th>Line item</th>"+years.map(y=>"<th>"+esc(y)+"</th>").join("")+"</tr></thead><tbody>"+items.map(([k,label])=>"<tr><td>"+esc(label)+"</td>"+years.map((y,i)=>'<td><input type="number" step="any" data-hist-group="'+g+'" data-hist-key="'+k+'" data-hist-index="'+i+'" value="'+(h[g][k][i]===null?"":h[g][k][i])+'"></td>').join("")+"</tr>").join("")+"</tbody>";
}
function renderHistory(){
 const r=ratios,h=project.history,first=r[0]||{},last=r.at(-1)||{},cagr=r.length>1&&n(h.IS.revenue[0])>0?Math.pow(n(h.IS.revenue.at(-1))/n(h.IS.revenue[0]),1/(r.length-1))-1:null;
 $("#historyMetrics").innerHTML=[metric("REVENUE CAGR",pct(cagr),"First to latest"),metric("EBITDA MARGIN",pct(last.ebitdaMargin),"Latest reported"),metric("RETURN ON EQUITY",pct(last.roe),"Average equity basis"),metric("FREE CASH FLOW",cash(last.freeCashFlow),last.freeCashFlow===null?"Not reported / capex unavailable":"Reported or CFO less disclosed capex")].join("");
 const defs=[["Revenue growth","revenueGrowth","pct"],["Gross profit margin","grossMargin","pct"],["EBITDA margin","ebitdaMargin","pct"],["EBIT margin","ebitMargin","pct"],["Net profit margin","netMargin","pct"],["Return on equity","roe","pct"],["Return on assets","roa","pct"],["Return on capital employed","roce","pct"],["Current ratio","currentRatio","x"],["Quick ratio","quickRatio","x"],["Debt / equity","debtEquity","x"],["Interest coverage","interestCoverage","x"],["Asset turnover","assetTurnover","x"],["Working capital","workingCapital","money"],["Free cash flow","freeCashFlow","money"]];
 $("#ratioTable").innerHTML=table(["Metric",...r.map(x=>x.period)],defs.map(([label,k,type])=>[label,...r.map(x=>type==="pct"?pct(x[k]):type==="money"?cash(x[k]):type==="x"?fmt(x[k],2)+"x":"")]));
 renderHistoryEditor();
}
function renderAssumptions(){
 const defs=[["revenueGrowth","Revenue growth","%"],["grossMargin","Gross margin","%"],["employeePct","Employee costs / revenue","%"],["otherOpexPct","Other opex / revenue","%"],["daPct","D&A / opening PP&E","%"],["taxRate","Effective tax rate","%"],["capexPct","Capex / revenue","%"],["arDays","Receivable days","days"],["inventoryDays","Inventory days","days"],["apDays","Payable days","days"],["otherCurrentAssetsPct","Other current assets / revenue","%"],["otherLiabilitiesPct","Other liabilities / revenue","%"],["annualDebtRepayment","Annual debt repayment",project.profile.unit],["interestRate","Interest rate","%"],["dividendPayout","Dividend payout ratio","%"]];
 const percent=new Set(defs.filter(x=>x[2]==="%").map(x=>x[0]));
 $("#assumptionGrid").innerHTML=defs.map(([k,label,u])=>'<div class="assumption-field"><label>'+label+'</label><div class="input-wrap"><input data-assumption="'+k+'" type="number" step="'+(percent.has(k)?".1":"1")+'" value="'+(n(project.assumptions[k])*(percent.has(k)?100:1))+'"><span class="suffix">'+u+'</span></div></div>').join("");
 $$("[data-assumption]").forEach(el=>el.addEventListener("change",()=>{const k=el.dataset.assumption;project.assumptions[k]=n(el.value)/(percent.has(k)?100:1);rebuild();persist()}));
}
function renderForecastTable(id,title,items){const years=forecast.map(x=>x.year);$("#"+id).innerHTML="<thead><tr><th>"+title+"</th>"+years.map(y=>"<th>"+esc(y)+"</th>").join("")+"</tr></thead><tbody>"+items.map(([label,key,fn])=>"<tr><td>"+label+"</td>"+forecast.map(x=>"<td>"+(fn?fn(x):fmt(x[key]))+"</td>").join("")+"</tr>").join("")+"</tbody>"}
function renderForecast(){
 if(!forecast.length){
  ["forecastIS","forecastBS","forecastCF"].forEach(id=>$("#"+id).innerHTML='<tbody><tr><td class="muted">Forecast unavailable until required annual inputs are complete.</td></tr></tbody>');
  const badge=$("#forecastBalanceBadge");badge.textContent=modelStatus?.blockers?.length?"DATA REQUIRED":"CHECK ASSUMPTIONS";badge.className="tag amber";
  $("#forecastYears").value=String(project.forecastYears||5);
  return;
 }
 renderForecastTable("forecastIS","Income statement",[["Revenue","revenue"],["Revenue growth","revenueGrowth",x=>pct(x.revenueGrowth)],["Cost of goods sold","cogs"],["Gross profit","grossProfit"],["Employee expenses","employeeExpenses"],["Other operating expenses","otherOpex"],["EBITDA","ebitda"],["D&A","da"],["EBIT","ebit"],["Interest expense","interestExpense"],["Profit before tax","pbt"],["Tax expense","tax"],["Net income","netIncome"]]);
 renderForecastTable("forecastBS","Balance sheet",[["Cash & equivalents","cash"],["Accounts receivable","ar"],["Inventory","inventory"],["Other current assets","otherCurrentAssets"],["PP&E","ppe"],["Total assets","totalAssets"],["Accounts payable","ap"],["Short-term debt","shortDebt"],["Long-term debt","longDebt"],["Other liabilities","otherLiabilities"],["Shareholders' equity","equity"],["Total liabilities & equity","totalLiabEquity"],["Balance sheet check","check",x=>'<b style="color:'+(Math.abs(x.check)<.01?"var(--green)":"var(--red)")+'">'+fmt(x.check)+'</b>']]);
 renderForecastTable("forecastCF","Cash flow statement",[["Net income","netIncome"],["D&A add-back","daAddback",x=>fmt(-x.da)],["Change in net working capital","changeNWC"],["Cash flow from operations","cfo"],["Capital expenditure (outflow)","capex",x=>fmt(-x.capex)],["Cash flow from investing","cfi"],["Debt repayment","debtRepayment",x=>fmt(-x.debtRepayment)],["Dividends","dividend",x=>fmt(-x.dividend)],["Cash flow from financing","cff"],["Net change in cash","netChangeCash"],["Free cash flow","fcf"]]);
 const flagged=forecast.some(x=>x.cash<0||Math.abs(x.check)>.01),badge=$("#forecastBalanceBadge");badge.textContent=flagged?"REVIEW FLAGS":"BALANCED";badge.className="tag "+(flagged?"amber":"green");$("#forecastYears").value=String(project.forecastYears||5);
}
function renderWACC(){
 const defs=[["riskFreeRate","Risk-free rate","%"],["equityRiskPremium","Equity risk premium","%"],["beta","Levered beta","x"],["costOfDebt","Pre-tax cost of debt","%"],["equityMarketValue","Market value of equity",project.profile.unit],["debtMarketValue","Market value of debt",project.profile.unit]];
 const pctKeys=new Set(["riskFreeRate","equityRiskPremium","costOfDebt"]);
 $("#waccInputs").innerHTML=defs.map(([k,label,u])=>'<label>'+label+'<input type="number" step="any" data-dcf="'+k+'" value="'+(n(project.dcf[k])*(pctKeys.has(k)?100:1))+'"><small>'+u+'</small></label>').join("");
 $$("[data-dcf]").forEach(el=>el.addEventListener("change",()=>{const k=el.dataset.dcf;project.dcf[k]=n(el.value)/(pctKeys.has(k)?100:1);rebuild();persist()}));
}
function renderTerminal(){
 $$("[name=terminalMethod]").forEach(el=>el.checked=el.value===project.dcf.terminalMethod);
 const g=project.dcf.terminalMethod==="growth";
 $("#terminalInputs").innerHTML=g?'<label>Perpetual growth rate (%)<input id="terminalValueInput" type="number" step=".1" value="'+(project.dcf.perpetualGrowth*100)+'"></label>':'<label>Exit EBITDA multiple (x)<input id="terminalValueInput" type="number" step=".1" value="'+project.dcf.exitMultiple+'"></label>';
 $("#terminalValueInput").addEventListener("change",e=>{if(g)project.dcf.perpetualGrowth=n(e.target.value)/100;else project.dcf.exitMultiple=n(e.target.value);rebuild();persist()});
}
function renderDCF(){
 const v=valuation;
 const warning=$("#dcfWarnings");
 if(warning){
  warning.hidden=!!v.valid;
  warning.textContent=v.valid?"":(v.errors||["DCF is unavailable."]).join(" ");
 }
 $("#costEquity").textContent=pct(v.costEquity,2);$("#waccValue").textContent=pct(v.wacc,2);$("#dcfEV").textContent=cash(v.enterpriseValue);$("#pvForecast").textContent=cash(v.pvForecast);$("#pvTerminal").textContent=cash(v.pvTerminal);$("#dcfEVBridge").textContent=cash(v.enterpriseValue);$("#dcfNetDebt").textContent=cash(v.netDebt);$("#dcfEquity").textContent=cash(v.equityValue);$("#dcfPerShare").textContent=Number.isFinite(v.perShare)?sym()+fmt(v.perShare,2):"N/M";
 const defs=[["EBIT","ebit"],["Tax-adjusted EBIT","nopat"],["Add: D&A","daAddback"],["Less: capex","capex"],["Change in NWC","changeNWC"],["Unlevered free cash flow","ufcf"],["Discount factor","discountFactor"],["Present value","pv"]];
 $("#ufcfTable").innerHTML="<thead><tr><th>DCF cash flow build</th>"+v.flows.map(x=>"<th>"+esc(x.year)+"</th>").join("")+"</tr></thead><tbody>"+defs.map(([label,k])=>"<tr><td>"+label+"</td>"+v.flows.map(x=>"<td>"+(k==="pv"?fmt(x.ufcf*x.discountFactor):k==="nopat"||k==="daAddback"?fmt(x[k]):k==="discountFactor"?fmt(x[k],3):fmt(x[k]))+"</td>").join("")+"</tr>").join("")+"</tbody>";
 $("#dcfDriverList").innerHTML=[["WACC",pct(v.wacc,2)],["Cost of equity",pct(v.costEquity,2)],["Perpetual growth",pct(project.dcf.perpetualGrowth,2)],["Exit multiple",fmt(project.dcf.exitMultiple,1)+"x"],["Forecast period",forecast.length+" years"],["Net debt",cash(v.netDebt)]].map(x=>'<div class="kv"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>').join("");
}
function peerStats(){return E.peerStatistics(project.peers)}
function renderPeers(){
 const fields=[["ev","EV"],["revenue","Revenue"],["ebitda","EBITDA"],["ebit","EBIT"],["netIncome","Net income"],["marketCap","Market cap"],["bookEquity","Book equity"]];
 $("#peerTable").innerHTML="<thead><tr><th>Company / status</th>"+fields.map(x=>"<th>"+x[1]+"</th>").join("")+"<th></th></tr></thead><tbody>"+project.peers.map((p,i)=>'<tr><td><input class="peer-input" data-peer="'+i+'" data-peer-key="name" value="'+esc(p.name)+'"></td>'+fields.map(([k])=>'<td><input type="number" step="any" class="peer-input" data-peer="'+i+'" data-peer-key="'+k+'" value="'+(p[k]??"")+'"></td>').join("")+'<td><button type="button" class="text-link" data-remove-peer="'+i+'">Remove</button></td></tr>').join("")+"</tbody>";
 const s=peerStats(),stats=[["EV / Revenue","evRevenue"],["EV / EBITDA","evEbitda"],["EV / EBIT","evEbit"],["P / E","pe"],["P / Book","pb"]];
 $("#peerStats").innerHTML="<thead><tr><th>Multiple</th><th>Median</th><th>Average</th><th>Valid peers</th></tr></thead><tbody>"+stats.map(([l,k])=>"<tr><td>"+l+"</td><td>"+(s[k].median?fmt(s[k].median,2)+"x":"—")+"</td><td>"+(s[k].average?fmt(s[k].average,2)+"x":"—")+"</td><td>"+s[k].count+"</td></tr>").join("")+"</tbody>";
 const rev=getLatest("IS","revenue")||0,ebitda=getLatest("IS","ebitda")||0,ebit=getLatest("IS","ebit")||0;
 $("#compsValuation").innerHTML=[["EV / Revenue","evRevenue",rev],["EV / EBITDA","evEbitda",ebitda],["EV / EBIT","evEbit",ebit]].map(([l,k,x])=>'<div class="kv"><span>'+l+' implied EV</span><b>'+(s[k].median?cash(s[k].median*x):"—")+'</b></div>').join("")+'<p class="muted">Median peer multiple × target latest reported metric. Replace synthetic demo peers with sourced market data.</p>';
}
function dcfAt(wacc,method,g,m,fc=forecast){const flows=fc.map(x=>x.ebit*(1-project.assumptions.taxRate)-x.da-x.capex-x.changeNWC),pv=flows.reduce((s,x,i)=>s+x/Math.pow(1+wacc,i+1),0),last=fc.at(-1)||{ebitda:0},tail=flows.at(-1)||0,tv=method==="growth"?(wacc>g?tail*(1+g)/(wacc-g):NaN):last.ebitda*m;return pv+tv/Math.pow(1+wacc,fc.length)}
function renderSensitivity(){
 if(!forecast.length||!valuation.valid){
  ["growthSensitivity","multipleSensitivity","operatingSensitivity"].forEach(id=>$("#"+id).innerHTML='<p class="muted">Sensitivity analysis is unavailable until annual model inputs and DCF assumptions pass validation.</p>');
  return;
 }
 const w=valuation.wacc,g=project.dcf.perpetualGrowth,m=project.dcf.exitMultiple,wr=Math.max(.0025,n($("#waccRange").value)/100),gr=Math.max(.001,n($("#growthRange").value)/100),mr=Math.max(.25,n($("#multipleRange").value)),steps=[-2,-1,0,1,2];
 function grid(method){const axes=steps.map(s=>method==="growth"?g+s*gr:m+s*mr/2);const rows=steps.map(s=>{const rate=w+s*wr;return ["<b>"+pct(rate,2)+"</b>",...axes.map((x,i)=>{const v=dcfAt(rate,method,method==="growth"?x:g,method==="multiple"?x:m);return '<span class="'+(s===0&&i===2?"base":v>=valuation.enterpriseValue?"higher":"lower")+'">'+fmt(v,0)+'</span>'})]});const headers=[method==="growth"?"WACC ↓ / growth →":"WACC ↓ / exit multiple →",...axes.map(x=>method==="growth"?pct(x,2):fmt(x,1)+"x")];return '<table class="sensitivity-table">'+table(headers,rows)+'</table>'}
 $("#growthSensitivity").innerHTML=grid("growth");$("#multipleSensitivity").innerHTML=grid("multiple");
 const growths=steps.map(s=>project.assumptions.revenueGrowth+s*.02),margins=steps.map(s=>project.assumptions.grossMargin-project.assumptions.employeePct-project.assumptions.otherOpexPct+s*.02);
 const rows=growths.map(growth=>["<b>"+pct(growth)+"</b>",...margins.map(margin=>{const a={...project.assumptions,revenueGrowth:growth,grossMargin:margin+project.assumptions.employeePct+project.assumptions.otherOpexPct};return fmt(E.operatingScenario(project.history,a,project.forecastYears,project.dcf),0)})]);
 $("#operatingSensitivity").innerHTML='<table class="sensitivity-table">'+table(["Revenue growth ↓ / EBITDA margin →",...margins.map(x=>pct(x))],rows)+'</table>';
}
function renderAssistantContext(){
 const r=ratios.at(-1)||{},items=[["Company",project.profile.name],["Latest revenue",cash(getLatest("IS","revenue"))],["Latest EBITDA",cash(getLatest("IS","ebitda"))],["EBITDA margin",pct(r.ebitdaMargin)],["Revenue growth assumption",pct(project.assumptions.revenueGrowth)],["Forecast horizon",forecast.length+" years"],["WACC",pct(valuation.wacc,2)],["Enterprise value",cash(valuation.enterpriseValue)],["Equity value",cash(valuation.equityValue)],["Value per share",Number.isFinite(valuation.perShare)?sym()+fmt(valuation.perShare,2):"—"]];
 $("#assistantContext").innerHTML=items.map(x=>'<div class="kv"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join("");
}
function assistantResponse(query){
 const q=query.toLowerCase(),r=ratios.at(-1)||{},a=project.assumptions,v=valuation,flags=E.validateHistory(project.history).filter(x=>!x.ok);
 if(/revenue|sales|forecast/.test(q)&&!/risk|valuation|sensitivity/.test(q))return "Revenue forecast\n\nLatest reported revenue is "+cash(getLatest("IS","revenue"))+". The forecast applies "+pct(a.revenueGrowth)+" annual growth. Forecast revenue moves from "+cash(forecast[0]?.revenue)+" in "+forecast[0]?.year+" to "+cash(forecast.at(-1)?.revenue)+" in "+forecast.at(-1)?.year+". This is a modelling assumption, not management guidance.";
 if(/free cash|cash flow|fcf/.test(q))return "Free cash flow\n\nLatest historical FCF: "+cash(r.freeCashFlow)+". First forecast UFCF: "+cash(v.flows[0]?.ufcf)+". Final forecast UFCF: "+cash(v.flows.at(-1)?.ufcf)+". UFCF = EBIT × (1 − tax) + D&A − capex − change in net working capital. Receivable, inventory and payable days are "+a.arDays+", "+a.inventoryDays+" and "+a.apDays+".";
 if(/wacc|value|valuation|sensitivity/.test(q))return "Valuation bridge\n\nCost of equity "+pct(v.costEquity,2)+", WACC "+pct(v.wacc,2)+", enterprise value "+cash(v.enterpriseValue)+", net debt "+cash(v.netDebt)+", equity value "+cash(v.equityValue)+", implied value per share "+(Number.isFinite(v.perShare)?sym()+fmt(v.perShare,2):"N/M")+". A higher WACC lowers present value; perpetual growth must remain below WACC.";
 if(/ratio|margin|performance|histor/.test(q))return "Latest historical indicators\n\nGross margin "+pct(r.grossMargin)+", EBITDA margin "+pct(r.ebitdaMargin)+", net margin "+pct(r.netMargin)+", ROE "+pct(r.roe)+", ROA "+pct(r.roa)+", current ratio "+fmt(r.currentRatio,2)+"x, quick ratio "+fmt(r.quickRatio,2)+"x, debt/equity "+fmt(r.debtEquity,2)+"x, interest coverage "+fmt(r.interestCoverage,2)+"x.";
 if(/risk|warning|balance|error|flag|check/.test(q))return "Validation and model risks\n\n"+(flags.length?flags.map(x=>"- "+x.title+": "+x.detail).join("\n"):"No historical validation warnings are active.")+"\nForecast balance sheet "+(forecast.some(x=>x.cash<0||Math.abs(x.check)>.01)?"has review flags.":"balances under current assumptions.")+" Negative cash signals a funding need; no automatic revolver draw is modelled.";
 return "I can answer using the active model data. Ask about revenue, free cash flow, WACC, ratios, valuation sensitivity or validation warnings. Current enterprise value: "+cash(v.enterpriseValue)+".";
}
function sendMessage(query){if(!query.trim())return;const u=document.createElement("div");u.className="user-message";u.textContent=query;const a=document.createElement("div");a.className="assistant-message";a.textContent=assistantResponse(query);$("#chatMessages").append(u,a);$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight}
function chart(id,series,labels){
 const c=$("#"+id);if(!c)return;const w=c.clientWidth||300,h=c.clientHeight||220,dpr=window.devicePixelRatio||1;c.width=w*dpr;c.height=h*dpr;const x=c.getContext("2d");x.scale(dpr,dpr);const vals=series.flatMap(v=>v.values).filter(Number.isFinite);if(!vals.length)return;const min=Math.min(0,...vals),max=Math.max(1,...vals)*1.08,pl=42,pr=10,pt=12,pb=25,cw=w-pl-pr,ch=h-pt-pb,xx=i=>pl+cw*i/(labels.length-1||1),yy=v=>pt+ch-(v-min)/(max-min||1)*ch,muted=getComputedStyle(document.body).getPropertyValue("--muted"),line=getComputedStyle(document.body).getPropertyValue("--line");for(let k=0;k<5;k++){const y=pt+ch*k/4;x.strokeStyle=line;x.beginPath();x.moveTo(pl,y);x.lineTo(w-pr,y);x.stroke();x.fillStyle=muted;x.font="9px DM Mono";x.fillText(fmt(max-(max-min)*k/4,0),2,y+3)}series.forEach(s=>{x.strokeStyle=s.color;x.lineWidth=2;x.beginPath();s.values.forEach((v,i)=>i?x.lineTo(xx(i),yy(v)):x.moveTo(xx(i),yy(v)));x.stroke();s.values.forEach((v,i)=>{x.fillStyle=s.color;x.beginPath();x.arc(xx(i),yy(v),2.8,0,Math.PI*2);x.fill()})});labels.forEach((l,i)=>{x.fillStyle=muted;x.textAlign="center";x.font="9px DM Mono";x.fillText(String(l),xx(i),h-5)});
}
function drawCharts(){
 const h=project.history,periods=h.periods;
 chart("revenueChart",[{values:h.IS.revenue.map(x=>x===null?NaN:n(x)).concat(forecast.map(x=>x.revenue)),color:"#316bd0"}],periods.concat(forecast.map(x=>x.year)));
 chart("marginChart",[{values:ratios.map(x=>x.grossMargin===null?NaN:x.grossMargin*100),color:"#316bd0"},{values:ratios.map(x=>x.ebitdaMargin===null?NaN:x.ebitdaMargin*100),color:"#20966c"},{values:ratios.map(x=>x.netMargin===null?NaN:x.netMargin*100),color:"#d49b3d"}],periods);
 chart("cashChart",[{values:h.IS.ebitda.map(x=>x===null?NaN:n(x)),color:"#316bd0"},{values:ratios.map(x=>x.freeCashFlow===null?NaN:n(x.freeCashFlow)),color:"#20966c"}],periods);
 chart("dcfChart",[{values:valuation.flows.map(x=>x.ufcf),color:"#316bd0"},{values:valuation.flows.map(x=>x.ufcf*x.discountFactor),color:"#209b6c"}],valuation.flows.map(x=>x.year));
}
function renderReadiness(){
 const el=$("#modelReadiness");if(!el)return;
 const blockers=[...(modelStatus?.blockers||[]),...E.validateForecastAssumptions(project.assumptions)];
 const dcfErrors=valuation?.valid?[]:(valuation?.errors||[]);
 if(blockers.length||dcfErrors.length){
  el.hidden=false;el.className="readiness-banner warning";
  el.innerHTML='<strong>Model not ready for valuation.</strong><ul>'+[...new Set([...blockers,...dcfErrors])].map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>';
 }else{
  el.hidden=false;el.className="readiness-banner ready";
  el.innerHTML='<strong>Input gate passed.</strong> Historical completeness and DCF assumptions passed the current automated checks. This does not replace analyst review or source verification.';
 }
}
function renderSourceTrace(){
 const el=$("#sourceTrace");if(!el)return;
 const meta=project.importMeta||{},files=meta.sourceFiles||[];
 const source=meta.source||(project.rawRecords?.length?"User-provided CSV / Excel":"Manual entry or synthetic sample");
 const imported=meta.importedAt?new Date(meta.importedAt).toLocaleString():"Not recorded";
 const labels=Array.from(new Set((project.rawRecords||[]).map(row=>row.label)));
 const mapped=labels.filter(label=>project.mapping?.[label]&&project.mapping[label]!=="ignore").length;
 const notes=meta.sourceNotes||[];
 el.innerHTML='<div><b>Source</b><span>'+esc(source)+'</span></div><div><b>Files</b><span>'+esc(files.length?files.join(", "):"No imported files")+'</span></div><div><b>Imported</b><span>'+esc(imported)+'</span></div><div><b>Source labels mapped</b><span>'+mapped+' / '+labels.length+'</span></div>'+(notes.length?'<ul>'+notes.map(note=>'<li>'+esc(note)+'</li>').join("")+'</ul>':"");
}
function renderEverything(){renderOverview();renderValidation();renderHistory();renderForecast();renderDCF();renderPeers();renderSensitivity();renderAssistantContext();renderReadiness();renderSourceTrace();drawCharts()}
function parseCsv(txt){
 const lines=txt.replace(/^\uFEFF/,"").split(/\r?\n/).filter(x=>x.trim()),parse=line=>{let arr=[],v="",q=false;for(let i=0;i<line.length;i++){let ch=line[i];if(ch==='"'&&line[i+1]==='"'&&q){v+='"';i++}else if(ch==='"')q=!q;else if(ch===","&&!q){arr.push(v);v=""}else v+=ch}arr.push(v);return arr};if(!lines.length)return [];const heads=parse(lines[0]).map(x=>x.trim());return lines.slice(1).map(l=>{const values=parse(l),obj={};heads.forEach((k,i)=>obj[k]=values[i]??"");return obj});
}
function renderMapping(){
 const labels=Array.from(new Set((project.rawRecords||[]).map(r=>r.label)));
 if(!labels.length){$("#mappingTable").innerHTML='<tbody><tr><td>No source labels imported yet. Load sample statements or upload CSV / Excel files.</td></tr></tbody>';return}
 const options=['<option value="ignore">Do not map</option>'].concat(Object.keys(E.ITEMS).flatMap(g=>E.ITEMS[g].map(([k,label])=>'<option value="'+g+"."+k+'">'+g+" · "+esc(label)+'</option>'))).join("");
 $("#mappingTable").innerHTML="<thead><tr><th>Source field</th><th>Values</th><th>Model field</th></tr></thead><tbody>"+labels.map(label=>'<tr><td>'+esc(label)+'</td><td>'+project.rawRecords.filter(r=>r.label===label).length+'</td><td><select data-map="'+esc(label)+'">'+options.replace('value="'+esc(project.mapping[label]||"ignore")+'"','value="'+esc(project.mapping[label]||"ignore")+'" selected')+'</select></td></tr>').join("")+"</tbody>";
 $$("[data-map]").forEach(el=>el.addEventListener("change",()=>{project.mapping[el.dataset.map]=el.value;persist()}));
}

function seedAssumptionsFromImportedHistory(p,meta){
 const h=p.history,last=h.periods.length-1,prior=last>0?last-1:-1;
 const get=(g,k,i=last)=>h[g]?.[k]?.[i]??null;
 const a=p.assumptions,rev=get("IS","revenue"),prevRev=prior>=0?get("IS","revenue",prior):null;
 const set=(key,value)=>{if(Number.isFinite(value))a[key]=value;};
 if(rev>0&&prevRev>0)set("revenueGrowth",rev/prevRev-1);
 if(rev>0){
  if(get("IS","grossProfit")!==null)set("grossMargin",get("IS","grossProfit")/rev);
  if(get("IS","employeeExpenses")!==null)set("employeePct",Math.abs(get("IS","employeeExpenses"))/rev);
  if(get("IS","otherOpex")!==null)set("otherOpexPct",Math.abs(get("IS","otherOpex"))/rev);
  if(get("BS","otherCurrentAssets")!==null)set("otherCurrentAssetsPct",Math.max(0,get("BS","otherCurrentAssets"))/rev);
  if(get("BS","otherLiabilities")!==null)set("otherLiabilitiesPct",Math.max(0,get("BS","otherLiabilities"))/rev);
  if(get("BS","ar")!==null)set("arDays",Math.max(0,get("BS","ar"))/rev*365);
  if(get("BS","inventory")!==null&&get("IS","cogs")!==null&&Math.abs(get("IS","cogs"))>0)set("inventoryDays",Math.max(0,get("BS","inventory"))/Math.abs(get("IS","cogs"))*365);
 }
 const ppe=get("BS","ppe"),priorPpe=prior>=0?get("BS","ppe",prior):null,da=get("IS","da");
 if(ppe>0&&priorPpe!==null&&rev>0&&da!==null){
  set("capexPct",Math.max(0,ppe-priorPpe+Math.abs(da))/rev);
  p.importNotes=["Capex assumption estimated from the change in net fixed assets plus depreciation; review before relying on the valuation."];
 }
 if(ppe>0&&da!==null)set("daPct",Math.abs(da)/ppe);
 const pbt=get("IS","pbt"),tax=get("IS","tax");
 if(pbt>0&&tax!==null)set("taxRate",Math.min(.6,Math.max(0,Math.abs(tax)/pbt)));
 const debt=(get("BS","shortDebt")||0)+(get("BS","longDebt")||0),interest=get("IS","interestExpense");
 if(debt>0&&interest!==null)set("interestRate",Math.abs(interest)/debt);
 const ni=get("IS","netIncome");
 if(ni>0&&Number.isFinite(meta?.dividendAmount))set("dividendPayout",Math.min(1.5,Math.max(0,meta.dividendAmount/ni)));
 if(meta?.source==="Screener.in")a.annualDebtRepayment=0;
 return p;
}

function setImportStatus(message,isError=false){
 const el=$("#importStatus");if(!el)return;
 el.textContent=message;el.style.color=isError?"var(--red)":"";
}
function showImportError(error){
 const message=error?.message||String(error||"Unknown import error");
 setImportStatus("Import failed: "+message,true);
 toast("Import failed — see the detailed message in the import panel.");
}
async function fileArrayBuffer(file){
 if(typeof file.arrayBuffer==="function")return file.arrayBuffer();
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(reader.result);
  reader.onerror=()=>reject(new Error("The browser could not read "+file.name+". Try saving the workbook again as .xlsx."));
  reader.readAsArrayBuffer(file);
 });
}
async function importStatements(files){
 if(!files.length)return;
 setImportStatus("Reading "+files.length+" file(s) and detecting the statement layout…");
 let records=[],screenerImport=null,filesLoaded=0;
 for(const file of files){
  const ext=file.name.split(".").pop().toLowerCase();
  if(ext==="csv"){
   records=records.concat(E.recordsFromRows(parseCsv(await file.text()),"",file.name));
   filesLoaded++;
  }else if(["xlsx","xls"].includes(ext)){
   const XLSXLib=window.XLSX;
   if(!XLSXLib?.utils?.sheet_to_json)throw new Error("The Excel reader did not load. Refresh the page and retry; if the CDN is blocked, try another network or upload CSV.");
   const bytes=await fileArrayBuffer(file);
   let workbook;
   try{
    workbook=XLSXLib.read(new Uint8Array(bytes),{type:"array",cellDates:true});
   }catch(firstError){
    try{workbook=XLSXLib.read(bytes,{cellDates:true});}
    catch(secondError){throw new Error("Could not open "+file.name+": "+(secondError?.message||firstError?.message||"invalid Excel workbook"));}
   }
   if(!workbook?.SheetNames?.length)throw new Error(file.name+" contains no readable worksheets.");
   const orderedSheets=[...workbook.SheetNames].sort((a,b)=>{
    const aa=E.normaliseLabel(a)==="datasheet"?0:1,bb=E.normaliseLabel(b)==="datasheet"?0:1;
    return aa-bb;
   });
   let detectedScreener=false;
   for(const name of orderedSheets){
    const matrix=XLSXLib.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:null,raw:true,blankrows:true});
    const parsed=E.parseScreenerDataSheet(matrix);
    if(parsed?.records?.length){
     screenerImport=parsed;records=records.concat(parsed.records);detectedScreener=true;break;
    }
   }
   if(!detectedScreener){
    workbook.SheetNames.forEach(name=>{
     records=records.concat(E.recordsFromRows(XLSXLib.utils.sheet_to_json(workbook.Sheets[name],{defval:null,raw:true}),name,file.name));
    });
   }
   filesLoaded++;
  }else throw new Error("Unsupported file type: "+file.name+". Upload a .csv, .xlsx or .xls file.");
 }
 if(!records.length)throw new Error("No financial values were found in "+files.map(f=>f.name).join(", ")+". For Screener.in exports, keep the Data Sheet content intact. Other workbooks need Period/Year and line-item headers, or Period, Statement, Item and Value columns.");
 if(screenerImport){
  const fresh=E.defaultProject();
  fresh.profile={...fresh.profile,name:screenerImport.companyName||files[0].name.replace(/\.(xlsx|xls)$/i,""),analyst:"Financial Analyst",industry:"",valuationDate:screenerImport.latestDate||fresh.profile.valuationDate,currency:screenerImport.currency||"INR",unit:screenerImport.unit||"crores",frequency:"Annual",sharesOutstanding:screenerImport.sharesOutstandingCrores||100};
  fresh.history=E.historyFromRecords(records,{});
  fresh.rawRecords=records;
  fresh.mapping={};
  records.forEach(record=>{if(record.mapped)fresh.mapping[record.label]=record.mapped;});
  fresh.peers=[];
  fresh.dcf.sharesOutstanding=fresh.profile.sharesOutstanding;
  if(Number.isFinite(screenerImport.marketCapCrores))fresh.dcf.equityMarketValue=screenerImport.marketCapCrores;
  fresh.dcf.debtMarketValue=Math.max(0,fresh.history.BS.longDebt.at(-1)||0);
  fresh.importMeta={source:screenerImport.source,sourceFiles:files.map(file=>file.name),importedAt:new Date().toISOString(),currentPrice:screenerImport.currentPrice,marketCapCrores:screenerImport.marketCapCrores,latestPeriod:screenerImport.latestPeriod,sourceNotes:screenerImport.sourceNotes||[]};
  project=normaliseProject(fresh);
  seedAssumptionsFromImportedHistory(project,screenerImport);
  project.dcf.costOfDebt=project.assumptions.interestRate;
  renderAssumptions();renderWACC();renderTerminal();
 }else{
  const fresh=E.defaultProject();
  fresh.profile.name=files.length===1?files[0].name.replace(/\.(csv|xlsx|xls)$/i,""):"Imported financial data";
  fresh.rawRecords=records;
  fresh.mapping={};
  Array.from(new Set(records.map(r=>r.label))).forEach(label=>{fresh.mapping[label]=E.mapLabel(label)||"ignore";});
  fresh.history=E.historyFromRecords(records,fresh.mapping);
  fresh.importMeta={source:"User-provided CSV / Excel",sourceFiles:files.map(file=>file.name),importedAt:new Date().toISOString(),sourceNotes:["Source figures were supplied by the user. Verify every mapped value against the original filing; the app does not independently fetch or verify financial statements."]};
  project=normaliseProject(fresh);
  renderAssumptions();renderWACC();renderTerminal();
 }
 renderMapping();renderManualEntry();rebuild();persist();
 const unmapped=Array.from(new Set(records.map(r=>r.label))).filter(label=>!project.mapping[label]||project.mapping[label]==="ignore");
 const periodCount=project.history.periods.length,company=project.profile.name||"uploaded company";
 const note=screenerImport?(screenerImport.sourceNotes||[]).join(" "):"";
 setImportStatus("Imported "+records.length+" financial values from "+filesLoaded+" file(s). "+(unmapped.length?unmapped.length+" source label(s) need mapping.":"Recognised fields mapped automatically.")+(note?" "+note:""));
 showPage("overview");
 toast(company+" loaded: "+periodCount+" historical periods. Dashboard, history, forecast and valuation have been refreshed.");
}
function applyMapping(){project.history=E.historyFromRecords(project.rawRecords||[],project.mapping||{});renderManualEntry();rebuild();persist();toast("Source mappings applied.")}
function loadSample(){const p=E.defaultProject();p.importMeta={source:"Synthetic demo dataset",sourceFiles:["sample-data/aster_industries.csv"],importedAt:"",sourceNotes:["Aster Industries is fictional demonstration data, not a real issuer or filing."]};project=p;syncProfile();renderAssumptions();renderWACC();renderTerminal();renderMapping();renderManualEntry();rebuild();persist();$("#importStatus").textContent="Synthetic sample company loaded.";toast("Sample company restored.")}
function csvEscape(v){const s=v===null||v===undefined?"":String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function csvText(rows){return rows.map(r=>r.map(csvEscape).join(",")).join("\r\n")}
function rowsForHistory(g){const h=project.history;return [["Line item"].concat(h.periods),...E.ITEMS[g].map(([k,l])=>[l].concat(h.periods.map((_,i)=>h[g][k][i])))]}
function rowsForForecast(g){
 const defs={IS:[["Revenue","revenue"],["Revenue growth","revenueGrowth"],["COGS","cogs"],["Gross profit","grossProfit"],["Employee expenses","employeeExpenses"],["Other operating expenses","otherOpex"],["EBITDA","ebitda"],["D&A","da"],["EBIT","ebit"],["Interest expense","interestExpense"],["PBT","pbt"],["Tax","tax"],["Net income","netIncome"]],BS:[["Cash","cash"],["AR","ar"],["Inventory","inventory"],["Other current assets","otherCurrentAssets"],["PP&E","ppe"],["Total assets","totalAssets"],["AP","ap"],["Short-term debt","shortDebt"],["Long-term debt","longDebt"],["Other liabilities","otherLiabilities"],["Equity","equity"],["Total liabilities and equity","totalLiabEquity"],["Balance check","check"]],CF:[["CFO","cfo"],["Capex","capex"],["CFI","cfi"],["CFF","cff"],["FCF","fcf"],["Change in NWC","changeNWC"]]};
 return [["Line item"].concat(forecast.map(x=>x.year)),...defs[g].map(([l,k])=>[l].concat(forecast.map(x=>x[k])))];
}
function downloadBlob(name,blob){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
async function exportCsvPack(){
 if(!window.JSZip){toast("CSV pack tool unavailable. Reload with internet access.");return}
 const z=new JSZip(),p=project.profile;
 z.file("00_Report_Cover.csv",csvText([["ModelForge Financial Analysis Report"],["Company",p.name],["Prepared by",p.analyst],["Industry",p.industry],["Valuation date",p.valuationDate],["Currency",p.currency],["Reporting unit",p.unit],["Frequency",p.frequency]]));
 z.file("01_Assumptions.csv",csvText([["Assumption","Value"],...Object.entries(project.assumptions),...Object.entries(project.dcf)]));
 z.file("02_Historical_IS.csv",csvText(rowsForHistory("IS")));z.file("03_Historical_BS.csv",csvText(rowsForHistory("BS")));z.file("04_Historical_CF.csv",csvText(rowsForHistory("CF")));
 z.file("05_Forecast_IS.csv",csvText(rowsForForecast("IS")));z.file("06_Forecast_BS.csv",csvText(rowsForForecast("BS")));z.file("07_Forecast_CF.csv",csvText(rowsForForecast("CF")));
 z.file("08_Ratios.csv",csvText([["Ratio"].concat(ratios.map(x=>x.period)),...Object.keys(ratios[0]||{}).filter(k=>k!=="period").map(k=>[k].concat(ratios.map(x=>x[k])))]));
 z.file("09_DCF.csv",csvText([["DCF valuation","Value"],["WACC",valuation.wacc],["Cost of equity",valuation.costEquity],["PV forecast UFCF",valuation.pvForecast],["Terminal value",valuation.terminalValue],["PV terminal value",valuation.pvTerminal],["Enterprise value",valuation.enterpriseValue],["Net debt",valuation.netDebt],["Equity value",valuation.equityValue],["Value per share",valuation.perShare]]));
 z.file("10_Comparables.csv",csvText([["Company","Synthetic","EV","Revenue","EBITDA","EBIT","Net income","Market cap","Book equity"],...project.peers.map(x=>[x.name,x.synthetic?"Yes":"No",x.ev,x.revenue,x.ebitda,x.ebit,x.netIncome,x.marketCap,x.bookEquity])]));
 z.file("11_Validation.csv",csvText([["Check","Status","Detail"],...E.validateHistory(project.history).map(x=>[x.title,x.ok?"OK":"REVIEW",x.detail])]));
 const blob=await z.generateAsync({type:"blob"});downloadBlob((p.name||"Company").replace(/[^a-z0-9]+/gi,"_")+"_Financial_Report_CSV_Pack.zip",blob);toast("CSV report pack downloaded.");
}
function openExportCenter(){
 const dialog=$("#exportDialog");if(!dialog)return;
 if(typeof dialog.showModal==="function"){if(!dialog.open)dialog.showModal();}
 else dialog.setAttribute("open","");
}
function closeExportCenter(){
 const dialog=$("#exportDialog");if(!dialog)return;
 if(typeof dialog.close==="function"&&dialog.open)dialog.close();
 else dialog.removeAttribute("open");
}
function generateExcelReport(){
 try{
  if(!window.ModelWorkbook?.exportWorkbook)throw new Error("Excel report builder is unavailable. Refresh the page and try again.");
  const selectedSheets=Array.from(new Set($$(".export-module:checked").flatMap(el=>String(el.dataset.sheets||"").split("|").filter(Boolean))));
  if(!selectedSheets.length)throw new Error("Select at least one report section.");
  const layout="tabs";
  const filename=window.ModelWorkbook.exportWorkbook(project,forecast,valuation,ratios,{selectedSheets,layout});
  closeExportCenter();
  toast("Report downloaded: "+filename);
 }catch(error){toast("Export failed: "+(error?.message||String(error)));}
}
function saveProjectFile(){const blob=new Blob([JSON.stringify(project,null,2)],{type:"application/json"});downloadBlob((project.profile.name||"ModelForge").replace(/[^a-z0-9]+/gi,"_")+"_project.json",blob);toast("Project backup downloaded.")}
function loadProjectFile(file){const reader=new FileReader();reader.onload=()=>{try{const p=JSON.parse(reader.result);if(!p.profile||!p.history)throw new Error("Not a ModelForge project file.");project=normaliseProject(p);syncProfile();renderAssumptions();renderWACC();renderTerminal();renderMapping();renderManualEntry();rebuild();persist();toast("Project loaded.")}catch(e){toast("Could not load project: "+e.message)}};reader.readAsText(file)}


function comparePeriods(a,b){
 const ya=Number(String(a).match(/(?:19|20)\\d{2}/)?.[0]),yb=Number(String(b).match(/(?:19|20)\\d{2}/)?.[0]);
 if(Number.isFinite(ya)&&Number.isFinite(yb)&&ya!==yb)return ya-yb;
 return String(a).localeCompare(String(b),undefined,{numeric:true});
}
function renderManualEntry(){
 project=normaliseProject(project);
 const periodSelect=$("#manualPeriodSelect"),statementSelect=$("#manualStatementSelect");
 if(!periodSelect||!statementSelect)return;
 const periods=project.history.periods,previous=periodSelect.value;
 periodSelect.innerHTML=periods.map(p=>'<option value="'+esc(p)+'">'+esc(p)+'</option>').join("");
 periodSelect.value=periods.includes(previous)?previous:periods.at(-1);
 const group=statementSelect.value||"IS",index=periods.indexOf(periodSelect.value);
 $("#manualEntryGrid").innerHTML=(E.ITEMS[group]||[]).map(([key,label])=>{
  const value=index>=0?project.history[group][key][index]:null;
  return '<label class="manual-field">'+esc(label)+'<input type="number" step="any" data-manual-key="'+esc(key)+'" value="'+(value===null||value===undefined?"":esc(value))+'" placeholder="Enter amount"></label>';
 }).join("");
 $("#manualEntryStatus").textContent=index>=0?"Editing "+periodSelect.value+" · "+(project.profile.currency||"INR")+" "+(project.profile.unit||"millions")+". Changes are saved when you click Save figures.":"Add a period to start entering data.";
}
function addManualPeriod(){
 const input=$("#newManualPeriod"),value=input.value.trim();
 if(!value){toast("Enter a year or period first.");input.focus();return}
 const h=project.history,oldPeriods=h.periods.slice();
 if(!oldPeriods.includes(value)){
  const sorted=[...oldPeriods,value].sort(comparePeriods);
  Object.keys(E.ITEMS).forEach(group=>E.ITEMS[group].forEach(([key])=>{
   const oldValues=h[group][key]||[];
   h[group][key]=sorted.map(period=>period===value?null:(oldValues[oldPeriods.indexOf(period)]??null));
  }));
  h.periods=sorted;
 }
 $("#manualPeriodSelect").value=value;input.value="";
 renderManualEntry();rebuild();persist();toast("Period "+value+" added.");
}
function saveManualEntry(){
 const group=$("#manualStatementSelect").value,period=$("#manualPeriodSelect").value,index=project.history.periods.indexOf(period);
 if(index<0){toast("Choose or add a reporting period first.");return}
 let entered=0;
 $$("#manualEntryGrid [data-manual-key]").forEach(el=>{
  const value=E.parseNumber(el.value);
  project.history[group][el.dataset.manualKey][index]=value;
  if(value!==null)entered++;
 });
 rebuild();persist();
 $("#manualEntryStatus").textContent=entered+" figures saved for "+period+".";
 toast("Financial figures saved for "+period+".");
}
function startBlank(){
 const p=E.defaultProject(),year=String(new Date().getFullYear());
 p.profile={name:"",analyst:"Financial Analyst",industry:"",valuationDate:new Date().toISOString().slice(0,10),currency:"INR",unit:"millions",frequency:"Annual",sharesOutstanding:100};
 p.history=E.blankHistory([year]);p.peers=[];p.rawRecords=[];p.mapping={};p.importMeta={source:"Blank manual-entry model",sourceFiles:[],importedAt:"",sourceNotes:["Values entered manually by the user; retain citations and supporting filings outside this browser application."]};
 project=normaliseProject(p);syncProfile();renderAssumptions();renderWACC();renderTerminal();renderMapping();rebuild();renderManualEntry();persist();showPage("data");
 toast("Blank company created. Add your company details and enter financials.");
}
function addPeriod(){
 showPage("data");$("#newManualPeriod").focus();
 toast("Add the reporting period in the manual-entry section.");
}
function resetAssumptions(){project.assumptions=clone(E.DEFAULT_ASSUMPTIONS);renderAssumptions();rebuild();persist();toast("Forecast assumptions reset.")}
function bindEvents(){
 syncProfile();
 const pfields={companyName:"name",analystName:"analyst",industry:"industry",valuationDate:"valuationDate",currency:"currency",unit:"unit",frequency:"frequency",shares:"sharesOutstanding"};
 Object.entries(pfields).forEach(([id,key])=>$("#"+id).addEventListener("change",e=>{project.profile[key]=key==="sharesOutstanding"?n(e.target.value):e.target.value;rebuild();renderAssumptions();renderWACC();persist()}));
 $("#themeSelect").addEventListener("change",e=>{project.theme=e.target.value;document.body.dataset.theme=project.theme;persist();drawCharts()});
 $("#historyStatement").addEventListener("change",renderHistoryEditor);
 $("#manualPeriodSelect").addEventListener("change",renderManualEntry);
 $("#manualEntryGrid").addEventListener("change",e=>{
  const el=e.target.closest("[data-manual-key]");if(!el)return;
  const period=$("#manualPeriodSelect").value,index=project.history.periods.indexOf(period),group=$("#manualStatementSelect").value;
  if(index<0)return;
  project.history[group][el.dataset.manualKey][index]=E.parseNumber(el.value);
  persist();
 });

 $("#manualStatementSelect").addEventListener("change",renderManualEntry);
 $("#addManualPeriod").addEventListener("click",addManualPeriod);
 $("#saveManualEntry").addEventListener("click",saveManualEntry);
 $("#startBlank").addEventListener("click",startBlank);
 $("#openImport").addEventListener("click",()=>{showPage("data");$("#importPanel").scrollIntoView({behavior:"smooth",block:"start"})});
 $("#historyEditor").addEventListener("change",e=>{const el=e.target.closest("[data-hist-group]");if(!el)return;project.history[el.dataset.histGroup][el.dataset.histKey][n(el.dataset.histIndex)]=E.parseNumber(el.value);rebuild();persist()});
 $("#addPeriod").addEventListener("click",addPeriod);
 $("#forecastYears").addEventListener("change",e=>{project.forecastYears=n(e.target.value);rebuild();persist()});
 $("#resetAssumptions").addEventListener("click",resetAssumptions);
 $("#runChecks").addEventListener("click",()=>{renderValidation();toast("Validation checks refreshed.")});
 $("#applyMapping").addEventListener("click",applyMapping);
 $("#loadSample").addEventListener("click",loadSample);
 $("#fileInput").addEventListener("change",async e=>{const files=Array.from(e.target.files||[]);try{await importStatements(files)}catch(err){showImportError(err)}finally{e.target.value="";}});
 const dropZone=$("#fileInput").closest(".upload-drop");
 ["dragenter","dragover"].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault();e.stopPropagation();dropZone.classList.add("dragging")}));
 ["dragleave","dragend"].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault();dropZone.classList.remove("dragging")}));
 dropZone.addEventListener("drop",async e=>{e.preventDefault();e.stopPropagation();dropZone.classList.remove("dragging");try{await importStatements(Array.from(e.dataTransfer?.files||[]))}catch(err){showImportError(err)}});
 $("#downloadExcelTemplate").addEventListener("click",()=>{try{if(!window.ModelWorkbook?.downloadDataTemplate)throw new Error("Excel template generator is not loaded.");window.ModelWorkbook.downloadDataTemplate();toast("Blank Excel template downloaded.")}catch(err){toast("Template download failed: "+err.message)}});
 $("#downloadSampleCsv").addEventListener("click",()=>{const headers=["period","Revenue","Cost of goods sold","Gross profit","Employee expenses","Other operating expenses","EBITDA","Depreciation","EBIT","Interest expense","Profit before tax","Tax","Net income","Cash","Accounts receivable","Inventory","Other current assets","PP&E","Total assets","Accounts payable","Short-term debt","Long-term debt","Other liabilities","Shareholders equity","Total liabilities and equity","Cash flow from operations","Capital expenditure","Cash flow from investing","Cash flow from financing","Free cash flow"];const keys=["revenue","cogs","grossProfit","employeeExpenses","otherOpex","ebitda","da","ebit","interestExpense","pbt","tax","netIncome","cash","ar","inventory","otherCurrentAssets","ppe","totalAssets","ap","shortDebt","longDebt","otherLiabilities","equity","totalLiabEquity","cfo","capex","cfi","cff","fcf"];const rows=[headers];project.history.periods.forEach((period,i)=>rows.push([period,...keys.map(k=>{for(const g of ["IS","BS","CF"])if(project.history[g][k])return project.history[g][k][i]??"";return ""})]));downloadBlob("ModelForge_Sample_Historical_Statements.csv",new Blob([csvText(rows)],{type:"text/csv"}))});
 $("#saveProject").addEventListener("click",saveProjectFile);
 $("#loadProjectFile").addEventListener("change",e=>{if(e.target.files[0])loadProjectFile(e.target.files[0])});
 $("#csvExport").addEventListener("click",exportCsvPack);
 $("#excelExport").addEventListener("click",openExportCenter);
 $("#exportClose").addEventListener("click",closeExportCenter);
 $("#exportCancel").addEventListener("click",closeExportCenter);
 $("#exportGenerate").addEventListener("click",generateExcelReport);
 function syncExportSelectAllLabel(){
  const boxes=$$(".export-module");
  if(!boxes.length)return;
  $("#exportSelectAll").textContent=boxes.every(box=>box.checked)?"Deselect all":"Select all";
 }
 $("#exportSelectAll").addEventListener("click",()=>{
  const boxes=$$(".export-module"),select=boxes.some(box=>!box.checked);
  boxes.forEach(box=>box.checked=select);
  syncExportSelectAllLabel();
 });
 $$(".export-module").forEach(box=>box.addEventListener("change",syncExportSelectAllLabel));
 syncExportSelectAllLabel();
 $$("[name=terminalMethod]").forEach(el=>el.addEventListener("change",()=>{project.dcf.terminalMethod=el.value;renderTerminal();rebuild();persist()}));
 $("#addPeer").addEventListener("click",()=>{project.peers.push({name:"New peer — enter observed data",ev:0,revenue:0,ebitda:0,ebit:0,netIncome:0,marketCap:0,bookEquity:0,synthetic:false});renderPeers();persist()});
 $("#resetPeers").addEventListener("click",()=>{project.peers=clone(E.DEFAULT_PEERS);renderPeers();persist()});
 $("#peerTable").addEventListener("change",e=>{const el=e.target.closest("[data-peer]");if(!el)return;const peer=project.peers[n(el.dataset.peer)];peer[el.dataset.peerKey]=el.dataset.peerKey==="name"?el.value:E.parseNumber(el.value)??0;renderPeers();persist()});
 $("#peerTable").addEventListener("click",e=>{const b=e.target.closest("[data-remove-peer]");if(!b)return;project.peers.splice(n(b.dataset.removePeer),1);renderPeers();persist()});
 ["waccRange","growthRange","multipleRange"].forEach(id=>$("#"+id).addEventListener("change",renderSensitivity));
 $("#chatForm").addEventListener("submit",e=>{e.preventDefault();sendMessage($("#chatInput").value);$("#chatInput").value=""});
 $$("[data-prompt]").forEach(b=>b.addEventListener("click",()=>sendMessage(b.dataset.prompt)));
 $("#resetDemo").addEventListener("click",()=>{if(confirm("Reset all changes and restore the sample project?"))loadSample()});
}
function init(){
 bindEvents();renderAssumptions();renderWACC();renderTerminal();renderMapping();renderManualEntry();
 // Build forecast and valuation before showPage() redraws the active overview charts.
 rebuild();
 showPage("overview");
 window.addEventListener("resize",()=>window.requestAnimationFrame(drawCharts),{passive:true});
 // The first calculation can run before the browser has assigned final canvas dimensions.
 // Draw again after layout so the initial dashboard never leaves blank charts.
 if(typeof window.requestAnimationFrame==="function"){
  window.requestAnimationFrame(()=>window.requestAnimationFrame(drawCharts));
 }else{
  setTimeout(drawCharts,0);
 }
 window.ModelForge={getProject:()=>project,getForecast:()=>forecast,getValuation:()=>valuation,selfTest:()=>E.validateHistory(project.history)};
}
init();
})();