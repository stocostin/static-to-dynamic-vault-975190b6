## Changes

### 1. PDF line item columns (`src/lib/pdf/renderDocument.ts`)
Replace current 7-column table (No, Description, Size, Unit, Qty, Rate, Amount) with the requested 5 columns:
- **No.** | **Description** | **Qty** | **Price/Item** | **Amount**

Size and Unit are dropped from the PDF output (kept in editor data model, just not rendered). Description column widens to absorb the freed space.

### 2. Auto-add next item row (`src/components/admin/DocumentEditor.tsx`)
When the user types into the last row's description (or edits any field on the last row so it becomes non-empty), append a new empty item row automatically. On PDF download and save, filter out trailing empty rows (rows with empty description AND qty 0 / rate 0) so blank rows never reach the PDF or database.

### 3. Skip empty client fields in PDF (`src/lib/pdf/renderDocument.ts`)
The `lbl()` helper already skips falsy values, but empty strings from the form still render blank labels in some paths. Tighten the check to treat whitespace-only values as empty, and skip the CONTACT line entirely if both phone and email are empty. Same for project/location/reg no/KRA PIN.

### 4. Fix PDF header display (`src/lib/pdf/renderDocument.ts`)
The current header overlaps the logo with the site name (logo drawn at `x: margin`, text at `margin + 80` — with a wide logo they collide, matching the uploaded screenshot).
- Measure the drawn logo width and place the site name to the right of it with a fixed gap.
- Vertically center the site name against the logo.
- Change the tagline from `SAWN TIMBER | TREATED TIMBER | PLYWOOD | HARDWARE | DELIVERY` to **`DOORS & WINDOWS | FRAMES | STAIRCASE | FURNITURES`**.
  - Source it from `brand.document_footer_tagline` when set; otherwise use the new default string above (so the old hardcoded-looking tagline in settings is overridden even if the DB still has the old value, we fall back to the new default only when empty — actual change is: if the current stored tagline equals the old timber string, override to the new one at render time; simpler: always use the new string as the default and let admins edit via Settings).
- Also update the default in `admin.settings.tsx` so a fresh install seeds the new tagline.

### 5. Verification
- Create a sample invoice with 2 filled item rows + auto-appended empty row → download PDF → confirm: 5 columns, no empty row rendered, empty client fields hidden, header shows logo + site name side by side without overlap, tagline reads "DOORS & WINDOWS | FRAMES | STAIRCASE | FURNITURES".

## Files
- `src/lib/pdf/renderDocument.ts` — columns, header layout, tagline default, empty-field skipping
- `src/components/admin/DocumentEditor.tsx` — auto-append row, strip empty rows on save/download
- `src/routes/_authenticated/admin.settings.tsx` — update default tagline text
