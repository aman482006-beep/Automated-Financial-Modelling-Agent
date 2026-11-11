# ModelForge roadmap

This roadmap describes intended priorities, not promised delivery dates. Work is prioritised by financial correctness, user trust, reproducibility and maintainability—not by adding features for their own sake.

## P0 — Correctness and safe data handling

- Keep missing values distinct from reported zeroes across imports, calculations and exports.
- Expand regression coverage for edge cases in statement mapping, signs, units, reporting periods, DCF and workbook formulas.
- Test supported CSV / Excel layouts with synthetic fixtures and clear import diagnostics.
- Keep file handling bounded and process user-supplied files locally.
- Keep every calculation definition, assumption and known limitation documented.

## P1 — Auditability and analyst workflow

- Improve source-to-model mapping visibility and reviewer-friendly exception reports.
- Make manual adjustments explicit and traceable rather than silently overwriting imported source values.
- Add a clear audit trail for assumption changes, with local export and privacy controls.
- Improve model review outputs for missing inputs, balance-sheet differences and source conflicts.
- Improve workbook usability while preserving formula links and independent recalculation tests.

## P2 — External contributors and adoption

- Turn recurring user feedback into small, well-scoped issues.
- Add synthetic fixtures contributed by users for common statement formats.
- Improve the first-run guide and publish a repeatable demonstration workflow.
- Welcome external pull requests with reproducible tests, code review and documented release notes.
- Track actual usage and feedback using privacy-respecting, verifiable evidence; do not publish invented download or adoption claims.

## P3 — Optional integrations

- Evaluate source-grounded commentary that explains existing model outputs without inventing financial values.
- Consider filing and market-data connectors only after source licensing, provenance, freshness and failure behaviour are clear.
- Consider any backend only after authentication, access control, data retention, deletion, backups and security review are designed.

## Explicit non-goals

- No fabricated financial statements, share prices, peer data or market-cap rankings.
- No silent conversion of unknown values to zero.
- No automatic trade execution or broker order placement.
- No LLM-generated financial calculations treated as authoritative.
- No claim that a security scan or passing test suite guarantees a model is correct.

## How priorities change

User-reported issues, regression evidence, contributor proposals and licensing / security constraints can change the ordering. Open an issue with a concrete workflow problem and a synthetic reproduction.
