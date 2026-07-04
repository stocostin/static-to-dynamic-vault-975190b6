## Goal

Seed the database with all the content that currently lives in the legacy HTML files, so the CMS shows the real site copy (not empty fields) and admins edit existing content instead of retyping it from scratch.

## What went wrong

When the schema-driven `PageEditor` and new tables (`blog_posts`, `shop_products`, extended `services`/`portfolio_projects`) were introduced, hydration started reading from DB rows. The rows were mostly empty, so the live site fell back to whatever the templating left in place — and the CMS forms showed blank fields. You expected the existing website copy to be pre-populated in the CMS.

## Fix — one seeding migration

Parse each legacy HTML file and write the content into the matching table/row. Use `INSERT ... ON CONFLICT DO UPDATE` guarded by "only overwrite when the current DB value is NULL/empty" so this is safe to re-run and never clobbers content an admin has already edited.

### Data to seed (source → destination)

1. **`src/legacy/about.html`** → `page_sections` rows keyed `about:hero`, `about:our_story`, `about:mission_vision` (mission/vision/objective titles + bodies), `about:process` (title, intro, `steps[]` repeater, summary), `about:team_intro`.
2. **`src/legacy/services.html`** → `page_sections` rows `services:hero`, `services:what_we_offer`, `services:cta_footer`; plus one row per service card into `services` (title, short + long description, `features` jsonb bullet list, image_url, CTA label/url, display_order, is_active).
3. **`src/legacy/portfolio.html`** → `page_sections` rows `portfolio:hero`, `portfolio:filters_intro`, `portfolio:cta_footer`; plus each project card into `portfolio_projects` (title, description, category, location, image_url, order).
4. **`src/legacy/shop.html`** → `page_sections` rows `shop:hero`, `shop:featured`, `shop:all_products`; plus each product card into `shop_products` (name, description, price, image_url, category, is_featured, is_active, order).
5. **`src/legacy/blog.html`** → `page_sections` rows `blog:hero`, `blog:intro`; plus each existing article card into `blog_posts` (title, slug, excerpt, cover image, category, body_html — from the article body if present, otherwise the card excerpt as a placeholder paragraph, `is_published = true`, `published_at = now()`).
6. **`src/legacy/contact.html`** → `page_sections` rows `contact:hero`, `contact:intro`, `contact:details` (address, phones, emails, map embed url), `contact:hours` (repeater), `contact:form` (heading, subtitle, success message).
7. **`src/legacy/index.html`** + shared chrome → `site_settings` keys already used by hydration (brand, hero, contact/social, footer, google reviews) only when currently empty.
8. **Team, testimonials, FAQs** → seed rows from `about.html` / `index.html` into `team_members`, `testimonials`, `faqs` when those tables are empty.

### Safety rules for the seed

- Every insert uses a stable natural key (`section_key`, `slug`, or `(title, display_order)`) with `ON CONFLICT DO UPDATE SET col = COALESCE(NULLIF(target.col, ''), EXCLUDED.col)` so admin edits are preserved.
- No table is truncated. No existing row is deleted.
- Runs inside a single migration so approval is one click, and `bump_content_version` fires once at the end to refresh the public cache.

### Deliverable

One new migration file that performs the seed described above. No changes to the public site's styling, no changes to hydration logic, no new admin screens.

## Verification

After the migration runs:
- Open `/admin/pages/about`, `/services`, `/portfolio`, `/shop`, `/blog`, `/contact` — every field is pre-filled with the copy from the legacy HTML.
- Open `/admin/services`, `/admin/portfolio`, `/admin/shop-products`, `/admin/blog-posts`, `/admin/team`, `/admin/testimonials`, `/admin/faqs` — rows already exist, each editable.
- Live pages render identically to before (the hydrator now finds the same text in the DB that used to be inline).
