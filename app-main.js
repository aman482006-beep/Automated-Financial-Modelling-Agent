(function(){
"use strict";
const E=window.ModelEngine,$=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const KEY="modelforge.project.v2",symbols={INR:"₹",USD:"$",EUR:"€",GBP:"£",SGD:"S$"};
let project=loadSaved()||E.defaultProject(),forecast=[],ratios=[],valuation,noticeTimer;
function loadSaved(){try{const p=JSON.parse(localStorage.getItem(KEY)||"null");return p&&p.profile&&p.history?p:null}catch(e){return null}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(project));$("#saveStatus").textContent="● Saved locally"}catch(e){$("#saveStatus").textContent="● Not saved (storage full)"}}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.classList.remove("show"),2500)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function n(v){return E.num(v)}
function fmt(v,d=1){return E.formatNumber(Number(v),d)}
function pct(v,d=1){return Number.isFinite(v)?(v*100).toFixed(d)+"%":"—"}
function sym(){return symbols[project.profile.currency]||project.profile.currency+" "}
function cash(v,d=1){return Number.isFinite(v)?sym()+fmt(v,d):"—"}
function showPage(page){const id="page-"+page;if(!$("#"+id))return;$$(".page").forEach(x=>x.classList.toggle("active",x.id===id));$$(".nav-btn").forEach(x=>{const active=x.dataset.page===page;x.classList.toggle("active",active);if(active)x.setAttribute("aria-current","page");else x.removeAttribute("aria-current")});const labels={overview:"Overview",data:"Enter data",history:"History",model:"Forecast",dcf:"DCF",comps:"Peers",sensitivity:"Scenarios",assistant:"Assistant"};$("#pageTitle").textContent=labels[page]||page;window.scrollTo({top:0,behavior:"smooth"});if(["overview","history","dcf"].includes(page))drawCharts()}
document.addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(b){e.preventDefault();showPage(b.dataset.page)}});
function syncProfile(){const p=project.profile;$("#companyName").value=p.name||"";$("#analystName").value=p.analyst||"";$("#industry").value=p.industry||"";$("#valuationDate").value=p.valuationDate||"";$("#currency").value=p.currency||"INR";$("#unit").value=p.unit||"millions";$("#frequency").value=p.frequency||"Annual";$("#shares").value=p.sharesOutstanding??100;$("#sideCompany").textContent=p.name||"Untitled project";$("#overviewCompany").textContent=p.name||"Untitled project";$("#themeSelect").value=project.theme||"light";document.body.dataset.theme=project.theme||"light"}
function getLatest(g,k){const arr=project.history[g]?.[k]||[];const v=arr[arr.length-1];return v===null?null:n(v)}
function rebuild(){project.dcf.sharesOutstanding=n(project.profile.sharesOutstanding)||100;forecast=E.buildForecast(project.history,project.assumptions,n(project.forecastYears)||5);valuation=E.calculateDCF(forecast,project.history,project.dcf,project.assumptions);ratios=E.historicalRatios(project.history);renderEverything()}
function metric(label,value,desc){return '<div class="metric-card"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><em>'+esc(desc||"")+'</em></div>'}
function table(head,rows){return "<thead><tr>"+head.map((x,i)=>"<th>"+esc(x)+"</th>").join("")+"</tr></thead><tbody>"+rows.map(r=>"<tr>"+r.map(x=>"<td>"+(x===null||x===undefined?"":x)+"</td>").join("")+"</tr>").join("")+"</tbody>"}
function renderOverview(){
 const p=project.profile,h=project.history,r=ratios.at(-1)||{},rev=getLatest("IS","revenue"),cagr=h.periods.length>1&&n(h.IS.revenue[0])>0?Math.pow(n(rev)/n(h.IS.revenue[0]),1/(h.periods.length-1))-1:null,last=forecast.at(-1)||{};
 $("#overviewCompany").textContent=p.name||"Untitled project";$("#sideCompany").textContent=p.name||"Untitled project";
 $("#overviewMetrics").innerHTML=[metric("LATEST REVENUE",cash(rev),h.periods.at(-1)||"No period loaded"),metric("EBITDA MARGIN",pct(r.ebitdaMargin),"Latest reported period"),metric("REVENUE CAGR",pct(cagr),h.periods.length>1?h.periods[0]+"–"+h.periods.at(-1):"Not enough data"),metric("FINAL FORECAST EBITDA",cash(last.ebitda),last.year||"No forecast")].join("");
 $("#overviewEV").textContent=cash(valuation.enterpriseValue);$("#overviewEquity").textContent=cash(valuation.equityValue);$("#overviewPerShare").textContent=Number.isFinite(valuation.perShare)?sym()+fmt(valuation.perShare,2):"—";
 const warnings=E.validateHistory(h).filter(x=>!x.ok).length;$("#modelStatus").textContent=project.rawRecords?.length?"IMPORTED DATA":"SAMPLE PROJECT";$("#modelStatus").className="status-pill"+(warnings?" warning":"");
}
function renderValidation(){
 const results=E.validateHistory(project.history);
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
 $("#historyMetrics").innerHTML=[metric("REVENUE CAGR",pct(cagr),"First to latest"),metric("EBITDA MARGIN",pct(last.ebitdaMargin),"Latest reported"),metric("RETURN ON EQUITY",pct(last.roe),"Average equity basis"),metric("FREE CASH FLOW",cash(last.freeCashFlow),"Latest reported / derived")].join("");
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
 $("[name=terminalMethod]").forEach(el=>el.checked=el.value===project.dcf.terminalMethod);
 const g=project.dcf.terminalMethod==="growth";
 $("#terminalInputs").innerHTML=g?'<label>Perpetual growth rate (%)<input id="terminalValueInput" type="number" step=".1" value="'+(project.dcf.perpetualGrowth*100)+'"></label>':'<label>Exit EBITDA multiple (x)<input id="terminalValueInput" type="number" step=".1" value="'+project.dcf.exitMultiple+'"></label>';
 $("#terminalValueInput").addEventListener("change",e=>{if(g)project.dcf.perpetualGrowth=n(e.target.value)/100;else project.dcf.exitMultiple=n(e.target.value);rebuild();persist()});
}
function renderDCF(){
 const v=valuation;$("#costEquity").textContent=pct(v.costEquity,2);$("#waccValue").textContent=pct(v.wacc,2);$("#dcfEV").textContent=cash(v.enterpriseValue);$("#pvForecast").textContent=cash(v.pvForecast);$("#pvTerminal").textContent=cash(v.pvTerminal);$("#dcfEVBridge").textContent=cash(v.enterpriseValue);$("#dcfNetDebt").textContent=cash(v.netDebt);$("#dcfEquity").textContent=cash(v.equityValue);$("#dcfPerShare").textContent=Number.isFinite(v.perShare)?sym()+fmt(v.perShare,2):"N/M";
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
 const w=valuation.wacc,g=project.dcf.perpetualGrowth,m=project.dcf.exitMultiple,wr=Math.max(.0025,n($("#waccRange").value)/100),gr=Math.max(.001,n($("#growthRange").value)/100),mr=Math.max(.25,n($("#multipleRange").value)),steps=[-2,-1,0,1,2];
 function grid(method){const axes=steps.map(s=>method==="growth"?g+s*gr:m+s*mr/2);const rows=steps.map(s=>{const rate=w+s*wr;return ["<b>"+pct(rate,2)+"</b>",...axes.map((x,i)=>{const v=dcfAt(rate,method,method==="growth"?x:g,method==="multiple"?x:m);return '<span class="'+(s===0&&i===2?"base":v>=valuation.enterpriseValue?"higher":"lower")+'">'+fmt(v,0)+'</span>'})]});return '<table class="sensitivity-table">'+table(method==="growth"?"WACC ↓ / growth →":"WACC ↓ / exit multiple →",axes.map(x=>method==="growth"?pct(x,2):fmt(x,1)+"x"),rows)+'</table>'}
 $("#growthSensitivity").innerHTML=grid("growth");$("#multipleSensitivity").innerHTML=grid("multiple");
 const growths=steps.map(s=>project.assumptions.revenueGrowth+s*.02),margins=steps.map(s=>project.assumptions.grossMargin-project.assumptions.employeePct-project.assumptions.otherOpexPct+s*.02);
 const rows=growths.map(growth=>["<b>"+pct(growth)+"</b>",...margins.map(margin=>{const a={...project.assumptions,revenueGrowth:growth,grossMargin:margin+project.assumptions.employeePct+project.assumptions.otherOpexPct};return fmt(E.operatingScenario(project.history,a,project.forecastYears,project.dcf),0)})]);
 $("#operatingSensitivity").innerHTML='<table class="sensitivity-table">'+table("Revenue growth ↓ / EBITDA margin →",margins.map(x=>pct(x)),rows)+'</table>';
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
function drawCharts(){const h=project.history,periods=h.periods;chart("revenueChart",[{values:h.IS.revenue.map(x=>n(x)).concat(forecast.map(x=>x.revenue)),color:"#316bd0"}],periods.concat(forecast.map(x=>x.year)));chart("marginChart",[{values:ratios.map(x=>n(x.grossMargin)*100),color:"#316bd0"},{values:ratios.map(x=>n(x.ebitdaMargin)*100),color:"#20966c"},{values:ratios.map(x=>n(x.netMargin)*100),color:"#d49b3d"}],periods);chart("cashChart",[{values:h.IS.ebitda.map(n),color:"#316bd0"},{values:h.CF.fcf.map((x,i)=>x===null?n(h.CF.cfo[i])+n(h.CF.capex[i]):n(x)),color:"#20966c"}],periods);chart("dcfChart",[{values:valuation.flows.map(x=>x.ufcf),color:"#316bd0"},{values:valuation.flows.map(x=>x.ufcf*x.discountFactor),color:"#20966c"}],valuation.flows.map(x=>x.year))}
function renderEverything(){renderOverview();renderValidation();renderHistory();renderForecast();renderDCF();renderPeers();renderSensitivity();renderAssistantContext();drawCharts()}
function parseCsv(txt){
 const lines=txt.replace(/^\uFEFF/,"").split(/\r?\n/).filter(x=>x.trim()),parse=line=>{let arr=[],v="",q=false;for(let i=0;i<line.length;i++){let ch=line[i];if(ch==='"'&&line[i+1]==='"'&&q){v+='"';i++}else if(ch==='"')q=!q;else if(ch===","&&!q){arr.push(v);v=""}else v+=ch}arr.push(v);return arr};if(!lines.length)return [];const heads=parse(lines[0]).map(x=>x.trim());return lines.slice(1).map(l=>{const values=parse(l),obj={};heads.forEach((k,i)=>obj[k]=values[i]??"");return obj});
}
function headerKey(keys,wanted){return keys.find(k=>wanted.includes(E.normaliseLabel(k)))}
function periodText(v){if(v instanceof Date)return String(v.getFullYear());const s=String(v??"").trim(),m=s.match(/(?:19|20)\d{2}/);return m?m[0]:s}
function recordsFromRows(rows,sheetName,fileName){
 if(!rows.length)return [];const keys=Object.keys(rows[0]),periodKey=headerKey(keys,["period","year","date","fiscalyear","quarter"]),itemKey=headerKey(keys,["item","lineitem","account","description","particulars"]),valueKey=headerKey(keys,["value","amount","balance","reportedvalue","financialvalue"]),statementKey=headerKey(keys,["statement","statementtype","category"]),out=[];
 if(periodKey&&itemKey&&valueKey){rows.forEach(r=>{const period=periodText(r[periodKey]);if(period)out.push({period,label:String(r[itemKey]||""),value:E.parseNumber(r[valueKey]),statement:r[statementKey]||sheetName||fileName||""})});return out}
 if(periodKey){rows.forEach(r=>{const p=periodText(r[periodKey]);if(!p)return;keys.forEach(k=>{if([periodKey,statementKey].includes(k)||["currency","unit","company"].includes(E.normaliseLabel(k)))return;const v=E.parseNumber(r[k]);if(v!==null)out.push({period:p,label:k,value:v,statement:r[statementKey]||sheetName||fileName||""})})});return out}
 const first=keys[0],periods=keys.slice(1).filter(k=>/^(?:19|20)\d{2}$|^Q[1-4][ -]?(?:19|20)\d{2}$/i.test(String(k).trim()));
 if(first&&periods.length)rows.forEach(r=>periods.forEach(p=>{const v=E.parseNumber(r[p]);if(v!==null)out.push({period:periodText(p),label:String(r[first]||""),value:v,statement:sheetName||fileName||""})}));
 return out;
}
function renderMapping(){
 const labels=Array.from(new Set((project.rawRecords||[]).map(r=>r.label)));
 if(!labels.length){$("#mappingTable").innerHTML='<tbody><tr><td>No source labels imported yet. Load sample statements or upload CSV / Excel files.</td></tr></tbody>';return}
 const options=['<option value="ignore">Do not map</option>'].concat(Object.keys(E.ITEMS).flatMap(g=>E.ITEMS[g].map(([k,label])=>'<option value="'+g+"."+k+'">'+g+" · "+esc(label)+'</option>'))).join("");
 $("#mappingTable").innerHTML="<thead><tr><th>Source field</th><th>Values</th><th>Model field</th></tr></thead><tbody>"+labels.map(label=>'<tr><td>'+esc(label)+'</td><td>'+project.rawRecords.filter(r=>r.label===label).length+'</td><td><select data-map="'+esc(label)+'">'+options.replace('value="'+esc(project.mapping[label]||"ignore")+'"','value="'+esc(project.mapping[label]||"ignore")+'" selected')+'</select></td></tr>').join("")+"</tbody>";
 $$("[data-map]").forEach(el=>el.addEventListener("change",()=>{project.mapping[el.dataset.map]=el.value;persist()}));
}
async function importStatements(files){
 if(!files.length)return;let records=[];
 for(const file of files){const ext=file.name.split(".").pop().toLowerCase();if(ext==="csv")records=records.concat(recordsFromRows(parseCsv(await file.text()),"",file.name));else if(["xlsx","xls"].includes(ext)){if(!window.XLSX)throw new Error("Excel reader unavailable. Try CSV or reload with internet access.");const wb=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true});wb.SheetNames.forEach(name=>records=records.concat(recordsFromRows(XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:null,raw:true}),name,file.name)))}}
 if(!records.length)throw new Error("No valid financial rows found. Use Period / Item / Value or Period / Revenue / EBITDA-style columns.");
 project.rawRecords=(project.rawRecords||[]).concat(records);Array.from(new Set(project.rawRecords.map(r=>r.label))).forEach(label=>{if(project.mapping[label]===undefined)project.mapping[label]=E.mapLabel(label)||"ignore"});
 project.history=E.historyFromRecords(project.rawRecords,project.mapping);renderMapping();renderManualEntry();rebuild();persist();$("#importStatus").textContent="Imported "+records.length+" line-item values from "+files.length+" file(s). Review mappings and checks.";toast("Import complete. Review data mapping and validation.");
}
function applyMapping(){project.history=E.historyFromRecords(project.rawRecords||[],project.mapping||{});renderManualEntry();rebuild();persist();toast("Source mappings applied.")}
function loadSample(){const p=E.defaultProject();project=p;syncProfile();renderAssumptions();renderWACC();renderTerminal();renderMapping();renderManualEntry();rebuild();persist();$("#importStatus").textContent="Synthetic sample company loaded.";toast("Sample company restored.")}
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
function saveProjectFile(){const blob=new Blob([JSON.stringify(project,null,2)],{type:"application/json"});downloadBlob((project.profile.name||"ModelForge").replace(/[^a-z0-9]+/gi,"_")+"_project.json",blob);toast("Project backup downloaded.")}
function loadProjectFile(file){const reader=new FileReader();reader.onload=()=>{try{const p=JSON.parse(reader.result);if(!p.profile||!p.history||!p.assumptions||!p.dcf)throw new Error("Not a ModelForge project file.");project=p;syncProfile();renderAssumptions();renderWACC();renderTerminal();renderMapping();renderManualEntry();rebuild();persist();toast("Project loaded.")}catch(e){toast("Could not load project: "+e.message)}};reader.readAsText(file)}

