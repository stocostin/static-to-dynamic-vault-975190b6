# Move hardcoded page content to the database

Goal: the public pages look pixel-identical, but the repeatable content (services, portfolio items, testimonials, team, FAQs, blog posts, footer contact info, site meta) is read from the existing CMS tables and edited from `/admin/*`.

## Approach

Each public route currently returns the raw legacy HTML string verbatim. We introduce a **server-side hydration step**: on every request, the route handler loads the relevant rows from the database and rewrites specific marked regions of the HTML, then returns the result. Markup, classes, scripts, and CSS stay byte-identical — only the inner content of a few known blocks changes.

Two mechanisms, used together:

1. **List regions** (services grid, portfolio grid, testimonials, team, FAQs, blog posts) — the first existing card in each list is treated as a template. We clone/replace that card's inner text/image/link with each DB row, keeping identical wrapper classes so existing CSS + JS filters/sliders keep working.
2. **Singleton fields** (footer contact block, topbar phone/email, footer social links, footer "about" blurb, page `<title>` / meta description) — replaced by matching a stable selector once.

Parsing is done with `node-html-parser` (Worker-safe, no native deps). One shared helper module owns all transforms so each route file stays a thin wrapper.

If a DB table is empty for a section, the original hardcoded markup is left untouched — so the site never goes blank while content is being migrated.

## What maps where

| Legacy region | Source table | Editable at |
| --- | --- | --- |
| Services grid on `/` and `/services` | `services` (published, sorted) | `/admin/services` |
| Portfolio grid + filter chips on `/portfolio` and previews on `/` | `portfolio_projects` | `/admin/portfolio` |
| Testimonials slider on `/`, `/portfolio`, `/services` | `testimonials` (published) | `/admin/testimonials` |
| Team grid on `/about` | `team_members` (published) | `/admin/team` |
| FAQ accordion (where present) | `faqs` (published) | `/admin/faqs` |
| Blog list on `/blog` and "latest" on `/` | `page_sections` of type `blog_post` (see below) | `/admin/pages` sections |
| Footer contact block + topbar phone/email + social links (every page) | `site_settings` keys already defined | `/admin/settings` |
| `<title>` and `<meta name="description">` per page | `pages` row matched by slug | `/admin/pages` |

Blog posts are not in the current schema. In this phase we reuse the `page_sections` table (already present) with a `section_type = 'blog_post'` convention to avoid a schema change; a proper `blog_posts` table can come in a follow-up.

## Seeding (one-time)

To avoid the empty-DB "site looks blank" case, we insert the values currently hardcoded in the legacy HTML into the corresponding tables the first time each region is migrated. This is a data insert, not a schema change, and is done through the insert tool so it is reviewable.

## Data grants

The public routes render server-side without a signed-in user. Add narrow `TO anon` `SELECT` policies (published rows only, safe columns) on `services`, `portfolio_projects`, `testimonials`, `team_members`, `faqs`, `site_settings`, `pages`, and `page_sections` if they are not already present. Everything read on the public site is already meant to be public.

## Files

- `src/lib/legacy-hydrate.server.ts` (new) — loads CMS data with the server publishable client and exposes one `hydrate<Page>(html)` per page.
- `src/lib/legacy-templating.ts` (new) — small helpers: `renderListRegion(root, selector, rows, mapRow)`, `setText(root, selector, value)`, `setAttr(...)`, `setMeta(...)`.
- `src/routes/index.tsx`, `about.tsx`, `services.tsx`, `portfolio.tsx`, `contact.tsx`, `blog.tsx`, `shop.tsx` — call the matching hydrate function before returning `Response`. No markup changes.
- Migration: add `TO anon` SELECT policies (only for tables missing them) filtered to `is_published = true`.
- Insert tool call: seed the tables with the current hardcoded values so the live site is unchanged after switching.

## Non-goals

- No visual redesign, no CSS changes, no new admin pages (the existing CMS screens already cover every table).
- No new `blog_posts` schema in this pass — reuses `page_sections`.
- Contact form submission wiring is out of scope for this change (only the displayed contact info moves to DB).

## Technical notes

- `node-html-parser` is added via `bun add node-html-parser`; it works in the Cloudflare Worker runtime.
- Hydration runs per-request; a short in-memory cache (30s) keyed by page slug avoids hammering the DB.
- Reads use a server-local `createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)` — no service role, no browser client on the server.
