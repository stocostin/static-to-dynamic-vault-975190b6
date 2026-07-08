## Why link previews are broken

WhatsApp and Facebook won't render a preview when `og:url` and `<link rel="canonical">` are **relative** paths (`/shop/foo`) — they need absolute `https://…` URLs. Right now:

- **TanStack routes** (product, portfolio, root): use relative `/…` for `og:url` and canonical.
- **Home page** (legacy HTML): `og:url` still points to `…/index.html` and canonical is relative `/`.
- **Blog, About, Services, Contact, Portfolio list, Shop list**: no per-page `head()` at all — everything falls back to the root's generic tags, so all these pages share one preview.

The result is either no preview, or the same generic preview on every page.

## Plan

### 1. Fix OG tags site-wide

- Add a shared constant `SITE_URL = "https://shachavirtimberltd.com"` (in `src/lib/site.ts`).
- Update each TanStack route's `head()` so `og:url` and `<link rel="canonical">` use the **absolute self URL** built from `SITE_URL + path`:
  - `src/routes/shop.$slug.tsx`
  - `src/routes/portfolio.$slug.tsx`
  - `src/routes/__root.tsx` (fix `og:url: "/"` → absolute home URL; keep the current `og:image` as a sitewide fallback)
- Add proper `head()` blocks (title, description, og:title/description/url/type, canonical, twitter:card) to the list/static routes that currently have none:
  - `src/routes/blog.tsx`, `src/routes/shop.tsx`, `src/routes/portfolio.tsx`, `src/routes/about.tsx`, `src/routes/services.tsx`, `src/routes/contact.tsx`
- Home page (`src/legacy/index.html`): change `og:url` from `…/index.html` to `https://shachavirtimberltd.com/`, and change `<link rel="canonical" href="/">` to the absolute home URL.

No content or design changes — only meta tags.

### 2. Add share buttons to product pages

Create `src/components/ShareButtons.tsx` with four buttons:

- **WhatsApp** — `https://wa.me/?text=<title>%20<url>`
- **Facebook** — `https://www.facebook.com/sharer/sharer.php?u=<url>`
- **X (Twitter)** — `https://twitter.com/intent/tweet?url=<url>&text=<title>`
- **Copy link + native share** — one button that calls `navigator.share({ title, url })` on devices that support it (mobile), and falls back to copying the URL to the clipboard with a toast confirmation on desktop.

Buttons render as compact icon buttons using existing shadcn/lucide styling, placed just under the price/stock line in `src/routes/shop.$slug.tsx`.

The share URL is built from `SITE_URL + /shop/<slug>` so it's always the canonical public link, regardless of which host the visitor is currently on (preview, published, custom domain).

### 3. Heads-up on preview caches

WhatsApp and Facebook aggressively cache the first preview they scrape. After these changes ship, previews on already-shared links won't refresh on their own. To force a refresh:

- Facebook / WhatsApp: paste the URL into [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) → **Scrape Again**.
- X: paste into [Twitter Card Validator](https://cards-dev.twitter.com/validator).

## Technical details

- `SITE_URL` is a plain constant, not read from headers — that keeps meta stable across SSR and social crawlers regardless of which host served the request. The custom domain is already the canonical public host, and the sitemap / knowledge already assumes it.
- No database or RLS changes.
- No changes to admin UI, chat, PDF, or business logic.
