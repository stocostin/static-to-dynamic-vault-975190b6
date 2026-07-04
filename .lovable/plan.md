
## Goal

Two problems to solve, in one pass:

1. **Edits from the CMS don't always show up** on the public site.
2. **Large parts of the public site are still hardcoded** (hero, "Why choose us", feature cards, service detail blocks, about page, contact form, blog, shop, google-review widget, nav menu, footer links, copyright, WhatsApp CTAs, etc.).

The public site's HTML/CSS/JS stays byte-identical in structure — only the *text/image/link content* is swapped in from the database. The CMS itself gets restructured to make editing all of this easy.

---

## Part 1 — Fix "edits don't appear"

Root cause: the server-side hydration layer has a 30s in-memory cache with no invalidation. On a multi-instance worker each instance also caches independently, so an edit may take up to 30s to appear on some requests and inconsistently across instances.

Fix:
- Drop the TTL to **5 seconds**.
- Add a `content_version` row in `site_settings`, bumped by a lightweight trigger whenever any content table (`site_settings`, `pages`, `services`, `portfolio_projects`, `testimonials`, `team_members`, `faqs`, `menus`, `menu_items`, `page_sections`) is written. Cache keys include this version → any edit invalidates all caches instantly.
- Send `Cache-Control: no-store` on the hydrated HTML responses so no CDN/browser cache masks fresh edits.
- Add a small "Preview live site" button in the CMS that opens `/` with `?preview=1`, which bypasses the cache entirely.

---

## Part 2 — Make every section editable

Two mechanisms cover everything without touching visual markup:

### A. Extend `site_settings` (global values)

New keys, all optional strings, with sensible defaults preserving current copy:

- Header: `header_logo_url`
- Hero: `hero_title`, `hero_subtitle`, `hero_bg_1/2/3`, `hero_cta_primary_label/url`, `hero_cta_secondary_label/url`
- WhatsApp / phone: `whatsapp_number`, `whatsapp_default_message`
- Google review widget: `google_review_url`, `google_rating_value`, `google_rating_count`, `google_reviews_current`, `google_reviews_goal`, `google_qr_image_url`
- Footer: `footer_logo_url`, `footer_tagline`, `footer_copyright`, `footer_credit_label`, `footer_credit_url`, plus the existing social + contact keys
- Loading overlay: `loading_welcome_text`, `loading_tagline`
- Maps / address: `google_maps_url`
- Extra socials already present: `social_tiktok`

The Settings admin page is rebuilt into **grouped tabs** (Branding, Hero, Contact & Social, Google Reviews, Footer, SEO defaults) so this doesn't turn into a wall of inputs.

### B. Use `page_sections` for per-page content blocks

Each editable text/image block on a page becomes one row keyed by `(page slug, section_key)`. Fields already exist: `title`, `subtitle`/`body`, `image_url`, `sort_order`, plus a JSON `content` field for lists (e.g. service features, process steps, "Why choose us" cards).

Blocks to seed (existing copy preserved exactly):

- **Home:** `why_choose_us` (list of 4 feature cards), `services_preview_intro`, `featured_projects_intro`, `cta_footer`
- **Services:** `page_header`, `intro`, `overview`, per-service detail (`doors`, `frames`, `staircases`, `furniture` — heading, description, features list, image, CTA links), `process` (steps list), `cta_footer`
- **About:** all sections currently in `about.html` (mission, story, values, team intro, CTA)
- **Portfolio:** `page_header`, `cta_footer`
- **Contact:** `page_header`, `intro`, `office_hours`, `map_embed_url`, CTA
- **Blog:** `page_header`, blog posts themselves become `page_sections` rows with `section_type = 'blog_post'` on the `blog` page (title, excerpt, cover, body, published_at) — no schema change
- **Shop:** `page_header`, product cards as `page_sections` rows with `section_type = 'product'` (title, image, price, url) — no new table; a proper commerce layer is out of scope

### C. Editable navigation via `menus` / `menu_items`

