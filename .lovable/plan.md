## Goal
Ensure long line-item descriptions wrap strictly inside the Description column and never bleed into the Qty column in the generated PDF.

## Changes (in `src/lib/pdf/renderDocument.ts`)

1. **Hard-wrap safeguard in `wrapLines`**
   - Current `wrapLines` splits on whitespace only, so a single very long token (e.g. `Mahogany-hardwood-double-leaf-panel-door-2400x1200mm-with-architrave`) stays on one line and overflows.
   - Extend it: if a single word's width exceeds `maxWidth`, break it character-by-character into chunks that fit. Applies to any caller, but critical for the Description cell.

2. **Sanitize before measuring**
   - `wrapLines` currently measures raw text but `drawText` renders `safe(text)`. Non-WinAnsi glyphs get replaced with `?` at draw time, changing width. Run input through `safe()` inside `wrapLines` (or measure the sanitized string) so wrap width matches drawn width.

3. **Use a slightly tighter `descMaxW`**
   - Keep `descPad = 6` but compute `descMaxW = descCol.w - descPad * 2 - 2` (2pt safety) to guarantee no glyph tail crosses the column border even with kerning rounding.

4. **Confirm row-height math already added**
   - Keep the existing `thisRowH = max(rowH, lines * lineHeight + 10)` and `ensureRowSpace(thisRowH)` — no change, just verify still in place.

## Verification

- Add a temporary dev harness (not committed) OR use existing document editor:
  - Create a sample document with 3 line items whose descriptions are: (a) short, (b) long multi-word sentence ~30 words, (c) a single 80-character unbroken token.
  - Generate the PDF via the existing Download action.
  - Rasterize with `pdftoppm -jpeg -r 150` and visually inspect page 1:
    - Description text stays inside its column x-range `[tableX + descPad, tableX + descCol.w - descPad]`.
    - Qty/Price/Amount columns render cleanly, vertically centered.
    - Zebra background and bottom border expand to full row height.
    - Multi-line row page-breaks correctly when placed near page bottom.
- Report issues found and fixes applied per the PDF QA checklist.

## Out of scope
Header layout, footer, totals, notes, bank details, signatures — untouched.
