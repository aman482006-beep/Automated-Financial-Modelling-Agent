# Optional backend architecture note — not implemented

The GitHub Pages application is static and runs in the user's browser. This repository does **not** currently include a working FastAPI backend, database, authentication layer or server-side LLM integration.

The current browser application:
- requires no API key;
- parses CSV and Excel files in the browser;
- calculates forecasts, ratios, WACC, DCF and sensitivities locally;
- stores project state in the current browser's localStorage;
- exports Excel and CSV reports in the browser.

The following is a possible future architecture only. It is not an implemented API contract and should not be presented as a deployed feature.

## Potential modules

- app/main.py: FastAPI app, health route and strict CORS allow-list.
- app/schemas.py: Pydantic upload, mapping, model-assumption and response schemas.
- app/ingestion.py: spreadsheet readers; preserve raw rows, source-file metadata and original labels.
- app/validation.py: balance-sheet, cash-bridge, subtotal, period, missing-value, currency and unit checks.
- app/analysis.py: historical metrics.
- app/model.py: deterministic three-statement calculation service.
- app/valuation.py: WACC, DCF, terminal value and sensitivity calculations.
- app/comps.py: peer multiples and range calculations.
- app/storage.py: project and version storage.
- app/assistant.py: retrieve approved source data and calculation results before any commentary-only provider call.
- app/export.py: formula-driven workbook output with source and calculation tabs.

## Security and correctness requirements for any future backend

Keep source values immutable. Store mapping choices and approved values separately. Every calculated result must identify its period, unit and source inputs. LLM output must be commentary only: retrieve the actual approved model context first and never ask a model to calculate or fabricate financial values.

API keys must remain server-side in environment variables. Enforce upload limits, MIME/type validation, authentication, CORS restrictions, rate limits and safe logging. Do not expose API keys in browser JavaScript. A database must not be added until access control, data retention, backups and deletion workflows are designed.

The root requirements.txt and .env.example are reserved for that optional future backend. They are not needed to run or test the GitHub Pages application.
