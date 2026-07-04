## Goal

Support multiple auto-rotating images per shop product and per portfolio project, and clean up the CMS list views to show a thumbnail instead of the raw URL.

## 1. Database — add `images` array

One migration adds a `images text[] not null default '{}'` column to both `shop_products` and `portfolio_projects`. Existing single `image_url` / `cover_image_url` stays as the primary/first image so nothing already saved disappears; the array holds the full ordered gallery (including the primary).

## 2. CMS editor — multi-image field

Add a new `"images"` field type to `ResourceManager` (`src/components/admin/ResourceManager.tsx`):

- Renders the list of current image URLs as small thumbnails with a remove (×) button on each and drag-free up/down reorder arrows.
- One file input that accepts `multiple` — each selected file uploads to `admin-uploads` via the existing helper and appends `/uploads/<path>` to the array.
- Also accepts a pasted URL via an "Add URL" input.
- Stored as `text[]`.

Wire it into:
- `src/routes/_authenticated/admin.shop-products.tsx` — add `{ key: "images", label: "Gallery images", type: "images", help: "First image is the main/cover" }`.
- `src/routes/_authenticated/admin.portfolio.tsx` — same field, labelled "Gallery images".

Keep the existing single `image_url` / `cover_image_url` fields so the primary image is explicit and legacy rows keep working. On save, if `images` is empty but a single image exists, we mirror it into `images[0]`; if the single field is empty but `images[0]` exists, we mirror it back. This keeps the public renderer (which currently reads only the single field) working unchanged until it's updated in step 4.

## 3. CMS list view — thumbnail + tighter columns

Update `renderCell` in `ResourceManager.tsx` so that when a column value is either an `/uploads/...` path OR an `http(s)` image URL OR an array of image URLs, it renders a 40×40 rounded thumbnail (first image if array) instead of the truncated string. Also drop the `max-w-xs truncate` on the image column.

Then update the `listColumns` for both admin routes:

- `admin.shop-products.tsx` →
  ```
  { key: "image_url", label: "" },
  { key: "title", label: "Product" },
  { key: "price_cents", label: "Price" },
  { key: "is_featured", label: "Featured" },
  { key: "is_published", label: "Published" },
  ```
  Price gets a small formatter in `renderCell` — if the column key ends with `_cents` and value is a number, show `KSh {value/100}`.
- `admin.portfolio.tsx` →
  ```
  { key: "cover_image_url", label: "" },
  { key: "title", label: "Project" },
  { key: "category", label: "Category" },
  { key: "is_featured", label: "Featured" },
  { key: "is_published", label: "Published" },
  ```

## 4. Public site — auto-rotating gallery

In `src/lib/legacy-hydrate.server.ts`:

- `renderProductCards` and `renderPortfolioCards` / `renderPortfolioListCards`: when `images` has 2+ entries, emit the card image as a small `<div class="auto-rotate" data-images='["url1","url2",...]'>` wrapping an `<img>` set to the first image. Single-image rows render unchanged.
- Inject a tiny inline `<script>` at the end of the hydrated body that finds every `.auto-rotate`, parses `data-images`, and swaps the `<img src>` every 3.5s with a short CSS opacity transition. No dependencies, no framework — safe inside the legacy HTML.
- Same treatment on the service-detail and portfolio-detail hero when those pages have multiple images (portfolio only for now — services stays single-image unless asked).

## Out of scope

- No visual redesign of the shop or portfolio cards themselves.
- No lightbox / click-to-zoom.
- No reordering by drag; up/down arrows only.

## Technical notes

- The new column is `text[]`, so `ResourceManager`'s save path needs the same array handling used for `stringlist` (it already branches on `Array.isArray`); the `images` type reuses that branch and just skips the newline-split fallback.
- `renderCell` image detection: `typeof v === "string" && (v.startsWith("/uploads/") || v.startsWith("http"))` — the existing regex only matched http URLs with image extensions, which is why `/uploads/...` currently renders as raw text.
- The auto-rotate script is idempotent (guards on `dataset.rotateBound`) so re-hydration on client nav won't stack intervals.
