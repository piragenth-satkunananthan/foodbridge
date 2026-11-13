# Export Utils

## Overview
Client-side file-export helpers used by the public impact page and the admin verification tab. They serialise report data into CSV (with formula-injection escaping) or JSON and trigger a browser download via a temporary object URL. No server involved — exports are generated purely in the browser.

## Interface
- `downloadCSV(filename, rows)` [utils/exportUtils.js:5] — builds and downloads a CSV from an array of row objects.
- `exportImpactMetricsCSV(summary, ecosystem)` [utils/exportUtils.js:40] — downloads `FoodBridge_Impact_Report_<date>.csv` with fixed methodology rows plus impact figures.
- `exportOrganizationsCSV(organizations)` [utils/exportUtils.js:61] — downloads `FoodBridge_Organizations_Roster_<date>.csv` from organization objects.

## Invariants
- `downloadCSV` is a no-op when `rows` is empty [utils/exportUtils.js:6]; column keys come from `Object.keys(rows[0])` [utils/exportUtils.js:9].
- CSV injection guard: any cell starting with `=`, `+`, `-`, `@`, tab, or CR is prefixed with `'`; embedded `"` is doubled; any cell containing `"`, `,`, or newline is wrapped in quotes [utils/exportUtils.js:18-22].
- `null`/`undefined` cells become empty strings; `Date` cells are rendered with `toLocaleString()` [utils/exportUtils.js:16-17].
- Download filename is `${filename}_${YYYY-MM-DD}.csv` using the current date [utils/exportUtils.js:33].
- `exportImpactMetricsCSV` hard-codes the methodology rows "2.5 meals per kg; explicit weight units only; unrecognised quantities excluded" and "All recorded activity; delivered/completed food and recycled/completed waste" [utils/exportUtils.js:42-43]; all metric values fall back to `0` via `|| 0` [utils/exportUtils.js:45-55].
- `exportOrganizationsCSV` is a no-op on an empty list and defaults `VerificationStatus` to `pending` and `Remarks` to `None` [utils/exportUtils.js:62,69-70].

## Side Effects
- Creates a `Blob` + `URL.createObjectURL`, appends an `<a download>` to `document.body`, clicks it, removes it, and calls `URL.revokeObjectURL` — i.e. a browser file download [utils/exportUtils.js:29-37].

## Verification
- Run: `cd frontend && npm test && npm run build`
