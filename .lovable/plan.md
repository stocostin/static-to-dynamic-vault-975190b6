
Two-part fix. All work is scoped to the legacy HTML files, `legacy-hydrate.server.ts`, and a small data migration — no route/router changes.

## 1. Fix stale `.html` internal links

Audit results from the live site:

- **Homepage** — no `.html` hrefs in served HTML. The "View Full Portfolio" button already points to `/portfolio`. What's confusing: `/portfolio` itself is a legacy-styled page (served from `src/legacy/portfolio.html` via `hydratePortfolio`). It IS the new site — the visual style is just carried over from the old design. I'll surface this in the reply so we're aligned.
- **`/services`** — contains `href="contact.html"` (comes from CMS `services.cta_url` for one service block). Real bug.
- **JSON-LD schema URLs** in `src/legacy/blog.html`, `portfolio.html`, `services.html`, `shop.html` still reference `https://shachavirtimberltd.com/xxx.html`. SEO-visible bug.
- **`src/legacy/cms.html`** contains `value="shop.html"` in an admin-only form — ignore, admin CMS is legacy and unused.

Changes:

1. **Data migration** (`supabase/migrations/…_fix_legacy_html_links.sql`) — rewrite any CMS-stored URL matching `^(/)?(about|services|portfolio|shop|blog|contact|index)\.html(#.*)?$` to `/$2$3` across `public.services.cta_url` and `public.page_sections.content` (JSON — targeted `jsonb_set` on known button/CTA keys, plus a broad `regexp_replace` on the serialized JSON as a safety net).
2. **Defensive rewrite in `postProcess`** (`src/lib/legacy-hydrate.server.ts`) — one regex pass converting `href="…(about|services|portfolio|shop|blog|contact|index).html(#…)?"` to `href="/$1$2"`. Catches any future stray link from CMS or legacy source without touching individual files.
3. **Static JSON-LD fix** — edit `src/legacy/{blog,portfolio,services,shop}.html`: change the schema `"url"` from `https://shachavirtimberltd.com/xxx.html` to `https://shachavirtimberltd.com/xxx`.

## 2. Raise Lighthouse performance from 68 → ~99

Current metrics: FCP 3.9s, LCP 4.8s, Speed Index 6.9s. Root causes:
- Two Google Fonts stylesheets and Font Awesome CDN CSS are **render-blocking**.
- Hero background is set by JS *after* load — LCP image is discovered late.
- `assets/js/main.js` is a blocking `<script>` at the end of body.
- No `loading="lazy"` / `decoding="async"` on below-fold images.

Edits to `src/legacy/index.html` (and mirror the same pattern in `about.html`, `services.html`, `portfolio.html`, `shop.html`, `blog.html`, `contact.html`):

1. **Non-blocking external CSS** — replace each `<link rel="stylesheet" href="…google fonts…">` and the Font Awesome `<link>` with:
   ```html
   <link rel="stylesheet" href="…" media="print" onload="this.media='all'">
   <noscript><link rel="stylesheet" href="…"></noscript>
   ```
   Keep the existing `preconnect` hints.
2. **Preload the LCP hero image** on the homepage — add in `<head>`:
   ```html
   <link rel="preload" as="image" href="assets/images/hero-bg.jpg" fetchpriority="high">
   ```
   And in the inline hero-rotation script, set the first background *synchronously* on script parse (before the `setInterval`) instead of waiting for the first interval tick.
3. **Defer JS** — add `defer` to `<script src="assets/js/main.js">` and to the inline hero-rotation script's `<script>` tag (move it to `<head>` with `defer` so parsing isn't blocked by body-end scripts).
4. **Image loading hints** — on the three "featured project" images and QR-code image, add `loading="lazy" decoding="async"`. On the hero logo in the loading overlay, add `fetchpriority="high"`.
5. **Move the Dancing Script `<link>`** out of `<div id="loading-overlay">` (invalid — `<link>` inside body) into `<head>` with the same non-blocking pattern.

No CMS/component/business-logic changes. No dependency changes.

## Technical notes

- Migration uses `UPDATE … SET content = regexp_replace(content::text, …)::jsonb WHERE content::text ~ '…\.html'` for `page_sections`, plus targeted `UPDATE public.services SET cta_url = regexp_replace(cta_url, …)`.
- The `postProcess` regex must skip absolute external `.html` URLs (only match paths, not `https://other.example.com/foo.html`).
- Font Awesome via `media=print/onload` swap is the standard Lighthouse-approved "eliminate render-blocking resources" fix; icons flash-in ~200 ms later but the whole page paints immediately.
- Preloading `hero-bg.jpg` + setting it synchronously typically drops LCP by 2–3s on a slow connection.

## Verification

1. Publish, then run Lighthouse on `https://shachavirtimberltd.com` (mobile). Expect Performance ≥ 95 (targeting 99). Confirm FCP < 1.8s and LCP < 2.5s.
2. `curl -s https://shachavirtimberltd.com/services | grep -o 'href="[^"]*\.html[^"]*"'` returns empty.
3. `curl -s https://shachavirtimberltd.com/services | grep -o 'href="[^"]*contact[^"]*"'` shows `/contact`, not `contact.html`.
4. Click "View Full Portfolio" from `/` → lands on `/portfolio` and page renders (already works, re-verify).
5. Headless-browser check confirms hero image is visible on first paint.
