const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const XLSX = require("xlsx-js-style");
const E = require("../engine.js");

global.window = { XLSX, ModelEngine: E };
require("../workbook.js");

function findLibreOffice() {
  for (const name of ["libreoffice", "soffice"]) {
    const result = spawnSync("which", [name], { encoding: "utf8" });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }
  return null;
}

test("LibreOffice recalculates exported Excel formulas to the engine's DCF result", {
  skip: !findLibreOffice() && "LibreOffice is not installed; CI installs libreoffice-calc for this integration test.",
  timeout: 120000,
}, () => {
  const binary = findLibreOffice();
  const project = E.defaultProject();
  const forecast = E.buildForecast(project.history, project.assumptions, project.forecastYears);
  const ratios = E.historicalRatios(project.history);
  const valuation = E.calculateDCF(forecast, project.history, project.dcf, project.assumptions);
  assert.equal(valuation.valid, true);

  const originalCwd = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "modelforge-formula-recalc-"));
  const outputDir = path.join(tempRoot, "recalculated");
  const profileDir = path.join(tempRoot, "lo-profile");
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    process.chdir(tempRoot);
    const filename = window.ModelWorkbook.exportWorkbook(project, forecast, valuation, ratios);
    const sourcePath = path.join(tempRoot, filename);
    assert.ok(fs.existsSync(sourcePath), "the workbook should be written before recalculation");

    const converted = spawnSync(binary, [
      "--headless",
      "-env:UserInstallation=file://" + profileDir,
      "--convert-to", "xlsx",
      "--outdir", outputDir,
      sourcePath,
    ], { encoding: "utf8", timeout: 90000 });

    assert.equal(converted.status, 0, [
      "LibreOffice must recalculate the exported workbook.",
      converted.stdout,
      converted.stderr,
    ].join("\n"));

    const recalculatedPath = path.join(outputDir, filename);
    assert.ok(fs.existsSync(recalculatedPath), "LibreOffice should create the recalculated workbook");

    const recalculated = XLSX.readFile(recalculatedPath, { cellFormula: true });
    const dcf = recalculated.Sheets.DCF;
    assert.ok(dcf, "the recalculated workbook should retain its DCF worksheet");
    assert.equal(typeof dcf.B18.f, "string", "enterprise value remains formula-linked");
    assert.ok(Number.isFinite(dcf.B18.v), "enterprise value formula must calculate to a number");
    assert.ok(Number.isFinite(dcf.B3.v), "WACC formula must calculate to a number");

    const tolerance = Math.max(0.01, Math.abs(valuation.enterpriseValue) * 1e-6);
    assert.ok(
      Math.abs(dcf.B18.v - valuation.enterpriseValue) <= tolerance,
      "Excel enterprise value " + dcf.B18.v + " should reconcile to engine result " +
        valuation.enterpriseValue + " (tolerance " + tolerance + ")."
    );
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
