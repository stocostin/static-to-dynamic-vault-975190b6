# Point the site at shachavirtimber.com

## What's actually happening

Both `shachavirtimber.com` and `www.shachavirtimber.com` are correctly connected: DNS resolves to Lovable (185.158.133.1), `www` redirects to the root domain, and the root domain returns the live site with HTTP 200. So the domain itself is working — if it looks blank for you, that's browser/DNS cache on your device (hard refresh, or try a different network/incognito).

The real problem is inside the site: every canonical URL, `og:url`, JSON-LD identifier, and the sitemap reference point to `shachavirtimberltd.com` — a different domain that does not resolve to this site at all. Crawlers, link previews (WhatsApp, Facebook, X), and Google Search Console are all being told the site lives at an address that doesn't respond, so shares look broken and search indexing gets attributed to a dead URL.

## The fix

Replace the old domain with `https://shachavirtimber.com` everywhere it is hardcoded:

- `src/lib/site.ts` — the single `SITE_URL` constant used for absolute URLs.
- `src/routes/__root.tsx` — Organization/WebSite JSON-LD `@id`, `url`, and `logo` values.
- `src/lib/legacy-hydrate.server.ts` — the server-side `SITE_URL` used to inject canonical, `og:url`, and Article JSON-LD into the legacy pages.
- `src/routes/sitemap[.]xml.ts` — the base URL for every generated `<loc>`.
- `public/robots.txt` — the `Sitemap:` directive.
- `src/legacy/*.html` (index, about, services, portfolio, shop, blog, contact, cms) — static `og:url`, `og:image`, canonical, and any absolute asset links.

No layout, styling, or content changes.

## After the change

- Publish so the corrected URLs go live.
- Re-verify in Google Search Console using `shachavirtimber.com` as the property, and resubmit `https://shachavirtimber.com/sitemap.xml`. The existing verification meta tag stays in place and keeps working.
- Social platforms cache previews, so shared links may keep showing the old preview until they re-scrape; you can force this in Facebook's or X's link preview debugger.
