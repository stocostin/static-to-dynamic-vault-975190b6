## Root causes

1. **PDF download crashes silently.** The letterhead footer uses Unicode emoji (`☎ ✉ 📍 🌐`) but the PDF embeds `StandardFonts.Helvetica`, which only supports WinAnsi. `pdf-lib` throws `WinAnsi cannot encode "☎"` and the download aborts — user sees nothing happen.
2. **Hardcoded tagline** (`"QUALITY TIMBER. STRONGER FUTURES."`) ignores `brand.document_footer_tagline` from settings, so the "brand" isn't really coming from CMS.
3. **Silent creation failures.** `save.mutate` errors are toasted but Supabase returns technical messages (`Not authorized`, RLS strings). Without a console.error and without validating "at least one line item with a description" the user gets a mysterious empty draft or an unclear toast.
4. **Logo may not embed** if it's served without CORS. `fetch(logo_url)` in the browser can fail on cross-origin CMS URLs — we currently swallow the error without telling the user.

DB is confirmed healthy: table, RLS (`can_edit`), grants, and `next_document_number()` RPC all exist and the signed-in admin has the right role.

## Changes

### `src/lib/pdf/renderDocument.ts`
- Remove all Unicode emoji from the footer; use ASCII labels: `Tel: … | Email: … | Address: … | Web: …`.
- Use `brand.document_footer_tagline` (falls back to `brand.site_name`) instead of the hardcoded string on both header subtitle and footer tagline.
- Sanitize any text going into `drawText` by stripping/replacing characters outside WinAnsi (safety net so a stray emoji in notes/client fields can't crash the whole PDF).
- Add `mode: "cors"` and `cache: "no-store"` to the logo fetch so cross-origin CMS logos work; keep silent fallback but surface a console warning.
- Add a page footer with document number + "Page 1 of 1".

### `src/components/admin/DocumentEditor.tsx`
- Validate before save: at least one line item with a non-empty description (toast otherwise).
- `console.error` the raw error in the save mutation so the exact Supabase message shows up in devtools.
- Wrap `handleDownload` with `console.error` and show the PDF error message verbatim in the toast (instead of the generic "PDF failed").
- Ensure `total_cents` never NaN when `qty`/`rate` are empty strings.

### Verification
- Run typecheck.
- Create a quotation with 2 line items → Save draft → the row appears in the list.
- Click "Issue" → number `QUO-00001` assigned.
- Click "Download PDF" → file downloads, opens showing logo, brown/green letterhead, client block, table, totals, notes, bank details, signatures, and ASCII contact footer (no black boxes).

No DB migration needed.
