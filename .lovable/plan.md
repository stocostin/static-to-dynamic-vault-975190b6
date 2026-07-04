## Show prices as whole units with 2 decimals

Currently `price_cents` is treated as cents (divided by 100), so entering `450` renders as `KSh 5`. Switch to whole-unit storage with 2-decimal display so `450` → `KSh 450.00`.

### Changes

1. **`src/lib/legacy-hydrate.server.ts` — `formatPrice`** (line 397): stop dividing by 100; format with `minimumFractionDigits: 2, maximumFractionDigits: 2`.
   ```ts
   const amount = cents.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
   ```

2. **`src/components/admin/ResourceManager.tsx`** (line 450): the `_cents` display helper also divides by 100 — update it to render the raw value with 2 decimals so the admin table matches the site.

3. **`src/routes/_authenticated/admin.shop-products.tsx`** (line 26): update the field label/help to say "Price (KSh)" with example `450 = KSh 450.00` — no more "cents" wording.

Column key stays `price_cents` (no DB migration) to avoid rewriting the schema and existing rows. Existing rows that used the old cents convention will need to be re-entered by the user; that's expected since the display convention is changing.

### Out of scope
- No DB migration or column rename.
- No changes to portfolio, currency selector, or button styling.
