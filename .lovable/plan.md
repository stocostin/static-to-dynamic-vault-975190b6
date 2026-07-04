
# Static → CMS Migration Plan

Goal: your existing HTML/CSS/JS becomes React route components in TanStack Start with **zero visual change**. All text/images/menus/products/posts are read from Lovable Cloud (Supabase) and edited via an admin CMS. Empty schema at launch — you populate it.

Given the enormous scope (Core + Blog + Shop + Advanced admin), this is delivered in **4 sequential phases**. Each phase is shippable. You approve one plan; I execute Phase 1 first, then we iterate.

---

## Design preservation strategy (applies to all phases)

- Original `assets/css/style.css` (2117 lines) and `shop.css` copied verbatim into `src/styles.css` (below the Tailwind import) — untouched.
- Original `main.js` and `shop.js` copied verbatim into `public/legacy/` and loaded via a `<script>` tag in `__root.tsx`. No rewrite into React idioms.
- Each `.html` page becomes a route component whose JSX mirrors the original DOM 1:1 — same tags, same classes, same IDs, same order. Only difference: hardcoded strings/URLs are replaced with `{data.field}` reads from Cloud.
- Same nav markup in `__root.tsx` for header/footer; page routes render the middle.
- Fonts, icons, favicon: kept as `<link>` tags in the root head exactly as in the originals.

Verification per page: I open the original HTML and the new route side-by-side in Playwright at desktop + mobile widths and diff screenshots before marking a page done.

---

## Phase 1 — Foundation + public pages (this approval)

Scope:
1. Enable Lovable Cloud.
2. Copy `style.css`, `shop.css`, `main.js`, `shop.js` into the project untouched. Wire them in `__root.tsx`.
3. Create routes matching the original files:
   - `/` (index.html), `/about`, `/services`, `/portfolio`, `/blog`, `/shop`, `/contact`, `/cms` (kept for reference, will be replaced by real admin in Phase 3).
   - Each route file mirrors original DOM exactly with placeholder-safe reads from Cloud.
4. Global CMS tables (all with RLS + admin-only write, public read):
   - `site_settings` (logo, business name, contact info, social links, footer copy, analytics IDs, favicon)
   - `pages` (slug, seo_title, meta_description, og_image, published)
   - `page_sections` (page_id, key, content_json) — the flexible bag every route reads from
   - `menus` + `menu_items` (header/footer nav)
   - `services`, `portfolio_projects`, `testimonials`, `team_members`, `faqs`
   - `contact_messages` (writable by anon, readable admin-only)
   - `media_assets` (Supabase Storage pointers)
5. Storage buckets: `public-media` (public), `admin-uploads` (private).
6. Auth: email/password + Google. `_authenticated/route.tsx` gates admin.
7. `user_roles` table + `has_role()` RPC. First-signup-becomes-admin bootstrap trigger (documented, one-shot).
8. Head metadata per route reading from `pages` table.
9. Sitemap + robots.

Deliverable: public site renders identically to your HTML, but every string comes from Cloud. Contact form persists submissions. Admin doesn't exist yet — content is inserted via a temporary seed script or Cloud table editor.

---

## Phase 2 — Admin CMS core

Scope (built as protected routes under `/admin`):
- Login (reuses Supabase auth).
- Dashboard: submission count, recent activity, quick links.
- Sidebar shell with dark-mode toggle, profile menu.
- CRUD screens for: Pages, Sections, Services, Portfolio, Testimonials, Team, FAQs, Menus, Global Settings.
- Media Library: upload/browse/delete, image preview, folder-ish tagging, bulk delete.
- Contact Messages: list, filter, mark read, delete, export CSV.
- Profile: change password, edit name/avatar.
- Rich text editor (TipTap) for long-form fields.

---

## Phase 3 — Blog

Scope:
- Tables: `blog_posts`, `blog_categories`, `blog_tags`, `blog_post_tags`, `blog_comments`.
- Public routes: `/blog` (list, paginated, category/tag filter, search), `/blog/$slug` (post with SEO head from row).
- Admin: post CRUD, draft/publish/schedule, featured image, categories/tags, SEO fields, comment moderation.
- RSS feed + sitemap entries per published post.

---

## Phase 4 — Shop + Advanced admin

Shop scope:
- Tables: `products`, `product_variants`, `product_images`, `product_categories`, `orders`, `order_items`, `carts`.
- Public: `/shop` list, `/shop/$slug` detail — DOM cloned from your `shop.html`. Cart in localStorage + persisted for logged-in users.
- Checkout: **requires a payment provider decision** — I'll ask before starting Phase 4 (Stripe vs Paddle vs Shopify per Lovable payments flow).
- Admin: product CRUD, inventory, orders, order-status workflow.

Advanced admin scope:
- Roles + permissions matrix (extends `user_roles`).
- Activity logs (audit table + trigger on writes).
- 2FA (Supabase TOTP factors).
- Session management (list/revoke).
- Page duplication, soft-delete + restore, drafts.
- Redirects table + middleware.
- Newsletter subscribers + basic broadcast (via Lovable Email once enabled).

---

## Technical notes

- Stack: TanStack Start (React 19, Vite 7), Lovable Cloud (Supabase), Tailwind v4 for admin only. Public pages use your original CSS untouched.
- Data reads on public routes: `createServerFn` (publishable-key client) called from route loaders via `queryClient.ensureQueryData`, so first paint has real content and SEO works.
- Admin writes: `createServerFn` + `requireSupabaseAuth` + `has_role('admin')` check.
- Zero pixel diff enforcement: every public route change ends with a Playwright screenshot comparison vs the original HTML file served from `/tmp`.
- No redesign, no Tailwind classes added to public-facing markup, no shadcn components on the public site.

---

## What I need from you to start Phase 1

Just approve this plan. I'll then:
1. Enable Cloud.
2. Copy your CSS/JS assets in verbatim.
3. Build the 8 public routes as 1:1 clones of your HTML, wired to (empty) Cloud tables.
4. Ship the schema + storage + auth scaffolding.

Phases 2–4 are separate approvals — I won't start them until Phase 1 is verified.
