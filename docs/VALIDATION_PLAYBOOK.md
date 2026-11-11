# ModelForge validation playbook

This guide gives reviewers a repeatable way to sanity-check the fictional Aster Industries demo. It is a test fixture, not a real issuer, market observation or investment case.

All amounts below are in **INR millions**, except percentages, ratios and the illustrative per-share result. The figures are deliberately synthetic.

## 1. Historical FY2025 checks

The default in-app Aster demo contains these FY2025 values:

| Input | Value |
|---|---:|
| Revenue | 1,996 |
| Cost of goods sold | (1,038) |
| Gross profit | 958 |
| Employee expenses | (275) |
| Other operating expenses | (235) |
| EBITDA | 448 |
| Net income | 239 |
| Cash | 185 |
| Accounts receivable | 246 |
| Inventory | 181 |
| Other current assets | 60 |
| Accounts payable | 158 |
| Short-term debt | 65 |
| Other operating liabilities | 104 |
| Cash flow from operations | 294 |
| Capital expenditure | (132) |
| Free cash flow | 162 |

Recalculate a few measures by hand:

- **Gross profit:** 1,996 − 1,038 = 958.
- **Gross margin:** 958 ÷ 1,996 = 48.00%.
- **EBITDA:** 958 − 275 − 235 = 448.
- **EBITDA margin:** 448 ÷ 1,996 = 22.44%.
- **Revenue growth:** 1,996 ÷ 1,782 − 1 = 12.01%.
- **Revenue CAGR (FY2021–FY2025):** (1,996 ÷ 1,200)^(1/4) − 1 = 13.57%.
- **Free cash flow:** CFO + capex outflow = 294 − 132 = 162.
- **Current ratio:** (cash + receivables + inventory + other current assets) ÷ (payables + short-term debt + other operating liabilities) = 672 ÷ 327 = 2.06x.
- **Quick ratio:** (cash + receivables) ÷ current liabilities = 431 ÷ 327 = 1.32x.

Small display differences can arise from rounding. If a displayed result differs materially, record the exact screen, input values and steps using synthetic data.

## 2. Default forecast and DCF reference

With the untouched default Aster demo, the five-year forecast horizon and default assumptions, the deterministic engine should produce approximately:

| Output | Reference value |
|---|---:|
| Cost of equity (CAPM) | 13.30% |
| WACC | 11.361% |
| FY2030 forecast revenue | 3,214.58 |
| FY2030 forecast EBITDA | 720.07 |
| FY2030 unlevered free cash flow | 303.90 |
| Present value of forecast cash flows | 902.56 |
| Present value of terminal value | 2,507.08 |
| Enterprise value | 3,409.64 |
| Latest reported net debt | 60.00 |
| Equity value | 3,349.64 |
| Illustrative value per share | 33.50 |

These reference results depend on the default demo assumptions in `engine.js` and the sample's assumed 100 million shares. They are not a fair-value opinion, share-price target or investment recommendation. Do not compare them with a current market quote.

## 3. Reconciliation checklist

Before relying on any imported company model, independently confirm:

1. Issuer name, ticker, reporting entity (standalone / consolidated), reporting period, currency and unit match the source filing.
2. Revenue, expense signs and statement subtotals match the reported statements.
3. Total assets equal total liabilities and equity for each period.
4. The movement in cash reconciles to CFO + CFI + CFF where all sections are disclosed.
5. Missing or undisclosed values remain blank. Enter zero only when the source explicitly reports zero.
6. Historical FCF is reported or calculated only when CFO and a separate capex amount are known. Total investing cash flow is not a capex proxy.
7. Debt maturity classification is supported by the source; a combined borrowing line must not be silently split into current and non-current debt.
8. Forecast assumptions have a documented rationale and the DCF WACC / terminal-growth relationship is valid.
9. The exported workbook opens in Excel or LibreOffice, formulas recalculate, and the Checks sheet has been reviewed.

## 4. Reproduce the automated checks

From a clean checkout:

```bash
npm ci
npm run prepare:sheetjs
npx playwright install chromium
npm test
```

For the independent workbook recalculation integration test, install LibreOffice Calc. CI installs Chromium and LibreOffice and runs the complete test suite.

The test suite checks the JavaScript calculation engine, importer edge cases, workbook formula links, browser workflows, hostile backup values and a LibreOffice recalculation of exported DCF enterprise value.

Passing tests do not prove that a source filing is authentic, that an analyst's assumptions are reasonable, or that every company-specific accounting treatment is represented. The analyst remains responsible for source verification and review.
