"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const SOURCE = "https://huggingface.co/datasets/kjhq/India-Stock-Symbols-and-Metadata/resolve/main/india.csv";
const DESTINATION = path.resolve(__dirname, "..", "sample-data", "india-listed-company-profiles.csv");

async function main() {
  const response = await fetch(SOURCE, {
    headers: { "User-Agent": "ModelForge-Company-Profile-Index/1.0" },
    redirect: "follow"
  });
  if (!response.ok) {
    throw new Error("Company profile source returned HTTP " + response.status);
  }

  const csv = await response.text();
  const firstLine = csv.split(/\r?\n/, 1)[0].replace(/^\uFEFF/, "").trim().toLowerCase();
  if (firstLine !== "name,ticker,market,sector") {
    throw new Error("Unexpected company profile CSV schema: " + firstLine);
  }

  const rows = csv.split(/\r?\n/).filter(Boolean).length - 1;
  if (rows < 4000) {
    throw new Error("Company profile dataset is incomplete: expected at least 4,000 rows, received " + rows + ".");
  }
  if (csv.length > 5 * 1024 * 1024) {
    throw new Error("Company profile dataset exceeds the 5 MB build limit.");
  }

  await fs.mkdir(path.dirname(DESTINATION), { recursive: true });
  await fs.writeFile(DESTINATION, csv, "utf8");
  process.stdout.write("Bundled " + rows.toLocaleString("en-US") + " Indian listed-company profiles from the CC0 source.\n");
}

main().catch(error => {
  process.stderr.write("Company profile index download failed: " + error.message + "\n");
  process.exitCode = 1;
});
