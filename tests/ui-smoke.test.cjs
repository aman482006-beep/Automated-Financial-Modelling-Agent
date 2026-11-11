const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"..","styles.css"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"..","app-main.js"),"utf8");

test("every navigation item has an existing page section",()=>{
 const pages=[...html.matchAll(/data-page="([^"]+)"/g)].map(m=>m[1]);
 const unique=[...new Set(pages)];
 assert.ok(unique.length>=8);
 unique.forEach(page=>assert.ok(html.includes('id="page-'+page+'"'),"Missing page section for "+page));
});

test("static DOM IDs referenced by the app exist in index.html",()=>{
 const ids=[...app.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g)].map(m=>m[1]);
 const missing=[...new Set(ids)].filter(id=>{const needle='id="'+id+'"';return !html.includes(needle)&&!app.includes(needle)});
 assert.deepEqual(missing,[],"Missing DOM IDs: "+missing.join(", "));
});

test("mobile navigation keeps every tab visible in a horizontal scroll strip",()=>{
 assert.ok(css.includes("overflow-x:auto"));
 assert.ok(css.includes(".sidebar nav .nav-btn"));
 assert.ok(css.includes("position:fixed"));
 assert.ok(!css.includes(".nav-btn:not(.active)"));
});

test("theme, CSV, project backup and formula workbook controls are mounted",()=>{
 for(const id of ["themeSelect","csvExport","saveProject","loadProjectFile","excelExport","fileInput","applyMapping","chatForm"])assert.ok(html.includes('id="'+id+'"'),"Missing control: "+id);
 assert.ok(html.includes('await loadScript("./engine.js")'));
 assert.ok(html.includes('await loadScript("./workbook.js")'));
 assert.ok(html.includes('await loadScript("./app-main.js")'));
});


test("export module select-all label stays accurate after individual changes",()=>{
 assert.ok(html.includes('id="exportSelectAll">Deselect all'));
 assert.ok(app.includes("function syncExportSelectAllLabel()"));
 assert.ok(app.includes('$$(".export-module").forEach(box=>box.addEventListener("change",syncExportSelectAllLabel))'));
 assert.ok(app.includes('boxes.every(box=>box.checked)?"Deselect all":"Select all"'));
});


test("both Excel and CSV-pack export libraries have local deployment fallbacks",()=>{
 assert.ok(html.includes('"./vendor/xlsx.bundle.js"'));
 assert.ok(html.includes('"./vendor/jszip.min.js"'));
});


test("sensitivity tables pass an array of column headers to the shared table renderer",()=>{
 const start=app.indexOf("function renderSensitivity()");
 const end=app.indexOf("function renderAssistantContext",start);
 const sensitivity=app.slice(start,end);
 assert.ok(sensitivity.includes('table(headers,rows)'),"WACC sensitivity must use the assembled header array");
 assert.ok(sensitivity.includes('table(["Revenue growth ↓ / EBITDA margin →",...margins.map(x=>pct(x))],rows)'),"Operating sensitivity must pass one header array and one row array");
 assert.doesNotMatch(sensitivity,/table\(method==="growth"\?/);
 assert.doesNotMatch(sensitivity,/table\("Revenue growth/);
});


test("share metadata and canonical application URL are present",()=>{
 assert.ok(html.includes('<meta name="description"'));
 assert.ok(html.includes('property="og:title"'));
 assert.ok(html.includes('property="og:description"'));
 assert.ok(html.includes('name="twitter:card"'));
 assert.ok(html.includes('rel="canonical"'));
});

test("keyboard users can skip navigation and focus the main workspace",()=>{
 assert.ok(html.includes('class="skip-link" href="#main-content"'));
 assert.ok(html.includes('<main class="main" id="main-content" tabindex="-1">'));
 assert.ok(css.includes(".skip-link:focus"));
 assert.ok(css.includes("a:focus-visible"));
 assert.ok(css.includes("textarea:focus-visible"));
});
