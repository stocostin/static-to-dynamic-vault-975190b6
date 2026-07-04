## Working search, category filter, and pagination on /shop

The shop template already has `#searchInput`, `#categoryFilter`, `#productsContainer`, and `#paginationContainer` in `src/legacy/shop.html`, but nothing wires them up (the old `shop.js` was stripped). All CMS products are currently rendered into `#productsContainer` at once with no controls.

### Changes (all in `src/lib/legacy-hydrate.server.ts`)

1. **Tag each product card with filter data** in `renderProductCards`: add `data-title`, `data-category`, and `data-desc` to the outer `.product-card` so the client script can filter without re-parsing text.

2. **Populate the category dropdown from real data** in `hydrateShop`: build the unique sorted list of `category` values from the fetched products and rewrite `#categoryFilter`'s `<option>` list to `All Categories` + one option per real category (slug value, human label). Keeps `all` as the default value.

3. **Inject a shop controls script** (appended once, alongside the existing auto-rotate script) that:
   - Reads every `.product-card` inside `#productsContainer` into an in-memory array.
   - On `input` in `#searchInput`, `change` in `#categoryFilter`, click on `#searchBtn`, and pagination clicks: filter by category (`all` = no filter) and case-insensitive substring match on title + description, then paginate at **15 per page**.
   - Renders `#paginationContainer` as `‹ Prev | 1 2 3 … | Next ›` buttons with the current page highlighted; hides the container when there is only one page.
   - Resets to page 1 whenever search/filter changes; scrolls the grid into view on page change.
   - Shows an empty-state message inside `#productsContainer` when no products match.

Featured products section is untouched — pagination applies only to `#productsContainer` (All Products).

### Out of scope
- No URL search-param state (kept simple, client-only). Can add `?page=&q=&cat=` later if needed.
- No changes to admin, card styling, or WhatsApp button.
