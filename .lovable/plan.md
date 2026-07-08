## Goal

1. Rename the Settings tab "Documents & Tax" → "Documents".
2. Make the Documents module actually usable end-to-end: create, edit, save drafts, issue, and download.

## Changes

### 1. Settings tab rename
In `src/routes/_authenticated/admin.settings.tsx`, change the group label from `"Documents & Tax"` to `"Documents"`. Update the matching helper text in `DocumentEditor.tsx` that reads "Site settings → Documents & Tax" → "Site settings → Documents".

### 2. Documents list (`admin.documents.tsx`)
- Add an explicit **Edit** action column (pencil icon → `/admin/documents/$id`) so drafts and issued docs are obviously clickable, not only via the number cell.
- Make the whole row clickable/hover state clearer.
- Fix the duplicated "New quotation/invoice/receipt/estimate" button strip: keep a single clean "New document" split control with a type dropdown (removes the noisy row of four buttons above the table).
- Ensure the empty state shows a working "Create your first document" CTA.

### 3. Document editor (`DocumentEditor.tsx`)
- Guard the Save button: block save when `client_name` is empty and show a toast (currently silently inserts an empty client which then looks broken).
- Ensure the "Save draft" path works even before any line item has a rate (currently accepted, just confirm).
- After a successful **insert**, the code already navigates to `/admin/documents/$id` — verify the navigation params typing works (small type fix if needed).
- When editing an existing issued doc, the primary button label should read "Save changes" instead of "Save" for clarity.
- Line-items rate input: initialize display value cleanly when `rate_cents` is 0 (avoid the "0" prefix quirk).
- Confirm the settings query, the `next_document_number` RPC call, and the insert payload all match the DB schema (spot-checked in DB: RPC exists, RLS policies allow editors/admins, current user has admin role and INSERT/SELECT privileges — so the flow should work once the small UX guards above are in).

### 4. Verification
- Load `/admin/documents` — list renders, "New document" opens editor.
- Create quotation with 2 line items → Save draft → row appears with "— draft".
- Open draft → Issue → number `QUO-00001` assigned, status flips to Issued.
- Download PDF → file downloads with letterhead.
- Edit issued doc, change a line item → Save changes → totals update.
- Rename verified in Settings UI.

## Files touched

- `src/routes/_authenticated/admin.settings.tsx` (label rename)
- `src/routes/_authenticated/admin.documents.tsx` (list UX + edit column)
- `src/components/admin/DocumentEditor.tsx` (validation, button label, helper text, rate input)

No DB migration needed — schema, RPC, policies, and grants are already in place.
