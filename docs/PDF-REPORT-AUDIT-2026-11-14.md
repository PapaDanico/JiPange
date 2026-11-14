# PDF and report audit — 14 November 2026

## Scope and evidence

Static source audit of the JiPange export/report paths:
- `web/components/tools/ExportCardButton.tsx` (PDF, PNG, sharing)
- `web/components/tools/ExportableSection.tsx` (server-page wrapper)
- `web/components/tools/PrintLetterhead.tsx` (browser-print furniture)
- `web/lib/export-sheet.ts` (A4 layout, pagination, assumptions)
- `web/e2e/print-reports.spec.ts` (print geometry and content)
- New `/tools/household-resilience` route and its browser tests.

This is **not** a completed visual audit of every generated PDF: no browser-built PDFs were available for inspection in this session. All visual claims must be confirmed with real exported samples and rendered page images.

## Defects fixed in PR #276

1. **Redundant PDF prerequisite:** PDF action previously called `renderCard` and `frame` before creating the document sheet. This doubled rasterisation and meant a failure in the unnecessary image pass blocked PDF generation. PDF now goes directly to `buildSheet`; PNG retains its own capture.
2. **Missing resilience report:** The new resilience calculator had no export action. It now exports the 12-month cash balances with user inputs, shock, dated bill and explanatory notes, using the existing branded A4 sheet.
3. **Unreproducible report:** The resilience report explicitly records cash savings, income, essential outflows, debt service, shock and scheduled obligation rather than relying on on-screen fields that may not be in the capture.
4. **Regression coverage:** Browser test asserts the report button exists and a downloaded file has a PDF signature and nontrivial size. This test has been committed but **not executed**.

## Existing safeguards confirmed in code

- A4 portrait/landscape document framing, dated headings, pagination and page furniture in `export-sheet.ts`.
- HTML escaping of user-supplied title and assumption labels/values in the sheet.
- Export-time font loading and suppression of entrance animations.
- Error messages for failed exports and a separate PNG sharing path.
- Print-media tests checking geometry, visible navigation controls, NaN/undefined and report section heights.

## Outstanding verification and acceptance criteria

1. Run `npm run verify:all` locally against the final PR SHA, record failures by file, and repair them before merge.
2. Generate real PDFs on desktop Chromium and mobile-sized Chromium for each report-capable route, with short, long, missing and extreme-but-valid inputs. Confirm first page, last page, page count, footer, source/date, full numeric tables, text legibility, no blank pages, no clipped rows, no overlap and no NaN/Infinity.
3. Render each downloaded PDF to PNG at 150–200 dpi and inspect images. A PDF signature alone is **not** proof of correct layout.
4. Extract text from PDFs and compare displayed monetary figures against the corresponding on-screen results; raster-only PDF exports may require a browser-side DOM comparison rather than text extraction. Record the accessibility limitation: image-only PDF text is not selectable or screen-reader-friendly.
5. Test A4 portrait and landscape, 1-page and multi-page documents, long notes, tables and very large figures. Confirm that `fitScale`'s 0.5 floor does not conceal overflow or render text too small.
6. Verify reports are reproducible and include assumptions, as-of dates, methodology and caveats. Report screenshots should never be represented as certified financial statements.
7. Verify export buttons function without `window.print()` in Android WebView/PWA contexts. Test filename safety and repeated downloads.
8. Test report PDF MIME type, page count, nonblank raster content and readable page geometry; preserve a baseline screenshot for each representative report.

## Risk ranking

- P0: Missing rows, misleading figures, or successful-looking blank PDF.
- P1: Unreproducible assumptions, inaccessible raster-only reports, missing sources/date, incorrect page count.
- P2: Oversized files, minor alignment, brand inconsistency.

## Release decision

**Not yet production-certified.** Fixes are committed; end-to-end execution and visual PDF review remain necessary. Avoid Netlify preview builds; consolidate into one verified release.
