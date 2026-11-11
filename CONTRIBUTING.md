# Contributing to ModelForge

Thank you for considering a contribution. ModelForge is a browser-first financial-modelling tool. Changes must preserve financial correctness, transparent assumptions, privacy and reproducible builds.

## Before opening an issue

- Search existing issues and pull requests.
- For a suspected security vulnerability, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
- Include a minimal reproducible example, expected result and actual result for bugs.
- Never include real client workbooks, personal data, credentials or material non-public information. Use synthetic examples.

## Development setup

Requirements: Node.js 26 (see the CI workflow), npm and Python 3 for the local static server.

```bash
git clone https://github.com/aman482006-beep/Automated-Financial-Modelling-Agent.git
cd Automated-Financial-Modelling-Agent
npm ci
npx playwright install chromium
mkdir -p vendor
cp node_modules/xlsx-js-style/dist/xlsx.bundle.js vendor/xlsx.bundle.js
cp node_modules/jszip/dist/jszip.min.js vendor/jszip.min.js
python -m http.server 8000
```

Open http://localhost:8000. The vendor-copy steps are for local browser use; CI assembles the deployable site itself.

## Run checks

```bash
npm test
npm run test:engine
npm run test:browser
npm run test:excel
```

The full suite uses Chromium. The Excel recalculation test uses LibreOffice when available; CI installs it. Run `node --check engine.js`, `node --check workbook.js`, `node --check app-main.js` and `node --check universe.js` after JavaScript changes.

## Financial correctness requirements

- Do not silently replace missing or undisclosed values with zero.
- Preserve sign conventions, units, currency, period and source provenance.
- Never treat total investing cash flow as capital expenditure.
- Do not silently annualise quarterly data.
- Keep core calculations deterministic; any future AI feature must not invent or calculate financial values.
- Add regression tests for every financial calculation or import-mapping change.
- Update [docs/formulas.md](docs/formulas.md) when formulas, assumptions or limitations change.
- Update the privacy/source documentation when data handling changes.

## Pull request checklist

- [ ] Explain the user problem and the proposed change.
- [ ] Keep the change focused and avoid unrelated refactors.
- [ ] Add or update tests, including edge cases and missing-data cases.
- [ ] Run the relevant tests locally.
- [ ] Update documentation and visible caveats.
- [ ] Use synthetic data only; remove secrets and local machine files.
- [ ] Confirm no API keys or credentials are exposed to browser code.
- [ ] Describe any known limitations and migration impact.

By contributing, you agree that your contribution is provided under the repository's Apache-2.0 licence.
