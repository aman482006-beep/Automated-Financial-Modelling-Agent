# ModelForge — Financial Modelling Workspace

ModelForge is a GitHub Pages-compatible browser application for reviewing historical financial statements, creating a linked forecast, valuing a company, analysing comparable companies and exporting a formula-driven Excel report.

## Preview

https://aman482006-beep.github.io/Automated-Financial-Modelling-Agent/

The repository uses GitHub Actions for publishing. In Settings → Pages, the publishing source must be GitHub Actions.

## User workflow

1. Edit the company name, analyst name, industry, valuation date, currency, reporting unit, frequency and shares outstanding.
2. Upload CSV or Excel statements, or select Load sample company to use the synthetic Aster Industries dataset.
3. Review source mapping and validation. Unmapped labels can be assigned to standard fields or ignored.
4. Edit historical values in Historical review. Blue cells in the Excel file are source / assumption inputs.
5. Change forecast drivers and horizon. The three statements recalculate together.
6. Enter DCF and WACC assumptions, choose the terminal method, then review the UFCF build and valuation chart.
7. Enter observed peer data. Sample peers are clearly labelled synthetic.
8. Open Export report to choose the report modules. Every selected module exports as its own worksheet in one Excel workbook. Select all modules for the complete linked model; customised exports are self-contained value snapshots. Save and restore a local JSON project file.

## Included modules

- Company profile: company name, analyst, industry, valuation date, currency, reporting unit, frequency and shares outstanding.
- Data intake: multi-file CSV / XLSX / XLS import; wide, long and transposed layouts; standard field mapping; editable historical line items.
- Screener.in workbook import: the Data Sheet is detected by its statement-section contents (not only its tab name); company, current price, market capitalisation, share count, annual income statement, balance sheet and cash flow are extracted automatically. Quarterly figures are kept out of the annual model to avoid mixing period frequencies.
- Validation: balance sheet, cash flow bridge, subtotals and period sequence checks.
- Historical analysis: growth, margins, ROE, ROA, ROCE, liquidity, leverage, interest coverage, turnover, working capital and FCF.
- Three-statement forecast: adjustable horizon and drivers for revenue, margins, operating costs, D&A, tax, capex, working capital, interest, debt repayment and dividends.
- DCF: CAPM cost of equity, market-value capital weights, WACC, forecast UFCF, perpetual-growth or exit-multiple terminal value, enterprise-to-equity bridge and per-share value.
- Trading comparables: EV/Revenue, EV/EBITDA, EV/EBIT, P/E and P/B with median and average statistics.
- Sensitivity: WACC / perpetual growth, WACC / exit multiple and revenue-growth / EBITDA-margin scenarios.
- Model assistant: deterministic responses tied to active model inputs and calculations.
- Export centre: choose the executive cover, assumptions, historical statements, forecast statements, ratios, DCF, comparables, sensitivity / scenario analysis and checks; export selected modules as separate tabs or one consolidated sheet. The complete all-tabs Excel export preserves formulas, while selected exports are standalone value snapshots. A full CSV report pack is also available.
- Themes: Light, Navy, Midnight, Emerald, Graphite and Warm paper.
- Local project handling: localStorage autosave, JSON project download and restore.

## Excel model layout

The workbook includes (one worksheet per module in a single .xlsx download):
- Cover: company / analyst information and linked valuation summary.
- Inputs: blue-font editable assumptions and DCF parameters; formula-derived cost of equity, capital weights and WACC.
- Historical IS, Historical BS and Historical CF: imported / user-edited source values.
- Forecast IS, Forecast BS and Forecast CF: formula-linked forecast schedules.
- Ratios: formula-linked historical calculations.
- FCF: a dedicated free-cash-flow worksheet with historical FCF, projected cash flow, forecast FCF, NOPAT, D&A add-back, capex, working-capital investment, UFCF and present value.
- DCF: one row per forecast year, UFCF, discount factors, terminal value, PV, EV, net debt, equity value and value per share.
- Comparables: editable peer facts and formula-driven multiples.
- Sensitivity: linked axes and DCF sensitivity formulas.
- Scenario Calc: detailed calculations for operating scenarios.
- Checks: forecast and historical reconciliation checks.

Blue cells are editable source data or assumptions; green formulas link to other worksheets; black formulas calculate within the current worksheet. Negative amounts, percentages and multiples display in red with parentheses. The dedicated FCF worksheet separates reported / forecast FCF from the unlevered DCF cash-flow bridge. Historical reported figures and peer inputs are deliberately editable facts, not formulas. Excel or compatible spreadsheet software recalculates formulas when opened.

## Included sample dataset

Aster Industries is synthetic demonstration data. It is not a real company or actual issuer disclosure. Replace it with verified company data before relying on analysis.

## GitHub Pages limitation and disconnected features

GitHub Pages serves static assets only. The deployed app therefore uses JavaScript for calculations and stores project edits in the browser. It does not run FastAPI, SQLite, Python or server-side jobs. Local project files can be downloaded and restored, but this is not a shared multi-user database.

The assistant is deterministic and local, not a Gemini / OpenAI LLM integration. A secure LLM requires a separately deployed API with credentials held server-side.

No live market-data or financial-statement provider is connected. Company filings, shares, market capitalisation, debt values and comparable-company data must be entered from sources you verify. No peer is silently presented as a real issuer.

The Excel export includes formula-linked schedules, but is not a substitute for analyst review. Forecast debt funding is simplified: scheduled repayments are modelled and negative cash is flagged as a funding need; a revolver draw / paydown waterfall is not implemented.

Currency and reporting unit are metadata. No automatic FX or scale conversion is performed. Quarterly labels can be imported, but seasonality and annualisation are not inferred.

## Local development

A static server is sufficient:

~~~bash
python -m http.server 8000
~~~

Open http://localhost:8000.

For automated tests:

~~~bash
npm install
npm test
~~~

Tests verify historical reconciliation, cash flow bridges, ratios, three-statement linkages, working-capital and balance-sheet roll-forward, WACC, DCF, comparables, sensitivities, CSV mapping and actual XLSX generation with formula cells.

## Source layout

- index.html — browser UI and script loading
- styles.css — responsive interface and theme palette
- engine.js — deterministic financial calculation engine
- app-main.js — navigation, state, imports, editing and exports
- workbook.js — formula-linked Excel workbook generator
- sample-data/aster_industries.csv — synthetic statement input
- docs/formulas.md — formula reference
- backend/README.md — separately deployed API architecture notes
- tests/engine.test.cjs — financial calculation tests
- tests/workbook.test.cjs — XLSX export and formula integrity test
- .github/workflows/pages.yml — test gate and Pages deployment
