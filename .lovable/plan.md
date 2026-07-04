# Goal

Kill the temporary "Legacy images" section and stop serving `src/legacy/*.html` verbatim. Every public page (Home, About, Services, Portfolio, Blog, Contact, Shop) becomes a normal React route that reads its content — text, images, lists — from the backend, and every piece of that content is editable from the CMS.

The database schema for this already exists (`pages`, `page_sections`, `services`, `portfolio_projects`, `testimonials`, `team_members`, `faqs`, `menus`, `site_settings`, `media_assets`). We reuse it instead of adding new tables.

# What gets removed

- `src/routes/_authenticated/admin.legacy-images.tsx` (admin uploader)
- `src/routes/assets.images.$.tsx` (storage passthrough at `/assets/images/*`)
- `src/lib/legacy-images.ts` (manifest + helpers)
- "Legacy images (temp)" nav item in `AdminShell.tsx`
- All eight `src/legacy/*.html` files
- The `?raw` HTML-serving handlers in `src/routes/{index,about,services,portfolio,blog,contact,shop}.tsx`
- Any leftover objects under `admin-uploads/legacy/…` (cleanup insert)

Public image URLs still shaped `/assets/images/…` won't exist anymore; new pages reference images through `media_assets` public URLs (Supabase Storage `media` bucket, see below).

# What gets built

## 1. Media bucket + editor upload

- New **public** storage bucket `media` (with public SELECT policy), used by all site imagery.
- Extend `admin.media.tsx` to upload directly into `media` and register a row in `media_assets` with the returned public URL. Existing `media_assets` schema is reused.
- One-time seeding step: for each legacy image referenced by the HTML, upload the file that was already put into `admin-uploads/legacy/assets/images/*` into the new `media` bucket at a clean path, insert a `media_assets` row, and record the resulting URL in a lookup used by the content seed (step 4). This is a manual migration the admin runs once via a new "Import legacy images" button on the Media page (temporary, single-use), then the old bucket contents are dropped.

## 2. Public route rewrite

Each page becomes a real React route that loads its content via `createServerFn` (publishable-key server client, narrow `TO anon` SELECT) and renders it with shared components. Existing styling from `public/assets/css/style.css` is kept and imported once from `__root.tsx` so the current visual design is preserved.

Routes:

- `/` — Home: hero, intro, featured services, featured portfolio, testimonials, CTA. Reads from `pages` (`slug='home'`) + `page_sections` + top-N `services`, `portfolio_projects`, `testimonials`.
- `/about` — Story, values, team. Reads `pages`+`page_sections` for slug `about` and full `team_members` list.
- `/services` — Full `services` list, ordered.
- `/portfolio` — `portfolio_projects` grid with category filter (client-side).
- `/blog` — `pages` rows tagged as blog posts (see step 3).
- `/contact` — Contact info from `site_settings`, form posts to `contact_messages` via a `createServerFn`; existing FAQs list rendered underneath.
- `/shop` — Product cards from `portfolio_projects` filtered to shop-eligible items (reuses existing table via a `for_sale` flag, added in the migration in step 3).

Shared building blocks (new):

- `src/components/site/SiteHeader.tsx`, `SiteFooter.tsx`, `SiteShell.tsx` — driven by `menus` + `menu_items` + `site_settings` (logo, socials, contact).
- `src/components/site/PageSection.tsx` — renders a `page_sections` row by its `kind` (hero, text, image-grid, cta, etc.).

Every route defines `head()` (title, description, canonical, og/twitter) pulled from `pages.meta_*` columns, and `errorComponent` + `notFoundComponent`.

## 3. Small schema additions (one migration)

Additive only, so the CMS UI for these already-existing tables keeps working.

- `pages`: add `kind text not null default 'page'` (values `page`, `post`) so `/blog` can pull posts. Add `hero_image_url text`, `excerpt text`, `published_at timestamptz` if not present.
- `portfolio_projects`: add `for_sale boolean not null default false`, `price_cents int`, `currency text default 'KES'` so `/shop` can reuse it.
- `page_sections`: ensure `kind text`, `sort_order int`, `data jsonb` exist (already do per schema summary — verified when writing the migration).
- Ensure `TO anon` SELECT policies exist on the columns each public route reads.

## 4. Content seed

One `supabase--insert` batch that populates:

- `pages` rows for `home`, `about`, `services`, `portfolio`, `blog`, `contact`, `shop` with meta + hero.
- `page_sections` rows containing the copy currently baked into each legacy HTML file (headings, paragraphs, feature bullets).
- `services` (Doors, Frames, Staircases, Furniture, …) with descriptions + image URLs from step 1.
- `portfolio_projects` for every project currently pictured (`custom19`, `door1`, `staircase1`, `furniture1`, …), with `for_sale` on the ones the shop page currently lists.
- `team_members` for the 3 team cards in `about.html`.
- `testimonials` for the current testimonial block on the home page.
- `faqs` for the FAQ block on `contact.html`.
- `menus` + `menu_items` for the primary nav and footer nav.
- `site_settings` for logo URL, tagline, phone, email, address, socials, GA ID.

All image URLs come from the `media_assets` rows created in step 1 so nothing depends on the old `/assets/images/*` route.

## 5. CMS UX touch-ups

- `admin.pages.tsx`: add a nested editor for that page's `page_sections` (add/remove/reorder/edit `data` fields per `kind`).
- `admin.media.tsx`: switch upload target to the new `media` bucket + include the one-time "Import legacy images" button described in step 1; remove it after the user confirms the migration is done.
- `AdminShell.tsx` nav: drop "Legacy images (temp)". No other nav changes.

# Technical section

- Data fetching: `createServerFn` per page reading through a server-side publishable-key client (`SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`) with explicit column projection. `TO anon` SELECT policies scoped to published rows only. Loader primes via `queryClient.ensureQueryData`; component uses `useSuspenseQuery`. All routes SSR-on for shareable OG tags.
- Mutations (contact form): `createServerFn` with Zod validation writing to `contact_messages`. No auth required (public form) but rate-limit by IP header + honeypot field.
- Admin mutations continue using the browser Supabase client under `_authenticated/`.
- Cleanup migration at the end: drop legacy objects from `admin-uploads`, remove `legacy/` prefix helpers. `admin-uploads` bucket itself is kept for other admin uploads.
- Styling: keep `public/assets/css/style.css` as-is and load it globally from `__root.tsx` so the visual design carries over 1:1 while markup is React.

# Order of operations

1. Migration: schema additions + `media` public bucket + policies.
2. New media upload flow + one-time legacy-image importer button.
3. Content seed insert.
4. New public routes + shared site shell + header/footer driven by CMS.
5. Admin page-sections editor.
6. Delete legacy HTML files, `legacy-images` route/page/lib, `/assets/images/$` route, remove nav entry.
7. Verify each public route renders with seeded data and that editing in the CMS updates the live site.

# Open questions

1. Should `/blog` be built now from `pages` (kind=`post`), or left as a "coming soon" stub since the current legacy blog is mostly placeholder articles?
2. For `/shop`, is reusing `portfolio_projects` + `for_sale` acceptable, or do you want a dedicated `products` table (with variants, stock, etc.)?
