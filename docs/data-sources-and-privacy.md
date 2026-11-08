# Data sources, provenance and privacy

## What ModelForge receives

ModelForge is a static GitHub Pages application. CSV and Excel files are read and parsed in the user's browser. The published application does not send those files to a ModelForge backend. No live filing provider, market-data provider, broker or LLM API is connected.

The optional backend described in backend/README.md is a design note, not a running service. The browser app does not need an API key.

## Browser storage

Project changes are autosaved to localStorage in the current browser profile. localStorage is not encrypted. Other people who can use the same browser profile may be able to access the stored project. On shared devices, download a backup if needed, clear site data after use, and do not enter confidential client data, personal identifiers or material non-public information.

## Source traceability

For every imported company, retain the original filing or workbook outside ModelForge. Record:
- issuer and reporting entity;
- reporting period and whether it is annual or quarterly;
- currency and reporting unit / scale;
- original source URL, filing page and note / line item;
- import filename and date;
- any manual mapping or adjustment and who made it.

The source-trace panel records imported filenames, import time, mapped-label coverage and importer caveats. It is an audit aid only. It does not authenticate the document or verify numbers against a regulator filing.

## Synthetic examples

Aster Industries and the sample peer companies are fictional demonstration data. Do not cite them as real companies, securities or market observations.

## Import limitations

- Undisclosed accounts payable and short-term debt remain blank; the importer does not fill them with zero.
- A combined Borrowings line does not disclose debt maturity. The application notes the ambiguity and requires the analyst to review the debt classification.
- Investments are excluded from operating working capital.
- Total investing cash flow is not a substitute for capital expenditure.
- Quarterly data is not silently treated as a full financial year.
