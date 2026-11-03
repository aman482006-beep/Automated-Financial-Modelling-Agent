# Formula reference

All amounts use the selected reporting unit; percentage drivers are decimals internally.

## Historical calculations

- Revenue growth = current-period revenue / prior-period revenue − 1.
- Gross margin = gross profit / revenue.
- EBITDA margin = EBITDA / revenue.
- EBIT margin = EBIT / revenue.
- Net margin = net income / revenue.
- ROE = net income / average shareholders' equity (first available period uses closing equity).
- ROA = net income / total assets (first available period uses closing assets).
- Current ratio = current assets / current liabilities.
- Quick ratio = (cash + accounts receivable) / current liabilities.
- Debt/equity = (short-term debt + long-term debt) / equity.
- Interest coverage = EBIT / absolute interest expense.
- Asset turnover = revenue / total assets.
- Working capital = current assets − current liabilities.
- Reported FCF = imported cash flow statement field.

## Forecast drivers

Revenue grows at the user-entered rate. Gross profit is revenue × gross margin. COGS is gross profit − revenue (negative expense convention). Employee costs and other operating expenses are negative revenue-based drivers. EBITDA equals gross profit plus these operating expenses. D&A is a negative P&L expense based on opening PP&E. EBIT = EBITDA + D&A. Interest expense uses opening short- plus long-term debt multiplied by the interest rate. Tax is applied to positive PBT only.

Receivables = revenue × receivable days / 365. Inventory = absolute COGS × inventory days / 365. Payables = absolute COGS × payable days / 365. Other current assets and other liabilities use revenue percentages. PP&E = opening PP&E + capex − depreciation add-back (D&A is negative on the income statement). Long-term debt falls by scheduled repayment. Retained equity = opening equity + net income − dividends.

Cash flow from operations = net income + D&A add-back − increase in net operating working capital. Investing cash flow = −capex. Financing cash flow = debt repayment − dividends. Cash rolls forward from opening cash plus all three cash flow sections.

**Simplification:** in the present demo implementation, closing cash is also the residual/balancing line in the forecast balance sheet. The check is exposed in the table. A production financing model should instead include a cash minimum, revolver draw/paydown logic, debt issuance fees and explicit funding waterfall. Do not interpret negative cash as an executable funding plan.

## DCF and WACC

- Cost of equity = risk-free rate + beta × equity risk premium (CAPM).
- WACC = equity weight × cost of equity + debt weight × pre-tax cost of debt × (1 − tax rate). Weights are normalised to sum to 100% in the current calculator.
- UFCF = EBIT × (1 − tax rate) + D&A add-back − capex − change in net working capital.
- PV of forecast UFCF = sum of UFCF_t / (1 + WACC)^t.
- Perpetuity-growth terminal value = final forecast UFCF × (1 + g) / (WACC − g), requiring WACC > g.
- Exit-multiple terminal value = final forecast EBITDA × selected exit EV/EBITDA multiple.
- Enterprise value = PV forecast UFCF + PV terminal value.
- Equity value = enterprise value − latest reported net debt.
- Value per share = equity value / entered shares outstanding.

## Comparable companies

- EV/Revenue = enterprise value / revenue.
- EV/EBITDA = enterprise value / EBITDA.
- EV/EBIT = enterprise value / EBIT.
- P/E = market capitalisation / net income.
- P/B = market capitalisation / book equity.
- Median and arithmetic average exclude invalid, non-positive or missing denominators.

## Sensitivity

Each cell reruns the deterministic DCF with the column and row assumptions applied. Operating sensitivity rebuilds forecast drivers using revenue growth and gross margin scenarios. Sensitivity results are not forecasts or probabilities.
