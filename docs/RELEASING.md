# Release checklist

A release should be reproducible and traceable. Do not publish a release just to increase the version count.

## Before release

1. Review and merge pull requests only after required checks pass.
2. Update the version in `package.json` and the root `package-lock.json` together.
3. Move completed items from [CHANGELOG.md](../CHANGELOG.md) into a dated version section.
4. Run `npm ci` and `npm test` from a clean checkout.
5. Confirm that browser tests pass and that LibreOffice recalculates the exported workbook consistently with the JavaScript engine.
6. Review dependency notices, licences, security alerts and the source / privacy documentation.
7. Confirm that the synthetic demo dataset and investment disclaimers remain clearly labelled.
8. Check the built GitHub Pages artifact contains only the intended static assets and local vendor libraries.

## Publish

1. Create a tag such as `v1.1.0` from the reviewed main-branch commit.
2. Create a GitHub Release from that tag and paste the matching changelog section.
3. Link the source commit and note any known limitations or breaking changes.
4. Verify the GitHub Pages deployment and download / open an exported workbook.

## After release

- Review issues and security reports.
- Record defects and regression fixes in the next unreleased changelog section.
- Do not claim a release is secure or financially correct solely because CI is green.
