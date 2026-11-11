const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");
const XLSX = require("xlsx-js-style");

const ROOT = path.resolve(__dirname, "..");
const TYPES = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

let server;
let browser;
let baseUrl;

function resolveRequest(pathname) {
  if (pathname === "/") return path.join(ROOT, "index.html");
  if (pathname === "/vendor/xlsx.full.min.js") {
    return path.join(ROOT, "vendor", "xlsx.full.min.js");
  }
  if (pathname === "/vendor/xlsx.bundle.js") {
    return path.join(ROOT, "node_modules", "xlsx-js-style", "dist", "xlsx.bundle.js");
  }
  if (pathname === "/vendor/jszip.min.js") {
    return path.join(ROOT, "node_modules", "jszip", "dist", "jszip.min.js");
  }
  const resolved = path.resolve(ROOT, "." + pathname);
  return resolved.startsWith(ROOT + path.sep) ? resolved : null;
}

test.before(async () => {
  server = http.createServer((request, response) => {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    const file = resolveRequest(decodeURIComponent(pathname));
    if (!file) {
      response.writeHead(400);
      response.end("Bad path");
      return;
    }
    fs.readFile(file, (error, contents) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, {
        "content-type": TYPES[path.extname(file)] || "application/octet-stream",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      response.end(contents);
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  baseUrl = "http://127.0.0.1:" + address.port;
  browser = await chromium.launch({ headless: true });
});

test.after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const externalRequests = [];
  const pageErrors = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.origin !== baseUrl) externalRequests.push(request.url());
  });
  page.on("pageerror", error => pageErrors.push(error.message));
  // The app must remain usable with all non-local network access blocked.
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin === baseUrl) return route.continue();
    return route.abort();
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.ModelForge && window.ModelEngine));
  return { page, externalRequests, pageErrors };
}

test("browser app boots and calculates the synthetic model without API keys or external requests", async () => {
  const { page, externalRequests, pageErrors } = await openPage();
  try {
    assert.equal(await page.locator("#overviewCompany").innerText(), "Aster Industries");
    assert.match(await page.locator("#modelStatus").innerText(), /SYNTHETIC DEMO DATASET/);
    assert.notEqual((await page.locator("#dcfEV").innerText()).trim(), "—");
    assert.deepEqual(externalRequests, [], "the browser-only workflow should not make external requests");
    assert.deepEqual(pageErrors, [], "the application should not throw browser runtime errors");
  } finally {
    await page.close();
  }
});

test("forecast, DCF and sensitivity tabs work in Chromium", async () => {
  const { page, pageErrors } = await openPage();
  try {
    await page.locator('#nav [data-page="model"]').click();
    assert.ok(await page.locator("#forecastIS tbody tr").count() >= 10);
    assert.match(await page.locator("#forecastBalanceBadge").innerText(), /BALANCED/);

    await page.locator('#nav [data-page="dcf"]').click();
    assert.notEqual((await page.locator("#dcfEV").innerText()).trim(), "—");
    assert.equal(await page.locator("#dcfWarnings").isVisible(), false);

    await page.locator('#nav [data-page="sensitivity"]').click();
    assert.ok(await page.locator("#growthSensitivity table").count() === 1);
    assert.deepEqual(pageErrors, []);
  } finally {
    await page.close();
  }
});

test("existing-company models are blocked from valuation until verified financials are loaded", async () => {
  const { page, pageErrors } = await openPage();
  try {
    await page.locator("#chooseExistingCompany").click();
    await page.locator("#universeSearch").fill("RELIANCE");
    await page.locator('[data-select-universe="RELIANCE"]').click();
    await page.locator('#nav [data-page="overview"]').click();
    const readiness = await page.locator("#modelReadiness").innerText();
    assert.match(readiness, /Model not ready for valuation/);
    assert.match(readiness, /Revenue/);
    assert.match(readiness, /Accounts payable/);
    await page.locator('#nav [data-page="dcf"]').click();
    assert.equal(await page.locator("#dcfWarnings").isVisible(), true);
    assert.equal((await page.locator("#dcfEV").innerText()).trim(), "—");
    assert.deepEqual(pageErrors, []);
  } finally {
    await page.close();
  }
});

