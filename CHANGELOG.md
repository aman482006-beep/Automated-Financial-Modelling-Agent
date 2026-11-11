# Changelog

All notable project changes are recorded here. This project uses a simple Keep a Changelog structure; versions are tagged when a release is published.

## [Unreleased]

### Added
- Contributor, support and security reporting guidance.
- Structured issue templates, pull-request checklist and CODEOWNERS routing.
- Weekly Dependabot checks for npm and GitHub Actions dependencies.
- CodeQL static analysis workflow.
- SHA-512-verified SheetJS Community Edition 0.20.3 reader for uploaded workbooks, kept separate from the legacy styled export library.
- Browser regression coverage for secure workbook-reader isolation and hostile project-backup contents.
- CSV parser regression coverage for quoted commas, escaped quotes, UTF-8 BOMs and embedded line breaks.

### Changed
- Pull-request CI now runs directly against the proposed commit, including internal pull requests.
- Browser imports are bounded by file-count, file-size, worksheet-count, worksheet-row and record-count limits.
- Project backup loading validates file type, size, structure, profile fields, history values, assumptions, DCF inputs, peer data, mappings and source metadata before replacing the active project.

### Fixed
- CSV rows containing quoted line breaks are no longer split into separate records.
- CSV parsing now rejects unclosed quoted fields and configurable row, column and field-size limit violations.
- Project backups can no longer inject non-numeric text into history, peer, forecast-assumption or DCF input attributes.
