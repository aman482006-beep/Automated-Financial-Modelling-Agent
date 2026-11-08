# Formula reference and modelling controls

All amounts use the selected reporting unit. Percentage drivers are decimals internally. Blank or unavailable inputs remain unavailable; they are not assumed to be zero unless the user explicitly enters zero.

## Historical calculations

- Revenue growth = current-period revenue / prior-period revenue − 1.
- Gross margin = gross profit / revenue.
- EBITDA margin = EBITDA / revenue.
- EBIT margin = EBIT / revenue.
- Net margin = net income / revenue.
- ROE = net income / average shareholders' equity (first available period uses closing equity).
- ROA = net income / average total assets (first available period uses closing assets).
- Current ratio = current assets / current liabilities, only when all required current-asset and current-liability components are present.
- Quick ratio = (cash + accounts receivable) / current liabilities, only when all three inputs are present.
- Debt/equity = (short-term debt + long-term debt) / equity, only when both debt buckets and equity are present.
- Interest coverage = EBIT / absolute interest expense.
- Asset turnover = revenue / total assets.
- Working capital = current assets − current liabilities, only when both totals are complete.
- Reported FCF = imported cash-flow statement field.
- Derived historical FCF = cash flow from operations + capital expenditure, where capex is stored as a negative outflow. If capex is missing, FCF remains blank. Total investing cash flow is not used as a capex proxy.

## Screener.in import rules

- Separate short- and long-term borrowing lines are mapped to their respective debt fields.
- A combined Borrowings line is mapped into the total-debt bridge but its maturity classification is uncertain; review before forecasting.
- Accounts payable and short-term debt are not entered as zero when the Data Sheet does not disclose them.
- Investments are not included in operating working capital.
- Other current assets are derived from the Other Assets subtotal only when the subtotal, receivables, inventory and cash are all present.
- The summary Data Sheet does not provide a standalone capex line. Historical FCF is not inferred from CFO plus total investing cash flow.

## Forecast readiness

The current forecast engine requires annual historical periods and complete latest-period opening inputs for revenue, cash, receivables, inventory, other current assets, PP&E, accounts payable, short-term debt, long-term debt / total borrowings, other operating liabilities and shareholders' equity. If a value is genuinely zero, enter zero explicitly. If a value is unknown, do not guess; complete or map it before forecasting.

Quarterly periods are sorted chronologically for review, but they are not accepted as annual forecast starting points. The app does not annualise quarterly data or infer seasonality.

## Forecast drivers

Revenue grows at the user-entered rate. Gross profit is revenue × gross margin. COGS is gross profit − revenue (negative expense convention). Employee costs and other operating expenses are negative revenue-based drivers. EBITDA equals gross profit plus these operating expenses. D&A is a negative P&L expense based on opening PP&E. EBIT = EBITDA + D&A. Interest expense uses opening short- plus long-term debt multiplied by the interest rate. Tax is applied to positive PBT only.

Receivables = revenue × receivable days / 365. Inventory = absolute COGS × inventory days / 365. Payables = absolute COGS × payable days / 365. Other current assets and other liabilities use revenue percentages. PP&E = opening PP&E + capex − depreciation add-back (D&A is negative on the income statement). Long-term debt falls by scheduled repayment. Retained equity = opening equity + net income − dividends.

Cash flow from operations = net income + D&A add-back − increase in net operating working capital. Investing cash flow = −capex. Financing cash flow = debt repayment − dividends. Cash rolls forward from opening cash plus all three cash flow sections.

**Simplification:** closing cash is the residual/balancing line in the forecast balance sheet. The check is exposed in the table. A production financing model should instead include a cash minimum, revolver draw/paydown logic, debt issuance fees and an explicit funding waterfall. Do not interpret negative cash as an executable funding plan.

## DCF and WACC

- Cost of equity = risk-free rate + beta × equity risk premium (CAPM).
- WACC = equity weight × cost of equity + debt weight × pre-tax cost of debt × (1 − tax rate). Capital weights use entered market values and sum to 100%.
- UFCF = EBIT × (1 − tax rate) + D&A add-back − capex − change in net working capital. Capex is an outflow stored as a positive forecast driver in the forecast model and subtracted in UFCF.
- PV of forecast UFCF = sum of UFCF_t / (1 + WACC)^t.
- Perpetuity-growth terminal value = final forecast UFCF × (1 + g) / (WACC − g), requiring WACC > g.
- Exit-multiple terminal value = final forecast EBITDA × selected exit EV/EBITDA multiple.
- Enterprise value = PV forecast UFCF + PV terminal value.
- Equity value = enterprise value − latest reported net debt.
- Value per share = equity value / entered shares outstanding.

DCF validation checks finite and bounded rates, non-negative beta, market values, positive shares outstanding, supported terminal method, terminal multiple and WACC > perpetual growth. The app does not display an EV result when required model inputs or assumptions fail validation.

## Comparable companies

- EV/Revenue = enterprise value / revenue.
- EV/EBITDA = enterprise value / EBITDA.
- EV/EBIT = enterprise value / EBIT.
- P/E = market capitalisation / net income.
- P/B = market capitalisation / book equity.
- Median and arithmetic average exclude invalid, non-positive or missing denominators.

## Sensitivity

Each cell reruns the deterministic DCF with the column and row assumptions applied. Operating sensitivity rebuilds forecast drivers using revenue growth and gross margin scenarios. Sensitivity results are not forecasts or probabilities.

## Excel workbook

The complete report exports formula-linked sheets. Selected module exports are converted to self-contained value snapshots. CI checks formula references and uses LibreOffice Calc to recalculate the complete workbook and reconcile its enterprise value to the JavaScript engine. Excel-compatible software should recalculate formulas when the workbook is opened; always review the exported file in your spreadsheet application.