test("privacy and source-trace disclosures are visible in the data workspace", async () => {
  const { page, pageErrors } = await openPage();
  try {
    await page.locator('#nav [data-page="data"]').click();
    const privacyText = await page.locator(".privacy-notice").innerText();
    assert.match(privacyText, /not encrypted/i);
    assert.match(privacyText, /localStorage/i);

    const traceText = await page.locator("#sourceTrace").innerText();
    assert.match(traceText, /Synthetic demo dataset/);
    assert.match(traceText, /sample-data\/aster_industries\.csv/);
    assert.deepEqual(pageErrors, []);
  } finally {
    await page.close();
  }
});

test("mobile viewport can navigate and read the financial model", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.ModelForge));
    await page.locator('#nav [data-page="dcf"]').click();
    assert.equal(await page.locator("#page-dcf").isVisible(), true);
    assert.ok(await page.locator("#dcfEV").isVisible());
    await page.locator('#nav [data-page="data"]').click();
    assert.equal(await page.locator("#importPanel").isVisible(), true);
  } finally {
    await page.close();
  }
});

test("existing-company picker loads exactly 100 or 200 NSE constituents without demo financials", async () => {
  const { page, pageErrors } = await openPage();
  try {
    await page.locator("#chooseExistingCompany").click();
    assert.equal(await page.locator("#existingCompanyPanel").isVisible(), true);
    assert.equal(await page.locator("#universeResults .universe-row").count(), 100);
    assert.match(await page.locator("#universeSummary").innerText(), /100 of 100/);

    await page.locator("#universeNifty200").click();
    assert.equal(await page.locator("#universeResults .universe-row").count(), 200);
    assert.match(await page.locator("#universeSummary").innerText(), /200 of 200/);

    await page.locator("#universeSearch").fill("RELIANCE");
    assert.equal(await page.locator("#universeResults .universe-row").count(), 1);
    await page.locator('[data-select-universe="RELIANCE"]').click();
    await page.waitForFunction(() => window.ModelForge.getProject().security?.symbol === "RELIANCE");
    const project = await page.evaluate(() => window.ModelForge.getProject());
    assert.equal(project.profile.name, "Reliance Industries Ltd.");
    assert.equal(project.profile.symbol, "RELIANCE");
    assert.deepEqual(project.history.periods.length, 1);
    assert.equal(project.history.IS.revenue[0], null, "a real company must never inherit Aster demo financials");
    assert.match(project.importMeta.sourceNotes.join(" "), /No financial values.*fabricated or prefilled/);
    assert.match(await page.locator("#companyUniverseNotice").innerText(), /No financial statements or market quote are preloaded/);
    const readiness = await page.evaluate(() => window.ModelEngine.modelReadiness(window.ModelForge.getProject().history, "Annual").ready);
    assert.equal(readiness, false, "empty directory selection should remain blocked from valuation");
    assert.deepEqual(pageErrors, []);
  } finally {
    await page.close();
  }
});

