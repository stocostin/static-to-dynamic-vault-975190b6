# Shareable product & project pages with rich link previews

Right now `/shop` and `/portfolio` are single list pages, so a shared link only ever previews the whole list. This plan adds real detail pages per item and wires up per-item Open Graph / Twitter / JSON-LD meta tags so links show the item's image, description, and (for products) price.

## New routes

- `src/routes/shop.$slug.tsx` → `/shop/<slug>`
- `src/routes/portfolio.$slug.tsx` → `/portfolio/<slug>`

Each is a TanStack Start route with:
- A loader that fetches the row from Supabase by `slug` (publishable-key client, `is_published = true`) and throws `notFound()` on miss.
- A `head()` returning per-item meta from loader data (see below).
- A simple, on-brand detail component (hero image, title, category/location or price, description, gallery, back link + CTA — "Request a quote" on portfolio, "Get in touch" / WhatsApp on shop). Styling follows the existing legacy site look via shared classes and images from the same `image_url` / `cover_image_url` / `images` fields.

## Meta tags per item

For each detail page, `head()` returns:

- `title` — `"{item.title} — Shachavir Timber Limited"` (uses `seo_title` if present)
- `description` — `meta_description` if set, else the first ~160 chars of `description`; for products the price is appended: `"… — KSh 12,500"`
- `og:title`, `og:description`, `og:type` (`product` for shop, `article` for portfolio)
- `og:url` and canonical `<link>` pointing at the item's own path
- `og:image` + `twitter:image` — absolute URL built from the request origin plus `image_url` / `cover_image_url` (fallback to first entry in `images[]`); tag is omitted when no image exists so hosting can inject the default preview
- `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`
- Product-only: `product:price:amount`, `product:price:currency`, `og:availability` (in stock / out of stock)
- JSON-LD via `scripts`:
  - Shop → `Product` with `name`, `image`, `description`, `offers { price, priceCurrency, availability }`
  - Portfolio → `CreativeWork` with `name`, `image`, `description`, optional `locationCreated` and `dateCreated`

Absolute URLs come from a small `getRequestOrigin` server fn that reads the incoming `Host` + `x-forwarded-proto` headers, so image URLs stay correct across preview, published, and custom domains without hard-coding a host.

## Link the new detail pages in

- In `src/lib/legacy-hydrate.server.ts`, when rendering shop cards and portfolio cards, wrap each card's title / image with an `href="/shop/<slug>"` or `href="/portfolio/<slug>"` link. Existing card markup and styling stay identical; only the anchor targets change.
- Add "View details" affordances where the current cards don't already have a clickable header.

## List pages (light polish, not full detail pages)

While in the hydrator, ensure `/shop` and `/portfolio` themselves get sensible list-level `og:image` (first featured item's image) and descriptions, using the same absolute-URL helper. This keeps shares of the list URLs looking good too.

## Sitemap

Extend `public/sitemap.xml` generation… actually `public/sitemap.xml` is static today. I'll leave it as-is for this change and note it as a follow-up — no code churn for a follow-on unless you ask.

## Notes on caching

Social platforms (WhatsApp, Facebook, LinkedIn, X) cache previews. After deploying, an already-shared link keeps showing the old preview until the platform re-scrapes. I'll flag this in the reply and mention the debuggers (FB Sharing Debugger, LinkedIn Post Inspector, X Card Validator) for a forced refresh.

## Files touched

- New: `src/routes/shop.$slug.tsx`, `src/routes/portfolio.$slug.tsx`
- New: `src/lib/request-origin.functions.ts` (tiny server fn returning `${proto}://${host}`)
- Edited: `src/lib/legacy-hydrate.server.ts` (link cards to detail pages, list-page og:image fallback)
- No DB migration, no auth changes, no changes to admin CMS — all data already exists on `shop_products` and `portfolio_projects`.

## Verification

- `curl -s http://localhost:8080/shop/<known-slug> | grep -E 'og:|twitter:|application/ld\+json'` shows the per-item tags.
- Same for `/portfolio/<known-slug>`.
- Visit the pages in the preview to confirm they render and the "back to shop / portfolio" link works.
