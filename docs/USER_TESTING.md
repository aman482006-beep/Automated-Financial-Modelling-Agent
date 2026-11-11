# ModelForge user-testing guide

Thank you for trying ModelForge. This short test helps identify confusing workflows and real defects. It is a beta feedback exercise, not an endorsement or a financial-analysis service.

**Time:** about 10–15 minutes  
**Use:** the live browser application  
**Data:** synthetic demonstration data only

## Before you start

Open the [live ModelForge workspace](https://aman482006-beep.github.io/Automated-Financial-Modelling-Agent/). Use a current desktop or mobile browser. The application is static and saves project changes to the current browser profile's localStorage.

Do not upload real client workbooks, bank or brokerage statements, personal financial information, credentials, account identifiers, passwords, API keys or material non-public information. Do not share real company filings or private data in an issue. Use the fictional Aster Industries demonstration project and the bundled sample CSV only.

## Test tasks

### 1. Understand the starting point

On Overview, identify that Aster Industries is synthetic demonstration data. Find the model-readiness panel and the source / privacy notice.

**Tell us:** Was it clear which information was fictional and where your data is stored?

### 2. Review the historical model

Open History. Find FY2025 revenue, EBITDA and free cash flow. Compare them with the [validation playbook](VALIDATION_PLAYBOOK.md).

**Tell us:** Could you find the figures and understand how the ratios were calculated?

### 3. Explore the forecast and valuation

Open Forecast, then DCF and Scenarios. Change one forecast assumption, observe the result, and restore the original value or reset the demo.

**Tell us:** Which input or output was confusing? Did the warnings explain what needed attention?

### 4. Check the company picker safety behaviour

Return to Overview, choose an existing NSE company such as Reliance Industries, and inspect the empty model.

**Expected:** the picker supplies issuer identity only. It must not copy Aster's fictional financial statements, prices or share count into the company model. The model should remain blocked until verified annual financial statements and assumptions are supplied.

**Tell us:** Was that distinction obvious?

### 5. Try a synthetic import and workbook export

Use the bundled `sample-data/aster_industries.csv` file as a test import. Review the detected labels and mapping suggestions. Then export the workbook and inspect the worksheets in Excel or LibreOffice.

The CSV fixture is intentionally smaller than the fully populated in-app Aster demo. Missing fields should remain blank; do not fill them with guessed zeroes just to clear a warning.

**Tell us:** Did import, mapping and export behave as expected? Include the browser and operating system if something failed.

## What to send back

Use the [User feedback issue form](https://github.com/aman482006-beep/Automated-Financial-Modelling-Agent/issues/new?template=user_feedback.yml). Useful feedback includes:

- the task you attempted;
- what you expected to happen;
- what actually happened;
- the step where you got stuck;
- browser, operating system and screen size;
- whether the problem is repeatable.

Screenshots are useful only after you have checked that they contain no personal details, real financial data or credentials.

## Privacy

ModelForge has no server-side account or project storage. Uploaded files are parsed in the browser; saved project data lives in localStorage for the current browser profile. localStorage is not encrypted. Clear local site data after testing on a shared device.

## Maintainer note

Feedback is reviewed on a best-effort basis. A report does not guarantee a fix or a release date. Please report security vulnerabilities privately using [SECURITY.md](../SECURITY.md), not through the public feedback form.
