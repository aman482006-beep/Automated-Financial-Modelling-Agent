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

## Bundled NSE company universe

The browser app bundles a **security directory**, not company financial statements. The directory contains 200 companies shown in the Nifty 200 constituent table snapshot dated **6 November 2026**. Each entry contains issuer name, NSE symbol, sector and a Nifty 100 membership flag. The Nifty 100 picker filters the same universe to its 100 members. The 200 symbols and 100-symbol subset were cross-checked against the published tables for exact counts and membership. This was not an automated download / hash verification of NSE’s raw CSV files; recheck the current official CSV before using the snapshot.

The index names do not represent a live, daily rank of the largest 100 / 200 companies by market capitalisation:

- NSE describes Nifty 100 as the top 100 companies by full market capitalisation from Nifty 500.
- NSE describes Nifty 200 as Nifty 100 plus Nifty Full Midcap 100.
- Nifty indices use free-float market-cap weighting and are rebalanced periodically. Company membership and ranking can change.

Sources:
- [NSE — Nifty 100](https://www.nseindia.com/static/products-services/indices-nifty100-index)
- [NSE — Nifty 200](https://www.nseindia.com/static/products-services/indices-nifty200-index)
- [NSE — Nifty 100 constituent CSV](https://nsearchives.nseindia.com/content/indices/ind_nifty100list.csv)
- [NSE — Nifty 200 constituent CSV](https://nsearchives.nseindia.com/content/indices/ind_nifty200list.csv)
- [Displayed 6 Nov 2026 Nifty 100 constituent table](https://tipsheet.markets/indices/nifty-100/)
- [Displayed 6 Nov 2026 Nifty 200 constituent table](https://tipsheet.markets/indices/nifty-200/)
- [NSE — index data subscription and proprietary-rights statement](https://www.nse.in/static/nse-indices/index-data-subscription)
- [Constituent snapshot used for the 6 November 2026 directory — Nifty 100](https://tipsheet.markets/indices/nifty-100/)
- [Constituent snapshot used for the 6 November 2026 directory — Nifty 200](https://tipsheet.markets/indices/nifty-200/)

The selector preloads **no** historical financials, prices, market-cap values, enterprise value, shares outstanding or peer multiples. Choosing a company creates an empty annual model with the issuer identity attached. The normal data-readiness and DCF checks continue to block forecasts and valuation until source financials are imported and reconciled.

Use issuer annual reports, quarterly results and exchange filings, or a properly licensed financial-data provider. The app does not scrape third-party financial portals or redistribute their proprietary financial data. Before relying on an issuer model, check the uploaded workbook's issuer name, NSE symbol, standalone / consolidated basis, period, currency, unit, restatements and filing source. An uploaded document is not independently authenticated by ModelForge.

NSE Indices states that it retains proprietary rights in index names, compilation and constituent composition and provides licensing / data-subscription pathways. A developer should obtain any rights required for institutional or commercial redistribution; bundling a public snapshot does not itself grant those rights. The bundled directory is a dated snapshot, not a live index service. Refresh it against current NSE constituent downloads when the index rebalances; do not use it as a current-market-cap ranking or assume membership remains unchanged.