function renderManualEntry(){
 const periodSelect=$("#manualPeriodSelect"),statementSelect=$("#manualStatementSelect");
 if(!periodSelect||!statementSelect)return;
 const periods=project.history.periods||[],previous=periodSelect.value;
 periodSelect.innerHTML=periods.map(p=>'<option value="'+esc(p)+'">'+esc(p)+'</option>').join("");
 periodSelect.value=periods.includes(previous)?previous:(periods.at(-1)||"");
 const group=statementSelect.value||"IS",index=periods.indexOf(periodSelect.value);
 $("#manualEntryGrid").innerHTML=(E.ITEMS[group]||[]).map(([key,label])=>{
  const value=index>=0?project.history[group][key][index]:null;
  return '<label class="manual-field">'+esc(label)+'<input type="number" step="any" data-manual-key="'+esc(key)+'" value="'+(value===null||value===undefined?"":esc(value))+'" placeholder="Enter amount"></label>';
 }).join("");
 $("#manualEntryStatus").textContent=index>=0?"Editing "+periodSelect.value+" · "+(project.profile.currency||"INR")+" "+(project.profile.unit||"millions"):"Add a period to start entering data.";
}
function addManualPeriod(){
 const input=$("#newManualPeriod"),value=input.value.trim();
 if(!value){toast("Enter a year or period first.");input.focus();return}
 const h=project.history;
 if(!h.periods.includes(value)){
  h.periods.push(value);
  Object.keys(E.ITEMS).forEach(g=>E.ITEMS[g].forEach(([key])=>h[g][key].push(null)));
 }
 $("#manualPeriodSelect").value=value;input.value="";
 renderManualEntry();rebuild();persist();toast("Period "+value+" added.");
}
function saveManualEntry(){
 const group=$("#manualStatementSelect").value,period=$("#manualPeriodSelect").value,index=project.history.periods.indexOf(period);
 if(index<0){toast("Add a period before saving figures.");return}
 let entered=0;
 $("#manualEntryGrid [data-manual-key]").forEach(el=>{
  const value=E.parseNumber(el.value);
  project.history[group][el.dataset.manualKey][index]=value;
  if(value!==null)entered++;
 });
 rebuild();renderManualEntry();persist();
 $("#manualEntryStatus").textContent=entered+" figures saved for "+period+".";
 toast("Financial figures saved.");
}
function startBlank(){
 const p=E.defaultProject();
 p.profile={name:"",analyst:"",industry:"",valuationDate:new Date().toISOString().slice(0,10),currency:"INR",unit:"millions",frequency:"Annual",sharesOutstanding:100};
 p.history=E.blankHistory(["2025"]);p.peers=[];p.rawRecords=[];p.mapping={};
 project=p;syncProfile();renderAssumptions();renderWACC();renderTerminal();renderMapping();rebuild();renderManualEntry();persist();showPage("data");
 toast("Blank company created. Add your company details and enter financials.");
}

