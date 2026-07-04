## Goal

Add a temporary admin page that lets you drop in all the original site images at once and have each file land at the exact relative path the legacy HTML/CSS expects (e.g. `assets/images/logo.png`, `assets/images/portfolio/door1.jpg`). This unblocks the visual restore without wiring the CMS yet.

## Approach

The legacy pages are served as raw HTML from `src/legacy/*.html` and reference images with relative paths like `assets/images/hero-bg.jpg`. These resolve to `/assets/images/...` at the site root. Rather than committing binary files into `public/`, we serve them out of the existing private `admin-uploads` Supabase Storage bucket under a `legacy/` prefix and add a tiny server route that proxies `/assets/images/*` to those objects. This keeps the migration reversible and requires no build step per upload.

### 1. New admin route: `/admin/legacy-images`

- New file `src/routes/_authenticated/admin.legacy-images.tsx`.
- Add a "Legacy images" link to `AdminShell.tsx` nav (flagged as temporary).
- UI:
  - Dropzone accepting multiple files + whole-folder selection (`<input webkitdirectory multiple>`).
  - A pre-populated checklist of the 34 expected paths (derived from the grep of `src/legacy/` + CSS). Each row shows: expected filename, target path, status (missing / uploaded / mismatch).
  - Auto-match strategy: for each dropped file, resolve its target path by
    1. exact relative path if the folder upload preserved `assets/images/...`,
    2. otherwise match by basename against the expected list,
    3. otherwise show it in an "Unmatched — assign manually" list with a dropdown of remaining expected paths.
  - "Upload all" button uploads each file to `admin-uploads` at key `legacy/assets/images/<same subpath>` with `upsert: true`.
  - Re-upload overwrites. A "Delete" per row removes the object.
- Live status is fetched from `supabase.storage.from('admin-uploads').list('legacy/assets/images', { limit: 1000, recursive... })` (recursive listing via subfolder calls).

### 2. Serve uploaded files at their original URLs

The legacy HTML uses relative `assets/images/...`, which resolves under each page URL. Two lightweight server routes handle this so the same file works for `/assets/images/x.jpg` and `/portfolio/assets/images/x.jpg`:

- `src/routes/api/legacy-image.$.tsx` — server route matching `/assets/images/*` and `/portfolio/assets/images/*` etc. Actually cleanest: one catch-all `src/routes/assets.images.$.tsx` with a `server.handlers.GET` that:
  1. Reads the splat path.
  2. Calls `supabaseAdmin.storage.from('admin-uploads').download('legacy/assets/images/' + splat)` (loaded via `await import('@/integrations/supabase/client.server')`).
  3. Returns the bytes with proper `Content-Type` (inferred from extension) and a `Cache-Control: public, max-age=300` header.
  4. 404s cleanly when the object doesn't exist.

Because the legacy HTML routes (`/about`, `/portfolio`, etc.) are top-level page paths, browser-relative `assets/images/...` resolves to `/assets/images/...`, which this route serves. No changes to legacy HTML.

### 3. Expected-paths manifest

`src/lib/legacy-images.ts` exports the exact list grepped from `src/legacy/` and CSS (34 files). The admin page imports it to drive the checklist and the "still missing" counter.

### 4. Temporary flag

- Route file header comment marks this as temporary Phase-1 tooling to be removed once images are moved into the CMS media library / portfolio records in Phase 2.
- Nav item labelled "Legacy images (temp)".

## Out of scope

- No changes to legacy HTML.
- No CMS wiring of these images (that's Phase 2).
- No public `public/` binary commits.

## Technical notes

- Bucket `admin-uploads` already exists and is private; the server route uses `supabaseAdmin` so RLS/private status is fine. If a future page allows-listing, we can tighten by adding an allow-list check against the manifest before download.
- Content-Type map: `.jpg/.jpeg → image/jpeg`, `.png → image/png`, `.webp → image/webp`, `.svg → image/svg+xml`, `.gif → image/gif`; default `application/octet-stream`.
- The route uses `await import('@/integrations/supabase/client.server')` inside the handler to keep the admin client out of the client bundle.
