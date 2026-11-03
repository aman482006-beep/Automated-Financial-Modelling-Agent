# Optional API backend architecture

The Pages frontend is static. Deploy this backend separately if server persistence, robust spreadsheet parsing, or LLM calls are required.

Recommended modules:
- `app/main.py`: FastAPI app, CORS allow-list and health route.
- `app/schemas.py`: Pydantic upload, mapping, model assumptions and response schemas.
- `app/ingestion.py`: pandas / openpyxl readers; preserve raw rows, source file metadata and original labels.
- `app/validation.py`: balance-sheet, cash bridge, subtotal, period, missing value, currency and unit checks.
- `app/analysis.py`: historical metrics.
- `app/model.py`: deterministic three-statement calculation service.
- `app/valuation.py`: WACC, DCF, terminal value and sensitivity calculations.
- `app/comps.py`: peer multiples and range calculations.
- `app/storage.py`: SQLAlchemy or sqlite3 project / version storage.
- `app/assistant.py`: retrieve approved source data and calculation results; then pass that structured context to a provider adapter.
- `app/export.py`: openpyxl workbook output with formulas, named assumptions, number formats, source and calculation tabs.
- `tests/`: unit and integration tests.

## API outline

- `GET /health`
- `POST /projects`
- `GET /projects/{project_id}`
- `POST /projects/{project_id}/uploads`
- `POST /projects/{project_id}/mappings`
- `POST /projects/{project_id}/validate`
- `POST /projects/{project_id}/assumptions`
- `POST /projects/{project_id}/calculate`
- `POST /projects/{project_id}/assistant`
- `GET /projects/{project_id}/export.xlsx`

## Safety and correctness rules

Keep source values immutable. Store mapping choices and approved values separately. Every calculated result must identify its period, unit and source inputs. LLM output must be commentary only: retrieve the actual approved model context first and never ask a model to calculate or fabricate financial values. API keys stay in environment variables. Enforce upload limits, MIME/type validation, auth, CORS restrictions and rate limits. SQLite is appropriate for a single-user prototype; use managed PostgreSQL for multi-user production.
