# Third-party notices

ModelForge's original application code is licensed under Apache-2.0; see LICENSE.

The browser build distributes the following third-party libraries. Their licensing terms remain separate from the ModelForge licence. Preserve the package licence and attribution notices when redistributing the bundled assets.

| Package | Version | Purpose | Licence |
|---|---:|---|---|
| xlsx-js-style | 1.2.0 | Generate styled Excel reports only; not used to parse user-uploaded workbooks | Apache-2.0 |
| SheetJS Community Edition | 0.20.3 | Parse user-uploaded CSV / XLSX / XLS workbook data; official CDN tarball is SHA-512 verified | Apache-2.0 |
| JSZip | 3.10.1 | Generate downloadable CSV report packs | MIT or GPL-3.0-or-later; this project uses the MIT option |
| Playwright | 1.65.0 | Development / CI browser tests only; not shipped in the website bundle | Apache-2.0 |

The deployment workflow copies the SheetJS, xlsx-js-style and JSZip licence files into the published vendor directory alongside their browser bundles. The patched SheetJS reader is kept separate from xlsx-js-style: user-uploaded workbooks are read only by SheetJS 0.20.3; xlsx-js-style is retained for styled workbook generation. Transitive dependency notices remain governed by the respective packages' own licence and attribution files.

No third-party dependency is relicensed by the ModelForge Apache-2.0 licence.
