const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

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

test("blank projects are blocked from valuation and display missing required inputs", async () => {
  const { page, pageErrors } = await openPage();
  try {
    await page.locator("#startBlank").click();
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
    assert.equal(await page.locator("#fileInput").isVisible(), true);
  } finally {
    await page.close();
  }
});
