### 1. OG images not appearing on shareable pages

Root cause: `src/routes/__root.tsx` sets a site-wide `og:image`. TanStack Router's root `head()` concatenates into every route match and overrides each leaf route's own `og:image` (product/portfolio hero images). So shared links never use the page-specific image.

Fix: Remove `og:image` from `__root.tsx`. Leaf routes (`shop.$slug.tsx`, `portfolio.$slug.tsx`) already set their own product image; other pages will get the hosting default preview.

### 2. PDF notes bullets render as "?"

Root cause: `renderDocument.ts` uses `• ${line}` (U+2022). The `safe()` sanitizer strips anything above 0xFF, so the bullet is removed and pdf-lib renders `?` as fallback.

Fix: In `safe()`, normalize common typographic characters to ASCII before the strip pass:
- `•` → `-`
- `–` `—` → `-`
- `"` `"` → `"`
- `'` `'` → `'`

Bullets, dashes, and curly quotes anywhere in notes / bank details / descriptions will now render cleanly.

### Files

- `src/routes/__root.tsx` — remove the `og:image` meta entry.
- `src/lib/pdf/renderDocument.ts` — extend `safe()` with an ASCII normalization pass.

### Follow-up for the user

WhatsApp and Facebook cache the first preview they scrape. After redeploy, paste each URL into the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and click **Scrape Again** to refresh — WhatsApp reads from Facebook's cache.