- Hydrate `<header nav ul>` from menu with slug `main`.
- Hydrate footer "Quick Links" from menu `footer_quick_links`, "Services" from `footer_services`.
- Seed those three menus with the current hardcoded links so nothing changes visually.
- New admin screen `/admin/menus/$slug` for reordering/editing items (label, url, sort_order, open_in_new_tab).

### D. Contact form wiring

`contact.html`'s form currently does nothing. Wire it to POST to a small server route that inserts into `contact_messages` (table + admin already exist). Success/error states are shown inline; no visual redesign.

### E. FAQs

FAQs table + admin already exist but aren't rendered. Add an FAQ block to About and Contact pages (hydrated into an existing accordion container if present; otherwise added as a `page_sections` block whose renderer emits the same markup the theme already styles).

---

## Part 3 — CMS improvements (visual changes allowed here only)

- Rebuild `/admin/settings` into grouped tabs (Branding / Hero / Contact & Social / Google Reviews / Footer / SEO), image pickers for URL fields, phone/email validation.
- New `/admin/page-sections` screen: pick a page → see its blocks in order → edit inline (title, body, image, list items via a small repeater). Blocks are pre-seeded so the user sees exactly what's on the live page and can just edit text.
- New `/admin/menus/$slug` item editor (drag to reorder, add/remove).
- Every admin form gains an "Open live page" button that opens the corresponding public URL with `?preview=1`.
- Dashboard shows a "Last edited" list and a "View site" link.

---

## Non-goals

- No visual/CSS changes to the public site.
- No new e-commerce backend (shop items are simple editable cards).
- No blog rich-text WYSIWYG beyond a textarea (basic HTML allowed); can be upgraded later.
- No auth/role changes.

---

## Technical details

**Migrations (one migration):**
- `site_settings`: upsert seed rows for every new key above using values pulled from current HTML.
- `menus` + `menu_items`: seed `main`, `footer_quick_links`, `footer_services` with current links.
- `page_sections`: seed one row per block listed in Part 2B, with current copy/images.
- `content_version` row in `site_settings`.
- Postgres trigger on the listed content tables: `AFTER INSERT/UPDATE/DELETE` → `UPDATE site_settings SET value = extract(epoch from now())::text WHERE key = 'content_version'`.
- All grants already in place; only add `GRANT SELECT ... TO anon` on `menu_items` and confirm on `page_sections`.

**Hydration layer (`src/lib/legacy-hydrate.server.ts`):**
- Replace 30s TTL with a version-keyed cache; cache key = `${page}:${content_version}`. Fetch `content_version` fresh on each request (single tiny query).
- New helpers: `applyGlobals(root, ctx)` — hero, header logo, loading overlay, footer tagline/copyright/credit, WhatsApp/phone/map buttons, google-review widget. `applyMenu(root, sel, menuSlug)` — replace nav `<ul>` contents.
- Per-page hydrators grow to iterate `page_sections` rows for that slug and route each `section_key` to the correct selector via a small `section_key → selector + renderer` map per page. Missing rows fall back to the current hardcoded HTML (safety net).
- Response headers: `Cache-Control: no-store`.
- New file `src/routes/api/public/contact.ts`: POST, Zod-validated, inserts into `contact_messages` via publishable client.

**Admin (`src/routes/_authenticated/`):**
- Rewrite `admin.settings.tsx` with tabs and grouped keys.
- New `admin.page-sections.tsx` with a page picker + per-block editor (uses existing `ResourceManager`-style patterns where possible, custom repeater for list-type blocks).
- New `admin.menus.$slug.tsx` for menu item editing.
- Add "Open live page" buttons and cache-version indicator ("Live cache: 5s").

**Public site files:** untouched except that the existing hardcoded strings/images serve as the default fallbacks and as the seed data source. No CSS/JS/markup edits.

---

## Deliverable order

1. Migration (schema + seeds + trigger).
2. Hydration layer upgrade (version cache, globals, menus, page_sections renderers).
3. Contact form endpoint.
4. Admin: rebuilt Settings, new Page sections, new Menu items editor.
5. Manual walk-through: edit one field per page in CMS, confirm it appears on the live page within ~1s.
