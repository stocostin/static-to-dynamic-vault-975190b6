# Goal

Take the mobile Lighthouse report from **76 / 91 / 96 / 92 / 2-of-3** to **100 / 100 / 100 / 100 / 3-of-3** on `https://shachavirtimberltd.com/`.

The site is server-rendered from `src/legacy/*.html` via `src/lib/legacy-hydrate.server.ts`, so most fixes land in those two places.

> Note: Lighthouse only re-scores after the site is **published**. All work below has to ship in a publish to move the numbers.

---

## 1. Performance (76 → 100)

Current pain points from the report: FCP 3.0s, LCP 4.5s, Speed Index 5.0s. Root causes on the current page: a full-viewport loading overlay, three preloaded remote stylesheets that block first paint, an unoptimized hero JPG with a 3-image rotator, and FontAwesome loaded up-front for a few icons.

Changes:
1. **Kill the loading overlay's paint block.** Remove the JS-driven "Welcome to:" overlay from the critical path — either drop it entirely or fade it in only after `load` so FCP fires on real content, not a spinner.
2. **Inline critical CSS.** Extract the ~4KB of above-the-fold rules (nav, hero, hero text, CTA) into a `<style>` block in `<head>`, and load `assets/css/style.css` with `media="print" onload="this.media='all'"` so it becomes non-blocking.
3. **Optimize the hero image.** Generate AVIF + WebP variants of `hero-bg.jpg` at 3 widths (768 / 1280 / 1920), serve via `<picture>` with `fetchpriority="high"` and explicit `width`/`height`. Drop the JS background-image swap; make hero-bg1 a real `<img>` (the LCP element) instead of a CSS background.
4. **Delay the hero rotator.** Move it behind `requestIdleCallback` (or after `load`) so the two extra images don't compete with LCP.
5. **Font strategy.** Self-host Merriweather (400/700) + Open Sans (400/600) + Dancing Script (700) as subset WOFF2 in `src/legacy/assets/fonts/`, drop the two Google Fonts stylesheets, and use `@font-face` with `font-display: swap`. Eliminates 2 render-blocking round-trips to `fonts.googleapis.com`.
6. **Defer FontAwesome.** Replace the ~5 above-the-fold icons (menu, WhatsApp, back-to-top) with inline SVG. Load the FA stylesheet with the same non-blocking `media="print"` trick, or drop FA entirely and use inline SVGs for the remaining icons.
7. **Compress remaining images.** Re-encode all `assets/images/*.jpg|png` (portfolio thumbnails, product tiles) to AVIF/WebP with explicit width/height and `loading="lazy"` below the fold. Legacy pages already got partial treatment; finish it on `index.html`, `shop.html`, `portfolio.html`, `blog.html`.
8. **Trim JS.** `assets/js/main.js` runs on every page; audit for unused sliders/carousels and gate to pages that need them.

Target: LCP ≤ 2.5s, FCP ≤ 1.8s, SI ≤ 3.4s → 100.

## 2. Accessibility (91 → 100)

Likely deductions: low-contrast body text, icon-only anchors without accessible names, and missing labels on the "Message Us" / "Shop With Us" buttons if wrapped inline. To fix:
- Bump muted text tokens to WCAG AA (≥ 4.5:1). Concrete: darken the "Why Choose…" paragraph color and the footer text.
- Add `aria-label` to the mobile menu toggle, back-to-top link, and every social-icon `<a>` in the footer.
- Add a visually-hidden `<h1>` on pages where the visible headline is inside a decorative wrapper.
- Ensure the loading overlay (if kept) uses `role="status"` and `aria-live="polite"`, and is `aria-hidden` once removed.
- Add a "Skip to main content" link at the top of `<body>` targeting `#main`.

## 3. Best Practices (96 → 100)

Typical residual deductions on this template: `Permissions-Policy` header not set, browser errors from the FA beta CDN, and the old-jQuery CSP profile. Actions:
- Serve a small `Permissions-Policy` and `Referrer-Policy: strict-origin-when-cross-origin` via the SSR response headers in `legacy-hydrate.server.ts`.
- Upgrade the FontAwesome CDN from the 6.0.0-beta3 URL to a stable release (or drop it — see perf item 6).
- Ensure no `console.error` fires on load (audit `main.js`, remove references to elements that don't exist on every page).
- Add `<meta name="theme-color" content="#…">` and confirm the favicon set is complete (192/512 PNG for PWA hint).

## 4. SEO (92 → 100)

Remaining deductions are usually tap-target size on mobile and one or two pages still missing a unique meta description. Actions:
- Audit tap targets on the hero CTAs and nav — enforce ≥ 44×44 CSS px with padding.
- Verify each legacy page has a unique `<title>` and `<meta description>` (spot-checked `index.html`; do the same for `shop.html`, `portfolio.html`, `about.html`, `services.html`, `contact.html`, `blog.html`).
- Confirm every `<a>` has discernible text (fixes overlap with A11y).

## 5. Agentic Browsing (2/3 → 3/3)

The missing check is almost always `/llms.txt`. Add `public/llms.txt` at the site root listing the public routes (Home, About, Services, Portfolio, Shop, Blog, Contact) per the llms.txt spec, plus a one-line summary of what Shachavir Timber does.

---

## Verification

After the edits land:
1. Publish the project.
2. Re-run Lighthouse from the SEO panel (or PageSpeed Insights on `https://shachavirtimberltd.com/`).
3. Update the SEO findings via `seo_chat--update_findings` once each category is at 100.

## Scope notes

- No backend/data changes — this is presentation + static asset work only.
- Hero image variants require running an image-encode step; I'll generate the AVIF/WebP files from the existing JPGs during build.
- Reaching a perfect **100** on mobile Performance is aggressive — if any single item can't quite close the gap (e.g. a third-party embed we can't defer), I'll flag it before finishing rather than silently landing at 98.
