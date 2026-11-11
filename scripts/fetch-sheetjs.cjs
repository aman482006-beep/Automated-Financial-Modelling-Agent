#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const VERSION = "0.20.3";
const URL = "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz";
const EXPECTED_SHA512 = "oLDq3jw7AcLqKWH2AhCpVTZl8mf6X2YReP+Neh0SJUzV/BdZYjth94tG5toiMB1PPrYtxOCfaoUCkvtuH+3AJA==";
const ROOT = path.resolve(__dirname, "..");

async function main() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "modelforge-sheetjs-"));
  try {
    const response = await fetch(URL, { redirect: "follow" });
    if (!response.ok) throw new Error("SheetJS download failed: HTTP " + response.status);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 10 * 1024 * 1024) {
      throw new Error("Unexpected SheetJS archive size: " + bytes.length + " bytes.");
    }

    const actual = createHash("sha512").update(bytes).digest("base64");
    if (actual !== EXPECTED_SHA512) {
      throw new Error("SheetJS archive SHA-512 mismatch. Refusing to use unverified code.");
    }

    const archive = path.join(temp, "xlsx-" + VERSION + ".tgz");
    const extract = path.join(temp, "extract");
    await fs.mkdir(extract, { recursive: true });
    await fs.writeFile(archive, bytes, { mode: 0o600 });

    const result = spawnSync("tar", ["-xzf", archive, "-C", extract, "package/dist/xlsx.full.min.js", "package/LICENSE"], {
      encoding: "utf8",
      timeout: 30000,
    });
    if (result.error || result.status !== 0) {
      throw new Error("Could not extract verified SheetJS archive: " + (result.stderr || result.error?.message || result.status));
    }

    const bundle = path.join(extract, "package", "dist", "xlsx.full.min.js");
    const license = path.join(extract, "package", "LICENSE");
    const bundleStat = await fs.stat(bundle);
    if (bundleStat.size < 100000 || bundleStat.size > 5 * 1024 * 1024) {
      throw new Error("Unexpected SheetJS browser bundle size: " + bundleStat.size + " bytes.");
    }

    const vendor = path.join(ROOT, "vendor");
    await fs.mkdir(vendor, { recursive: true });
    await fs.copyFile(bundle, path.join(vendor, "xlsx.full.min.js"));
    await fs.copyFile(license, path.join(vendor, "SHEETJS-LICENSE"));
    process.stdout.write("Prepared SheetJS CE " + VERSION + " (SHA-512 verified) in vendor/.\n");
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}

main().catch(error => {
  process.stderr.write("SheetJS preparation failed: " + (error?.message || String(error)) + "\n");
  process.exitCode = 1;
});
