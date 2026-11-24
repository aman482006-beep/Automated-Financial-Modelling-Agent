const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const E = require("../engine.js");
const universe = require("../universe.js");

test("bundled NSE universe has 200 unique members and a 100-company Nifty 100 subset", () => {
  assert.equal(universe.asOf, "2026-11-06");
  assert.equal(universe.companies.length, 200);
  assert.equal(new Set(universe.companies.map(company => company.symbol)).size, 200);
  assert.equal(universe.companies.filter(company => company.nifty100).length, 100);
  assert.ok(universe.companies.every(company => company.nifty200 === true));
  assert.ok(universe.companies.filter(company => company.nifty100).every(company => company.nifty200));
  for (const company of universe.companies) {
    assert.ok(company.name && company.symbol && company.sector, "Every security needs issuer name, NSE symbol and sector");
  }
});

test("downloadable NSE universe CSV includes all 200 rows and a 100-company Nifty 100 flag", () => {
  const filename = path.join(__dirname, "..", "sample-data", "nse_nifty200_universe.csv");
  const matrix = E.parseCsv(fs.readFileSync(filename, "utf8"));
  assert.deepEqual(matrix[0], ["snapshot_date","company_name","nse_symbol","sector","nifty100_member","nifty200_member"]);
  assert.equal(matrix.length, 201);
  const rows = matrix.slice(1);
  assert.equal(new Set(rows.map(row => row[2])).size, 200);
  assert.equal(rows.filter(row => row[4] === "TRUE").length, 100);
  assert.ok(rows.every(row => row[0] === "2026-11-06" && row[5] === "TRUE"));
  assert.ok(rows.every(row => row[1] && row[2] && row[3]));
});

test("company directory explicitly contains no financial market data", () => {
  assert.match(universe.financialDataNote, /financial statements, share count, prices and market capitalisation are not bundled/i);
  assert.ok(universe.companies.every(company => !("marketCap" in company) && !("revenue" in company) && !("price" in company)));
  assert.ok(universe.sourceUrls.some(url => url.includes("nseindia.com")));
});
