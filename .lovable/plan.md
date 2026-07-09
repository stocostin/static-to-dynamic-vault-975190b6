Update `src/lib/pdf/renderDocument.ts`:

1. **Header layout**
   - Remove the brown/green decorative band drawn on the top-right of the first page.
   - Place `SHACHAVIR TIMBER LIMITED` (site name) and the tagline (`DOORS & WINDOWS | FRAMES | STAIRCASE | FURNITURES`) directly **below** the logo, left-aligned, instead of beside it.
   - Recompute header height so subsequent content (green divider, title) starts below the new stacked block without overlap.

2. **Description column wrapping**
   - In the line-items table, wrap the `description` text using the existing `wrapLines` helper against the Description column width (minus padding).
   - Compute per-row height dynamically = `max(rowH, lineCount * lineHeight + padding)`.
   - Draw the zebra background, borders, and the other columns (No., Qty, Price, Amount) vertically centered against the taller row.
   - `ensureRowSpace` uses the computed row height so multi-line rows page-break correctly.

No other files, no business logic changes.