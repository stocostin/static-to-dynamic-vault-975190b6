## Why images aren't showing

Three separate bugs, all fixable in one pass:

**1. Legacy image paths are relative, so they 404 on every subpage.**
The static HTML uses `src="assets/images/logo.png"` (no leading slash). On `/about` the browser resolves that to `/about/assets/images/logo.png` → 404. The `/assets/images/*` server route only fires when the path starts with `/assets/`.

**2. The `admin-uploads` bucket is private, but the CMS hands out public URLs.**
`PageEditor`, `ResourceManager`, and `RichTextEditor` all call `supabase.storage.from("admin-uploads").getPublicUrl(...)`. That URL returns 400/403 because the bucket is not public — so every image uploaded via the CMS breaks the moment it's rendered.

**3. Placeholder fallback uses a relative path too.**
`legacy-hydrate.server.ts` falls back to `assets/images/placeholder.jpg` for missing images. Same 404 problem, and the placeholder file doesn't exist.

## Fix

Three surgical changes, no visual changes to the site:

### a. Make `admin-uploads` public so CMS-uploaded images actually load

Flip the bucket to public via `storage_update_bucket`. Read policies stay open; write/delete policies keep requiring admin/editor role, so admins are still the only ones who can upload. After this, every `getPublicUrl(...)` URL already stored (and any future upload) resolves.

If the workspace blocks public buckets, fall back to switching the three upload helpers to `createSignedUrl(..., 60*60*24*365)` and store the signed URL. Bucket-public is the cleaner default.

### b. Normalize legacy image paths in the hydrator

In `src/lib/legacy-hydrate.server.ts`:

- Add a small `normalizeImg(url)` helper: if the URL is empty → return the CDN placeholder; if it starts with `assets/` → prepend `/`; if it starts with `http`, `/`, `data:`, or `blob:` → leave alone.
- Run it on every `image_url`/`cover_image_url`/`photo_url` before it's written into `src=`, and on the `site_settings` `header_logo_url` / `footer_logo_url` / `hero_bg_*` / `google_qr_image_url` values.
- After all mutations, do one final sweep on the whole document that rewrites any remaining `src="assets/…"` / `href="assets/…"` / `url('assets/…')` (in inline styles) to leading-slash form. This catches images inside legacy blocks the hydrator doesn't touch (e.g. footer logo, feature icons).

### c. Replace the missing placeholder

Change the hardcoded `"assets/images/placeholder.jpg"` fallbacks in `renderPortfolioCards`, `renderPortfolioListCards`, `renderServiceDetailBlock`, `renderBlogCards`, `renderProductCards`, and `renderTeamCards` to a real inline SVG data URL (a light-gray 4:3 "Image" tile). No file needed, no 404, and it disappears the moment an admin uploads a real image.

## Verification

- Open `/`, `/about`, `/services`, `/portfolio`, `/shop`, `/blog`, `/contact` — logo, hero background, service images, team photos, and any CMS-uploaded image all render (given the corresponding legacy files have been uploaded via `/admin/legacy-images`; if not, the placeholder shows instead of a broken icon).
- Upload a fresh image in `/admin/pages/about` → hero image field → save → reload `/about`: the new image appears.
- Same for `/admin/services` (service card image), `/admin/portfolio` (project cover), `/admin/blog-posts/:id` (cover + inline rich-text images), `/admin/shop-products` (product photo).

## Out of scope

- No visual/styling changes to the public site.
- No new admin screens.
- Doesn't re-upload the legacy image files themselves — the admin does that once at `/admin/legacy-images`. This plan only makes sure that once they're uploaded, they render everywhere, and that any image uploaded via the CMS from now on renders too.
