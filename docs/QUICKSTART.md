# ModelForge quick start

This guide takes you from the demo screen to a reviewed financial model. The steps use the live static application; no account or API key is required.

## 1. Open the workspace

Open the [ModelForge live preview](https://aman482006-beep.github.io/Automated-Financial-Modelling-Agent/).

The initial Aster Industries company is fictional demo data. Use it to explore the interface, not as a real company or investment case.

## 2. Start with a company or your own statements

- Choose **Choose from existing** to select an NSE Nifty 100 / Nifty 200 issuer. This loads issuer identity only; it does not preload financial statements, prices, market capitalisation or shares outstanding.
- Choose **Load** to import your own CSV or Excel workbook.
- Use **Enter your data** for manual entry or to fix individual mapped values.

For every real issuer, confirm the company name, NSE symbol, reporting entity (standalone or consolidated), reporting period, currency and reporting unit against the original filing.

## 3. Import and map historical statements

Supported imports are CSV, XLSX and XLS. A batch can contain at most 10 files, 20 MB per file and 40 MB total. Excel imports inspect at most 30 worksheets and 10,000 rows per worksheet.

The importer recognises common annual statement layouts and Screener.in Data Sheet exports. Review the mapping table: automatically mapped labels are suggestions, not independent verification. Leave unknown values blank until you can verify them.

Important conventions:

- Enter expenses and cash outflows as negative values.
- Enter assets, liabilities and debt as positive balances.
- Missing or undisclosed items stay blank. Enter zero only when the source explicitly reports zero.
- Do not mix currencies, reporting units or standalone / consolidated statements.
- Do not treat total investing cash flow as capital expenditure.

## 4. Review data quality before forecasting

Open **Overview** and the **History** page. Resolve missing core inputs, statement subtotal differences, balance-sheet differences and period-order warnings.

Forecasting currently requires annual historical periods and a complete latest-period opening balance sheet. Quarterly data is not silently annualised.

## 5. Build and review the valuation

Open **Forecast** to inspect the linked income statement, balance sheet and cash flow forecast. Adjust assumptions only when you can explain the basis.

Open **DCF** and provide defensible market-value capital weights, beta, risk-free rate, equity risk premium, cost of debt, shares outstanding and terminal assumptions. Check the valuation warnings and sensitivity tables. ModelForge does not fetch current prices or market data.

The app's readiness checks are guardrails, not an assurance that every source figure or assumption is correct. Review the underlying filing and formulas yourself.

## 6. Export and keep a backup

Use **Export Excel** to choose report sections and create a formula-linked workbook. Open the result in Excel or LibreOffice and review the formulas, units and source references. Use the JSON project backup to preserve editable inputs.

The app stores work in this browser profile's localStorage. It is not encrypted. Do not use confidential client data or material non-public information; clear local site data on shared devices.

## Need help?

Read the [formula reference](formulas.md), [data and privacy guide](data-sources-and-privacy.md), [support guide](../SUPPORT.md) or [contribution guide](../CONTRIBUTING.md).
