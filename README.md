# ModelForge — Browser-based Financial Modelling Workspace

[![CI and GitHub Pages](https://github.com/aman482006-beep/Automated-Financial-Modelling-Agent/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/aman482006-beep/Automated-Financial-Modelling-Agent/actions/workflows/pages.yml) [![Security analysis](https://github.com/aman482006-beep/Automated-Financial-Modelling-Agent/actions/workflows/security.yml/badge.svg?branch=main)](https://github.com/aman482006-beep/Automated-Financial-Modelling-Agent/actions/workflows/security.yml) [![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

**[Try the live ModelForge workspace](https://aman482006-beep.github.io/Automated-Financial-Modelling-Agent/)** · [Contributing](CONTRIBUTING.md) · [Support](SUPPORT.md) · [Security](SECURITY.md) · [Roadmap](docs/ROADMAP.md) · [Changelog](CHANGELOG.md) · [Quick start](docs/QUICKSTART.md)

ModelForge is a static, browser-based financial modelling application for importing historical statements, reviewing data quality, building an integrated forecast, calculating DCF and trading-comparable valuations, exploring sensitivities, and exporting a formula-linked Excel workbook.

**The GitHub Pages application requires no API key, account or backend.** Core calculations run in the browser. The optional backend described in backend/README.md is only a proposed architecture; it is not deployed or required by the static application.

## Live preview

https://aman482006-beep.github.io/Automated-Financial-Modelling-Agent/

## What it actually does

- **Financial data intake:** CSV and Excel import, multiple worksheets, wide/long layouts, manual entry, editable field mapping and source metadata. User-uploaded workbooks are parsed with the patched SheetJS CE 0.20.3 reader; the legacy style-enabled library is isolated to report generation.
- **Indian company picker:** bundled NSE Nifty 100 / Nifty 200 issuer directory (200 unique securities, 100 Nifty 100 members; snapshot checked 6 Nov 2026), with searchable names, NSE symbols and sectors. Selecting a company creates a clean, empty model; it never copies the synthetic Aster figures.
- **Screener.in workbook import:** detects a Data Sheet and maps supported annual financial items. Missing classifications remain missing; the importer does not invent zero values for undisclosed accounts payable or short-term debt.
- **Historical review:** growth, margins, return ratios, liquidity, leverage, working capital and reported free cash flow where the required source fields exist.
- **Data validation:** statement completeness, balance-sheet reconciliation, cash-flow bridges, statement subtotals and reporting-period order.
- **Integrated forecast:** a linked income statement, balance sheet and cash flow forecast with editable operating, working-capital and financing assumptions.
- **DCF:** CAPM cost of equity, WACC, unlevered free cash flow, perpetuity-growth or exit-multiple terminal value, enterprise-to-equity bridge and implied value per share.
- **Trading comparables:** EV/Revenue, EV/EBITDA, EV/EBIT, P/E and P/B calculations with median and average statistics.
- **Sensitivity analysis:** WACC / terminal growth, WACC / exit multiple and operating growth / margin scenarios.
- **Investor frameworks:** portrait-led analytical checklists for Benjamin Graham, Warren Buffett, Charlie Munger and Peter Lynch. These are question prompts, not quotations or endorsements.
- **Excel report:** one workbook with separate report tabs and formula-linked schedules; selected exports are self-contained value snapshots.
- **Local project handling:** browser localStorage autosave, JSON project backup and restore.

The assistant tab is a **deterministic, rule-based model explainer**. It answers from the active model values and formulas. It is not an LLM integration and does not require an API key.

## Quick start — no API keys

Requirements: Node.js 24 or newer, npm, and Python 3 for the simple local web server.

~~~bash
git clone https://github.com/aman482006-beep/Automated-Financial-Modelling-Agent.git
cd Automated-Financial-Modelling-Agent

npm ci
npm run prepare:sheetjs
mkdir -p vendor
cp node_modules/xlsx-js-style/dist/xlsx.bundle.js vendor/xlsx.bundle.js
cp node_modules/jszip/dist/jszip.min.js vendor/jszip.min.js

python -m http.server 8000
~~~

Open http://localhost:8000.

The static front end uses a SHA-512-verified SheetJS 0.20.3 reader from the official SheetJS CDN, alongside xlsx-js-style and JSZip for styled report generation and ZIP export. Uploads are bounded to 10 files, 20 MB per file and 40 MB per batch; spreadsheet imports inspect at most 30 worksheets and 10,000 rows per worksheet, and project backups are limited to 10 MB / 100 reporting periods. No Gemini, OpenAI, broker or market-data credential is needed. No live financial data provider is connected: you supply the financial statements and peer data. The bundled NSE directory is issuer metadata only; it does not contain statements, current prices or market-cap values.

## Test and verify

Install the Chromium browser used by the end-to-end tests:

~~~bash
npm run prepare:sheetjs
npx playwright install chromium
npm test
~~~

The test suite includes:
- financial-engine unit and regression tests;
- XLSX generation, worksheet and formula-link checks;
- Chromium end-to-end tests for initial load, forecast, DCF, blank-project gating, privacy/source disclosures and mobile navigation;
- a LibreOffice recalculation test that independently recalculates the exported workbook and compares the DCF enterprise value with the JavaScript engine.

The LibreOffice test is skipped on developer machines where LibreOffice is not installed. GitHub Actions installs LibreOffice Calc and Chromium so the full test suite runs in CI.

Individual test groups:

~~~bash
npm run test:engine
npm run test:browser
npm run test:excel
~~~

## Financial calculation safeguards

ModelForge deliberately prefers **missing data over invented zeroes**.

- The Screener importer maps short- and long-term borrowings separately only when the source has separate lines. A combined Borrowings line is retained as total debt in the net-debt bridge but its maturity classification must be reviewed.
- Accounts payable and short-term debt stay blank if the source does not disclose them. Enter the reported value, including an explicit zero when zero is correct, before calculating liquidity ratios or running a forecast.
- Investments are excluded from operating working capital. Other current assets are derived only where the source provides enough fields to support the derivation.
- Total investing cash flow is not treated as capital expenditure. Historical FCF is reported only when explicitly supplied or derived from CFO and a separate capex field.
- Forecasting is gated to complete annual opening balance-sheet inputs. Quarterly periods are rejected rather than silently annualised.
- Invalid WACC, terminal growth, terminal multiple, tax rate or share-count inputs prevent a DCF result. Review the readiness and validation messages before exporting.

See [docs/formulas.md](docs/formulas.md) for calculation definitions and assumptions.

## Demo data

Aster Industries is synthetic demonstration data. It is fictional and does not represent a real company, issuer filing, market price or investment recommendation. Sample peer companies are also synthetic. Replace every sample input with verified source data before relying on an analysis.

## Privacy and storage

The GitHub Pages application is static. Uploaded files are parsed in your browser; there is no ModelForge server receiving the file. Project edits are autosaved in localStorage for the current browser profile. localStorage is **not encrypted** and may be accessible to other people using the same browser profile or device. Download a JSON backup, clear local site data on shared devices, and do not enter confidential client files, personal identifiers or material non-public information.

The app does not fetch filings or market data. Keep the original filing, source URL, page / note reference, reporting period, currency and unit with your research records. The source-trace panel records imported file names, import time, mapped labels and importer caveats; it is not independent source verification.

Currency and reporting unit are metadata. ModelForge does not perform automatic FX conversion or scale conversion.

## Important modelling limitations

- The forecast is a deterministic driver-based template, not a full investment-banking model with all issuer-specific schedules.
- Forecast cash and balance-sheet checks are visible. Negative cash indicates a funding need; no revolving-credit draw/paydown waterfall is implemented.
- The model does not build a covariance, beta, liquidity, options, path-dependent or scenario-specific risk model.
- The DCF and sensitivity outputs are only as good as the historical inputs and assumptions. They are not investment advice or a fair-value opinion.
- The static application does not include user accounts, shared cloud projects, server-side persistence, broker execution or background jobs.

## Optional backend (not required)

backend/README.md describes a possible future FastAPI service for server-side persistence and a secure LLM adapter. That service is not implemented or deployed. The files requirements.txt and .env.example are reserved for that optional architecture only. Never expose an API key in browser JavaScript or commit a real .env file.

The Pages version works without any of those backend dependencies or credentials.

## Repository layout

- index.html — browser UI, including the Investor frameworks page
- assets/investors/ — transparent investor portrait cutouts used on the Investor frameworks page
- styles.css — responsive UI and local system-font styling
- engine.js — financial calculations, ingestion, readiness and validation rules
- app-main.js — browser state, imports, editing, source trace and exports
- universe.js — dated NSE Nifty 100 / Nifty 200 issuer directory (metadata only)
- workbook.js — formula-linked Excel workbook generator
- sample-data/aster_industries.csv — synthetic sample data
- docs/formulas.md — calculation reference and caveats
- docs/data-sources-and-privacy.md — source and privacy workflow
- tests/engine.test.cjs — financial-engine tests
- tests/workbook.test.cjs — workbook structure and formula tests
- tests/browser.test.cjs — Playwright end-to-end tests
- tests/universe.test.cjs — NSE universe count, uniqueness and data-scope checks
- tests/excel-recalc.test.cjs — LibreOffice formula recalculation test
- .github/workflows/pages.yml — CI checks and GitHub Pages deployment

## Contributing and security

Contributions should preserve financial correctness, transparent assumptions and privacy. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Please report vulnerabilities privately using the process in [SECURITY.md](SECURITY.md), not in a public issue.

Dependabot checks npm and GitHub Actions dependencies weekly. GitHub Actions runs CodeQL analysis on pushes, pull requests and a weekly schedule. These checks reduce risk but do not guarantee that the application is vulnerability-free.

## Licence

Original ModelForge code is licensed under Apache-2.0; see [LICENSE](LICENSE). Third-party libraries retain their own licences; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