test("Load opens the file picker and imports multi-sheet Excel after title rows", async () => {
  const { page, pageErrors } = await openPage();
  try {
    const wb = XLSX.utils.book_new();
    const add = (name, headers, rows) => {
      const sheet = XLSX.utils.aoa_to_sheet([["ACME INDUSTRIES · HISTORICAL FINANCIALS"], headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, sheet, name);
    };
    add("Income Statement",
      ["Period","Revenue","Cost of goods sold","Gross profit","Employee expenses","Other operating expenses","EBITDA","D&A","EBIT","Interest expense","Profit before tax","Tax expense","Net income"],
      [["FY 2024",1000,-520,480,-140,-110,230,-20,210,-10,200,-50,150],["FY 2025",1100,-570,530,-150,-120,260,-22,238,-12,226,-56,170]]);
    add("Balance Sheet",
      ["Period","Cash and cash equivalents","Accounts receivable","Inventory","Other current assets","PP&E","Total assets","Accounts payable","Short-term debt","Long-term debt","Other operating liabilities","Shareholders' equity","Total liabilities and equity"],
      [["FY 2024",100,120,80,20,500,820,90,40,200,90,400,820],["FY 2025",120,130,85,25,540,900,95,45,180,95,485,900]]);
    add("Cash Flow",
      ["Period","Cash flow from operations","Capital expenditure","Cash flow from investing","Cash flow from financing","Free cash flow"],
      [["FY 2024",180,-60,-60,-30,120],["FY 2025",200,-65,-65,-25,135]]);
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const chooserPromise = page.waitForEvent("filechooser");
    await page.locator("#loadCompanyData").click();
    const chooser = await chooserPromise;
    await chooser.setFiles({ name: "ACME_Annual_Statements.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer });
    await page.waitForFunction(() => window.ModelForge.getProject().history.IS.revenue[1] === 1100);
    const project = await page.evaluate(() => ({
      periods: window.ModelForge.getProject().history.periods,
      revenue: window.ModelForge.getProject().history.IS.revenue,
      cash: window.ModelForge.getProject().history.BS.cash,
      capex: window.ModelForge.getProject().history.CF.capex,
      fcf: window.ModelForge.getProject().history.CF.fcf,
      readiness: window.ModelForge.getProject().history.BS.totalAssets[1] - window.ModelForge.getProject().history.BS.totalLiabEquity[1]
    }));
    assert.deepEqual(project.periods, ["2024","2025"]);
    assert.deepEqual(project.revenue, [1000,1100]);
    assert.deepEqual(project.cash, [100,120]);
    assert.deepEqual(project.capex, [-60,-65]);
    assert.deepEqual(project.fcf, [120,135]);
    assert.equal(project.readiness, 0);
    assert.deepEqual(pageErrors, []);
  } finally {
    await page.close();
  }
});

test("CSV import preserves quoted multiline fields and does not split a single record", async () => {
  const { page, pageErrors } = await openPage();
  try {
    const csv = 'Period,Item,Value\r\n2024,"Revenue, audited\r\ncontinuation",100\r\n';
    await page.locator("#fileInput").setInputFiles({
      name: "quoted-statements.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf8"),
    });
    await page.waitForFunction(() => window.ModelForge.getProject().rawRecords?.length === 1);
    const project = await page.evaluate(() => window.ModelForge.getProject());
    assert.equal(project.rawRecords[0].label, "Revenue, audited\r\ncontinuation");
    assert.equal(project.rawRecords[0].value, 100);
    assert.deepEqual(pageErrors, []);
  } finally {
    await page.close();
  }
});

test("uploaded workbooks use the patched SheetJS reader separately from the legacy styled export library", async () => {
  const { page, pageErrors } = await openPage();
  try {
    const versions = await page.evaluate(() => ({
      reader: window.ModelForgeXLSXReader?.version,
      writerAvailable: Boolean(window.ModelForgeXLSXWriter?.utils?.book_new && window.ModelForgeXLSXWriter?.writeFile),
      readerAndWriterAreSeparate: window.ModelForgeXLSXReader !== window.ModelForgeXLSXWriter,
      legacyReadApiExposed: typeof window.XLSX?.read === "function",
    }));
    assert.equal(versions.reader, "0.20.3");
    assert.equal(versions.writerAvailable, true);
    assert.equal(versions.readerAndWriterAreSeparate, true);
    assert.equal(versions.legacyReadApiExposed, false);
    assert.deepEqual(pageErrors, []);
  } finally {
    await page.close();
  }
});

test("malicious project backup values are normalised and cannot inject HTML attributes", async () => {
  const { page, pageErrors } = await openPage();
  try {
    const payload = await page.evaluate(() => {
      const project = JSON.parse(JSON.stringify(window.ModelForge.getProject()));
      project.history.IS.revenue[0] = '" autofocus onfocus="window.__modelForgeInjected=true';
      project.peers[0].revenue = '" autofocus onfocus="window.__modelForgeInjected=true';
      project.rawRecords = [null, { period: "2025", label: "Revenue", value: 100 }];
      return JSON.stringify(project);
    });
    await page.locator("#loadProjectFile").setInputFiles({
      name: "hostile-project.json",
      mimeType: "application/json",
      buffer: Buffer.from(payload, "utf8"),
    });
    await page.waitForFunction(() => document.querySelector("#toast")?.textContent.includes("Project loaded."));
    const result = await page.evaluate(() => ({
      injected: window.__modelForgeInjected === true,
      historyValue: window.ModelForge.getProject().history.IS.revenue[0],
      peerValue: window.ModelForge.getProject().peers[0].revenue,
      injectedElements: document.querySelectorAll("#historyEditor [onfocus], #peerTable [onfocus], #historyEditor img, #peerTable img").length,
    }));
    assert.equal(result.injected, false);
    assert.equal(result.historyValue, null);
    assert.equal(result.peerValue, null);
    assert.equal(result.injectedElements, 0);
    assert.deepEqual(pageErrors, []);
  } finally {
    await page.close();
  }
});
