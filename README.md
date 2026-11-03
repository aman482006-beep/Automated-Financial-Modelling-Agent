# ModelForge — Automated Financial Modelling Agent

A browser-based financial analyst workstation for historical statement review, integrated forecasts, DCF valuation, trading comparables, sensitivities and workbook export.

## GitHub Pages preview

https://aman482006-beep.github.io/Automated-Financial-Modelling-Agent/

In GitHub, open **Settings → Pages** and set the publishing source to **GitHub Actions**. The included workflow deploys the static app from `main`. The live URL becomes available after the deployment workflow succeeds.

## Run locally

No build step is required. Open `index.html` in a modern browser or run `python -m http.server 8000` and visit `http://localhost:8000`.

## Pages build features

- Import historical CSV statements and inspect a source data table and mapping review.
- Historical trend and ratio analysis.
- Driver-based integrated forecast for income statement, balance sheet and cash flow.
- Editable operating, tax, working-capital and financing assumptions.
- CAPM-based cost of equity, WACC and DCF with perpetuity-growth or exit-multiple terminal value.
- Trading comparables: EV/Revenue, EV/EBITDA, EV/EBIT, P/E and P/B.
- WACC/growth, WACC/exit multiple and growth/margin sensitivity grids.
- Grounded local analyst assistant reading the actual active model outputs.
- XLSX export with historical statements, ratios, assumptions, forecast statements, DCF and comps.

## Important deployment limitation

GitHub Pages hosts static files only. It **cannot execute FastAPI, Python, SQLite, or server-side jobs**. This deployment therefore runs calculations in browser JavaScript and stores edits only for the current browser session. The assistant is deterministic/local; it does not call Gemini or another LLM. See `backend/README.md` for a separate backend architecture.

Never place an LLM API key in browser code. Deploy a secured FastAPI service separately, store keys in environment variables, restrict CORS, and call it from the frontend over HTTPS.

## Modelling caveats

- Demo company financials and peer names are synthetic, not market data or actual issuer disclosures.
- This compact CSV workflow is wide-format: one `period` / `year` column, and common item names such as Revenue, Sales, Cost of goods sold, cash, accounts receivable and PP&E. The review mapping table is currently a reference mapping view rather than a full editable arbitrary schema mapper.
- Currency and unit settings are labels; no FX or scale conversion is performed.
- Quarter labels are preserved, but quarterly seasonality / annualisation is not automatically inferred.
- Forecast cash is the balancing item in this simplified model. A cash shortfall is flagged; no revolver or automatic debt funding waterfall is implemented.
- Workbook export currently exports calculated values, not a full formula-linked Excel model. The Python backend notes describe a path for a richer production export.
- Review imported figures, definitions, mappings and model assumptions before using any output. Not investment advice.

## Tests

Open the deployed app, then run `ModelForge.selfTest()` in the browser developer console. A test runner is also in `tests/model-tests.js`. The GitHub Pages workflow runs `node --check app.js` before publishing.

## Files

- `index.html` — UI
- `styles.css` — responsive design
- `app.js` — deterministic calculation engine and interaction layer
- `sample-data/aster_industries.csv` — synthetic sample data
- `docs/formulas.md` — formula definitions and caveats
- `backend/README.md` — optional backend architecture
- `tests/model-tests.js` — browser-side calculation test runner
