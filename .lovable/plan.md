## Plan: Verify PDF layout & confirm empty-row exclusion

### Verification steps (build mode)
1. Read current `src/lib/pdf/renderDocument.ts` and `src/components/admin/DocumentEditor.tsx` to confirm:
   - Column order in PDF: **No. | Description | Qty | Price/Item | Amount** (all 4 doc types share the same renderer, so verifying once covers Invoice, Quotation, Receipt, Estimate — only the title string changes).
   - Header tagline default `DOORS & WINDOWS | FRAMES | STAIRCASE | FURNITURES` is used when `brand.document_footer_tagline` is empty.
   - `compactItems()` is called in both `buildRow` (save) and `handleDownload` (PDF) paths.
   - `renderItems` filter in `renderDocument.ts` also drops empty rows as a second safety net.

2. Drive Playwright against `localhost:8080`:
   - Sign in (managed Supabase session), create one document of each type (Invoice, Quotation, Receipt, Estimate) with 2 real rows + 1 auto-appended empty row.
   - Trigger PDF download, save to `/tmp/browser/`, convert with `pdftoppm`, and visually inspect each PDF:
     - Confirm 5 columns in the correct order.
     - Confirm only 2 item rows render (empty trailing row absent).
     - Confirm header shows logo + site name without overlap and the new tagline string.
     - Confirm document title matches type (INVOICE / QUOTATION / RECEIPT / ESTIMATE).

3. If any check fails, patch the specific offending code path (renderer columns, compact filter, or tagline fallback) and re-run the Playwright verification for the affected type.

### Deliverable
Screenshot evidence per document type plus a short pass/fail summary. No feature changes unless a verification step fails.
