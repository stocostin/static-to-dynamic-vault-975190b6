## Business documents module (Invoice / Quotation / Receipt / Estimate)

Add an admin-only module for creating and downloading branded business documents with a letterhead built from the site's logo and contact details. Design borrows from the uploaded Timber Solutions quotation reference.

### 1. Database — `business_documents` table

Single table storing all four document types.

Columns (domain):
- `doc_type` — one of `invoice`, `quotation`, `receipt`, `estimate`
- `doc_number` — auto-generated per type (e.g. `QUO-00047`, `INV-00012`)
- `issue_date`, `due_date` (nullable)
- `client_name`, `client_reg_no`, `client_kra_pin`, `client_address`, `client_email`, `client_phone`
- `project_name`, `location`
- `line_items` (jsonb array: `{ description, size, unit, qty, rate_cents }`)
- `subtotal_cents`, `tax_rate` (snapshot at time of issue), `tax_label`, `tax_cents`, `total_cents`, `currency` (default `KES`)
- `notes` (text — defaults from site settings)
- `status` — `draft` / `issued` / `paid` / `void`
- `created_by` (uuid → auth.users)

Also add:
- `document_counters` table: `{ doc_type text primary key, last_number int }` for atomic sequential numbering via a `SECURITY DEFINER` function `next_document_number(_type)`.
- Site settings keys (into existing `site_settings`): `tax_enabled` (bool), `tax_rate` (numeric, e.g. 16), `tax_label` (text, e.g. "VAT"), `document_notes_default` (text), `document_footer_tagline` (text), `bank_details` (text, optional).

RLS: only users with `admin` or `editor` role (via existing `can_edit`) can select/insert/update/delete both tables. GRANTs to `authenticated` + `service_role`.

### 2. Admin UI

New sidebar group "Documents":
- `/admin/documents` — list of all documents with filters by type/status, columns: number, type, client, date, total, status. Actions: view, edit, download PDF, duplicate, void.
- `/admin/documents/new?type=quotation` — create form.
- `/admin/documents/$id` — edit form (same component).

Form sections:
- Type + status (type locked after first save so number stays stable).
- Client details (name, reg no, KRA PIN, project, location, contact).
- Line items table (add/remove rows: description, size, unit, qty, rate; live subtotal per row).
- Notes (prefilled from settings, editable).
- Live totals panel: subtotal, tax row (shown only when `tax_enabled=true`, using settings' rate + label), grand total. When tax is globally off the row is hidden and total = subtotal.
- Save draft / Issue / Download PDF buttons.

Tax settings live in **Site settings → Documents** (existing settings page gets a new "Documents & Tax" section): global toggle, rate, label, default notes, footer tagline, bank details. Rate + label are snapshotted onto each document at issue time so past documents don't change when settings change.

### 3. Letterhead + PDF generation

Client-side PDF via `pdf-lib` (already Worker-compatible; small, no native deps). One reusable `renderDocumentPdf({ doc, settings, logoBytes })` module producing an A4 page:

```text
┌──────────────────────────────────────────────────┐
│ [LOGO]  SITE NAME              [wood banner img] │
│         tagline                                  │
├──────────────────────────────────────────────────┤
│              QUOTATION / INVOICE / …             │
│ DOC-00047                                        │
│ Date: dd/mm/yyyy                                 │
│                                                  │
│ CLIENT: …    REG NO: …                           │
│ PROJECT: …   LOCATION: …                         │
│ KRA PIN: …                                       │
│                                                  │
│ ┌──┬─────────┬────┬────┬───┬──────┬────────┐    │
│ │No│Descrip. │Size│Unit│Qty│ Rate │ Amount │    │
│ ├──┼─────────┼────┼────┼───┼──────┼────────┤    │
│ │01│…        │…   │Pcs │50 │450.00│22,500  │    │
│ └──┴─────────┴────┴────┴───┴──────┴────────┘    │
│                              Subtotal:  …        │
│                              VAT (16%): …        │
│                              TOTAL:     …        │
│                                                  │
│ NOTES: …                                         │
│                                                  │
│ Prepared By ______   Approved By ______          │
│                                                  │
│ [contact bar: phone | email | address | site]    │
└──────────────────────────────────────────────────┘
```

Colors/typography borrowed from the reference: deep brown header band, green accent lines, dark section labels, tabular monospaced amounts. Logo pulled from `site_settings.logo_url`; contact block from existing `site_settings` (`contact_phone`, `contact_email`, `contact_address`, `website_url`).

Download filename: `<DOC-NUMBER>-<client-slug>.pdf`.

### 4. Files touched

**New**
- `supabase/migrations/<ts>_business_documents.sql` — tables, GRANTs, RLS, `next_document_number()` fn, seed rows in `site_settings`.
- `src/lib/documents.functions.ts` — `listDocuments`, `getDocument`, `saveDocument` (assigns number on first issue via RPC), `voidDocument`. All `requireSupabaseAuth` + role check.
- `src/lib/pdf/renderDocument.ts` — `pdf-lib` renderer.
- `src/lib/pdf/letterhead.ts` — shared header/footer drawing.
- `src/routes/_authenticated/admin.documents.tsx` — list.
- `src/routes/_authenticated/admin.documents.new.tsx` — create.
- `src/routes/_authenticated/admin.documents.$id.tsx` — edit.
- `src/components/admin/DocumentEditor.tsx` — the form + live totals + download button.

**Edited**
- `src/components/admin/AdminShell.tsx` — new "Documents" nav group.
- `src/routes/_authenticated/admin.settings.tsx` — add Documents & Tax section (toggle + rate + label + defaults).
- `package.json` — add `pdf-lib`.

### 5. Verification

- Migration passes linter; new tables have RLS + GRANTs.
- Create one document of each type; confirm sequential numbering per type.
- Toggle `tax_enabled` off → editor hides tax row, PDF omits it, total = subtotal.
- Change tax rate after issuing a document → existing PDF still uses snapshotted rate.
- Download PDF; open and visually confirm letterhead, table, totals, notes, signature area, contact bar all render cleanly on A4.
