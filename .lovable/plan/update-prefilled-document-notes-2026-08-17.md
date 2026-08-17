# Update prefilled document notes

## What changes

New quotations, invoices, receipts and estimates will open with these notes already filled in, and you can still edit or delete them per document:

```text
- Prices are valid for 14 days from the date of this document.
- Payment terms: 60% deposit, balance on delivery.
- Goods once sold are not returnable.
- Delivery time: 2 - 3 working days upon confirmation.
- Paybill 400200   Account number 1089950
```

The stored default currently says 50% deposit and 2 – 3 weeks delivery, and has no Paybill line — that gets replaced with the text above.

## How

- Update the `document_notes_default` value in site settings to the new note text (this is what the editor prefills from, and it stays editable in Settings > Documents).
- Add the same text as a code-level fallback in the document editor's initial state, so a new document still prefills these notes even if the setting is ever cleared.
- Existing saved documents keep their own notes untouched.

No layout or PDF rendering changes; notes already print in the generated PDF.
