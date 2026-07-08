I found the primary blocker: `/admin/documents/new` is matching the URL, but the Documents parent route does not render an `<Outlet />`, so the editor route never appears. That makes the New document button look broken because the URL changes while the list remains on screen.

Plan:

1. Fix the Documents route structure
   - Convert `/admin/documents` into a layout route that renders child routes.
   - Move the current documents list into an index child so `/admin/documents` still shows the list.
   - Ensure `/admin/documents/new?type=...` renders the document editor.
   - Ensure `/admin/documents/$id` renders the edit screen.

2. Improve creation flow
   - Keep the existing document validation, but make save errors clearly visible.
   - Ensure Save draft creates a draft document and redirects to its edit page.
   - Ensure Issue generates the correct number prefix for each type:
     - Invoice: `INV-00001`
     - Quotation: `QUO-00001`
     - Receipt: `REC-00001`
     - Estimate: `EST-00001`

3. Make document type selection clearer
   - Keep the New document button working immediately.
   - Add direct create actions for Invoice, Quotation, Receipt, and Estimate from the Documents admin page so each type can be started without manually changing the type after opening the editor.

4. Verify editing and download
   - Confirm an existing saved document can be reopened from the list and edited.
   - Confirm PDF download works from the editor without Unicode/font errors.
   - Confirm the PDF uses the branded header/footer, logo when available, document title, contact details, totals, notes, and bank/prepared-by sections.

5. End-to-end verification after implementation
   - Using the signed-in admin preview session, create a sample document through the UI.
   - Confirm it appears in the Documents list.
   - Open it, edit it, save changes, and download the branded PDF.
   - Repeat the creation path for Invoice, Quotation, Receipt, and Estimate, or at minimum verify each type’s editor route and save path.