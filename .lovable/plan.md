Three targeted fixes.

## 1. Team images not showing

All 6 team members have `photo_url = NULL` in the database. Current renderer falls back to `assets/images/placeholder.jpg` which doesn't exist, so browsers show empty circles inside the gold border.

Fix in `renderTeamMembers` (src/lib/legacy-hydrate.server.ts):
- When `photo_url` is null/empty, render an initials avatar instead of a broken `<img>`: a `<div class="member-initials">JK</div>` containing the person's initials (first + last name).
- Add CSS in `public/assets/css/style.css` for `.member-initials`: fills the 150×150 circle, centered, uses site primary/secondary colors, large bold letters — so it looks intentional (matches upload screenshot style but filled instead of hollow).
- Keep the `<img>` path unchanged when a real photo exists.

No DB change; admins can still upload real photos via `/admin/team` and they'll replace the initials.

## 2. Default notes wording

Update the `document_notes_default` value in `site_settings` (data content, not schema):
- Change `Delivery time: 2 – 3 working days upon confirmation.` → `Delivery time: 2 – 3 weeks upon confirmation.`
- Leave the other three lines intact.

This affects new documents; existing saved documents keep their own notes.

## 3. Polish the admin dashboard (appearance only)

Refresh `src/routes/_authenticated/admin.index.tsx` — no DB changes, no new tables:
- Header block with welcome copy on the left and a subtle brand accent bar / date on the right.
- Turn the 7 stat cards into a richer grid: each card gets a colored icon chip (brand palette: primary/secondary/muted/accent variants), the count in a larger tabular-num font, and a small helper caption (e.g. "in your CMS").
- Add a "Quick actions" row below stats with buttons that link to the most-used admin routes (New document, New blog post, New portfolio project, Site settings, Messages) — pure client-side links using existing icons.
- Add a "Latest messages" and "Latest chat inquiries" pair of compact cards below quick actions, each showing the 5 most recent rows (name / snippet / relative time) using existing tables the admin already has read access to. These are read-only summaries — click-through goes to the existing `/admin/messages` and `/admin/chats` pages.
- Use only the existing design tokens in `src/styles.css` (primary / secondary / muted / accent / border) so it stays consistent in light and dark mode. No hardcoded hex.

## Verification

- Team section on `/about` shows filled circular avatars with initials for the 6 current members (no broken image icons).
- New document created after the change shows "Delivery time: 2 – 3 weeks upon confirmation." in the notes textarea and downloaded PDF.
- `/admin` dashboard renders the new header, stat grid with colored icon chips, quick action buttons, and the two "latest" cards populated from existing `contact_messages` and `chat_conversations` tables.
- `bunx tsgo --noEmit` clean.