function addPeriod(){const value=prompt("Enter a period label, for example 2026 or Q1 2026:");if(!value||!value.trim())return;const h=project.history;if(h.periods.includes(value.trim())){toast("That period already exists.");return}h.periods.push(value.trim());Object.keys(E.ITEMS).forEach(g=>E.ITEMS[g].forEach(([k])=>h[g][k].push(null)));renderHistory();rebuild();persist()}
function resetAssumptions(){project.assumptions=clone(E.DEFAULT_ASSUMPTIONS);renderAssumptions();rebuild();persist();toast("Forecast assumptions reset.")}
function bindEvents(){
 syncProfile();
 const pfields={companyName:"name",analystName:"analyst",industry:"industry",valuationDate:"valuationDate",currency:"currency",unit:"unit",frequency:"frequency",shares:"sharesOutstanding"};
 Object.entries(pfields).forEach(([id,key])=>$("#"+id).addEventListener("change",e=>{project.profile[key]=key==="sharesOutstanding"?n(e.target.value):e.target.value;rebuild();renderAssumptions();renderWACC();persist()}));
 $("#themeSelect").addEventListener("change",e=>{project.theme=e.target.value;document.body.dataset.theme=project.theme;persist();drawCharts()});
 $("#historyStatement").addEventListener("change",renderHistoryEditor);
 $("#manualPeriodSelect").addEventListener("change",renderManualEntry);
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
 $("#fileInput").addEventListener("change",async e=>{try{await importStatements(Array.from(e.target.files||[]))}catch(err){toast(err.message)}});
 const dropZone=$("#fileInput").closest(".upload-drop");
 ["dragenter","dragover"].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault();e.stopPropagation();dropZone.classList.add("dragging")}));
 ["dragleave","dragend"].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault();dropZone.classList.remove("dragging")}));
 dropZone.addEventListener("drop",async e=>{e.preventDefault();e.stopPropagation();dropZone.classList.remove("dragging");try{await importStatements(Array.from(e.dataTransfer?.files||[]))}catch(err){toast(err.message)}});
 $("#downloadSampleCsv").addEventListener("click",()=>{const headers=["period","Revenue","Cost of goods sold","Gross profit","Employee expenses","Other operating expenses","EBITDA","Depreciation","EBIT","Interest expense","Profit before tax","Tax","Net income","Cash","Accounts receivable","Inventory","Other current assets","PP&E","Total assets","Accounts payable","Short-term debt","Long-term debt","Other liabilities","Shareholders equity","Total liabilities and equity","Cash flow from operations","Capital expenditure","Cash flow from investing","Cash flow from financing","Free cash flow"];const keys=["revenue","cogs","grossProfit","employeeExpenses","otherOpex","ebitda","da","ebit","interestExpense","pbt","tax","netIncome","cash","ar","inventory","otherCurrentAssets","ppe","totalAssets","ap","shortDebt","longDebt","otherLiabilities","equity","totalLiabEquity","cfo","capex","cfi","cff","fcf"];const rows=[headers];project.history.periods.forEach((period,i)=>rows.push([period,...keys.map(k=>{for(const g of ["IS","BS","CF"])if(project.history[g][k])return project.history[g][k][i]??"";return ""})]));downloadBlob("ModelForge_Sample_Historical_Statements.csv",new Blob([csvText(rows)],{type:"text/csv"}))});
 $("#saveProject").addEventListener("click",saveProjectFile);
 $("#loadProjectFile").addEventListener("change",e=>{if(e.target.files[0])loadProjectFile(e.target.files[0])});
 $("#csvExport").addEventListener("click",exportCsvPack);
 $("#excelExport").addEventListener("click",()=>{try{if(!window.ModelWorkbook)throw new Error("Workbook module has not loaded.");window.ModelWorkbook.exportWorkbook(project,forecast,valuation,ratios);toast("Formula-linked Excel model exported.")}catch(e){toast("Excel export failed: "+e.message)}});
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
 bindEvents();renderAssumptions();renderWACC();renderTerminal();renderMapping();renderManualEntry();rebuild();showPage("overview");
 window.addEventListener("resize",drawCharts);
 window.ModelForge={getProject:()=>project,getForecast:()=>forecast,getValuation:()=>valuation,selfTest:()=>E.validateHistory(project.history)};
}
init();
})();