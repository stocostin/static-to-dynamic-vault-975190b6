## Fix PDF pagination + empty-row filtering

Scope: `src/lib/pdf/renderDocument.ts` only. No other files touched.

### 1. Pagination (multi-page support)

Currently the renderer writes to a single A4 page; when items exceed available space they overlap. Fix:

- Introduce a `MIN_Y` threshold (e.g. `170`, above the footer/signature band).
- Before drawing each row (header, item row, totals row, notes line, bank line), check `if (y < MIN_Y) { page = pdf.addPage([595.28, 841.89]); y = height - margin; /* redraw table header on the new page */ }`.
- Extract the current table-header-drawing block into a small local helper so it can be called on page break.
- Only the footer contact bar + signature block are drawn on the final page (after all content is placed), so they don't repeat mid-document. Simplest approach: track pages in an array, then after content loop, draw footer/signatures only on the last page.

### 2. Skip empty trailing/interspersed rows

The existing filter:
```ts
(it.description && it.description.trim()) || (Number(it.qty) || 0) > 0 || (Number(it.rate_cents) || 0) > 0
```
treats a row as non-empty if qty or rate is set even without a description. Per the request, a row with **no description** must be considered empty regardless of qty/rate. Change filter to:
```ts
renderItems = doc.line_items.filter((it) => (it.description ?? "").trim().length > 0);
```

That's it — no other files, no schema, no UI changes.
