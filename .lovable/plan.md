## Goal
Make line-item rows easier to read by adding a clear alternating (zebra) style plus a thin horizontal separator between every row.

## Change (only `src/lib/pdf/renderDocument.ts`, line-items table)

1. **Stronger zebra shading**
   - Replace the current `LIGHT` (`rgb(0.95,0.95,0.95)`) fill used on even rows with a slightly warmer, more visible tint (e.g. `rgb(0.96, 0.94, 0.90)` — soft cream that complements the brown/green brand) applied to every other row.
   - Keep odd rows white (no fill) for contrast.

2. **Row separators on every row**
   - Draw a thin `rgb(0.85,0.85,0.85)` bottom border under every row (currently only one line is drawn, which visually merges tall multi-line rows).
   - Keep the existing thicker `BROWN` bottom border under the last row / table bottom.

3. **Vertical column dividers (optional, subtle)**
   - Add faint `rgb(0.9,0.9,0.9)` vertical lines between the 5 columns spanning the full table height so the eye tracks Qty / Price / Amount alignment.

No other sections (header, totals, notes, signatures, footer) change. No business logic changes.

## Verification
Regenerate a test PDF with mixed short + long descriptions, rasterize with `pdftoppm -jpeg -r 150`, and visually confirm:
- Alternating fill is clearly visible but not distracting.
- Every row has a bottom separator, including multi-line rows.
- Column dividers align with header cells and don't overlap text.
