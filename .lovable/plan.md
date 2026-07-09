## Goal
Show up to 4 related products at the bottom of `/shop/$slug`, prioritized by same category, falling back to other published products.

## Changes

### 1. `src/lib/catalog.functions.ts`
Add a new server function `getRelatedShopProducts({ slug, category, limit=4 })`:
- Query `shop_products` where `is_published=true`, `slug != current`, prefer same `category`.
- If fewer than `limit` results, fill with other published products (excluding already returned).
- Return minimal fields: `slug, title, image_url, images, price_cents, currency, category`, each with an `image_absolute`.

### 2. `src/routes/shop.$slug.tsx`
- In the loader, after fetching the product, also call `getRelatedShopProducts` with the product's slug + category. Return `{ product, related }`.
- In `ShopProductPage`, add a "Related products" section below the main grid (only if `related.length > 0`):
  - Heading "Related products"
  - Responsive grid (2 cols mobile, 4 cols desktop) of product cards linking to `/shop/$slug`
  - Card shows image, title, price (if set), category
  - Matches existing shop page card styling

No other files touched. Presentation + data-fetch only.
