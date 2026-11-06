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
