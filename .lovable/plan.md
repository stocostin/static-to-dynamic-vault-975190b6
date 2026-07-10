Three fixes for public-facing issues.

## 1. Blog detail pages (`/blog/:slug`) returning 404

Blog list at `/blog` works, but every "Read More" link goes to `/blog/<slug>` and there is no route file for it — so "blogs are not showing" from the visitor's perspective.

Add `src/routes/blog.$slug.tsx` as a server route that:
- Loads the post from `blog_posts` by slug (only `is_published = true`) using the server publishable client (matching the existing pattern in `legacy-hydrate.server.ts`).
- Returns a full HTML page built from the existing `src/legacy/blog.html` shell (header, footer, styles) so it visually matches the rest of the site. A new `hydrateBlogPost(html, slug)` helper in `legacy-hydrate.server.ts` will:
  - Run `applyCommon` for header/footer/social/menus.
  - Replace the `.blog-grid` region with a single-article layout: cover image, title, category + date meta, author, and `body_html` rendered inside a `.blog-article` container styled by existing prose CSS.
  - Set `<title>` and meta description/OG tags from the post (`seo_title` / `meta_description` fallback to title/excerpt, `cover_image_url` → og:image).
  - Return 404 HTML (reuse `error-page.ts`) when the slug is missing or unpublished.

Also link the list-page cards' images to the detail page (currently only the title/read-more link).

## 2. Contact CMS: support more than two phones and emails

Currently `admin.pages.contact.tsx` exposes only `phone`, `phone_2`, `email`, `email_2`.

- Change the spec to two repeaters: `phones` (list of `{ number }`) and `emails` (list of `{ address }`), replacing the four single-value fields. Keep backward compatibility by falling back to `phone`/`phone_2`/`email`/`email_2` when the repeater arrays are empty (so existing saved content keeps rendering until an editor re-saves).
- In `legacy-hydrate.server.ts` `contact:details` case, rebuild the phone `<div>` and email `<div>` innerHTML from the arrays (any length), producing one `<p><a href="tel:...">...</a></p>` per entry, instead of writing into a fixed number of `<p>` tags.

## 3. Contact form submit failing

Root cause: the `contact_messages` INSERT policy has a `CHECK` that requires `length(email) BETWEEN 3 AND 320`. The public form marks email as optional and the API sends `""` when empty, so the check fails and the insert is rejected → generic "could not send" error.

Fix on the frontend (no schema change):
- Make email required in the legacy contact form: add `required` to `<input type="email" id="email" name="email">` in `src/legacy/contact.html`, and update the label to reflect it.
- Tighten the Zod schema in `src/routes/api/public/contact.ts` to require a valid email (`z.string().email().max(200)`), returning a clear 400 message when missing so the client can surface it.
- Improve the enhancer script in `legacy-hydrate.server.ts` to show the server's error message when the response is not ok (instead of a generic fallback), so future failures are visible.

## Verification

- `curl /blog/2023-wood-design-trends` returns 200 with the post body.
- `/admin/pages/contact` shows repeaters; adding a third phone renders three `<p>` entries on `/contact`.
- Submitting `/contact` with name, phone, email, and message succeeds; submitting without email shows an inline validation error.
- `bunx tsgo --noEmit` clean.
