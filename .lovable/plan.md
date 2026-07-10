# Fix blog editing + upgrade editor

## Problem

Saving a blog post throws `function public.can_edit(uuid) does not exist` (same root cause as the earlier documents bug). In migration `20260708183807`, `public.can_edit` and `public.has_role` were relocated to the `private` schema, but the RLS policies on `blog_posts` (and several other tables) were never rewritten and still call `public.can_edit(auth.uid())` / `public.has_role(...)`. Any INSERT/UPDATE/DELETE against those tables fails RLS evaluation.

Affected policies still referencing `public.can_edit` / `public.has_role`:
- `blog_posts`, `services`, `portfolio_projects`, `shop_products`, `faqs`, `testimonials`, `team_members`, `pages`, `page_sections`, `menus`, `menu_items`, `site_settings`, `media_assets`, `user_roles`, `contact_messages` (admin policies) — anywhere the old helper names appear in existing migrations.

## Fix — Part 1: SQL migration

Drop and recreate every RLS policy that still references `public.can_edit` or `public.has_role`, repointing them to `private.can_edit` / `private.has_role`. Same USING / WITH CHECK semantics, no behavioural change — only the schema qualifier moves. This keeps the helpers out of the PostgREST-exposed `public` schema (the reason they were moved) while restoring writes.

## Fix — Part 2: Rich-text editor upgrades

Update `src/components/admin/RichTextEditor.tsx` to add capabilities expected in a professional blog editor:

- **Tables** (`@tiptap/extension-table` + row/cell/header) with insert / add row / add column / delete controls.
- **Code blocks with language** via `@tiptap/extension-code-block-lowlight` + `lowlight` and a small language set (js, ts, html, css, bash, json).
- **Task lists** (`@tiptap/extension-task-list`, `@tiptap/extension-task-item`) — checkboxes.
- **Text color + highlight** (`@tiptap/extension-color`, `@tiptap/extension-text-style`, `@tiptap/extension-highlight`).
- **Typography** (`@tiptap/extension-typography`) for smart quotes / dashes.
- **YouTube embed** (`@tiptap/extension-youtube`) via a "Insert video" toolbar button that prompts for a URL.
- **Character / word count** (`@tiptap/extension-character-count`) shown under the editor.
- Image improvement: after inserting an image, prompt for alt text and set it on the node (accessibility + SEO).
- Toolbar reorganized into grouped rows so the new controls stay usable.
- Extend the editor's Tailwind `prose` classes so tables, code blocks, task lists, and highlights render correctly in the editor.

No changes to the public blog rendering pipeline; posts continue saving as HTML into `blog_posts.body_html`.

## Verification

- Save a blog post from `/admin/blog-posts/:id` — succeeds without the RLS error.
- Toggle publish from the list view — succeeds.
- New editor controls (table, code block, task list, color, highlight, YouTube, counter) all work.
- `bunx tsgo --noEmit` clean.

## Technical notes

- Migration is idempotent via `DROP POLICY IF EXISTS` + `CREATE POLICY`.
- Editor deps added with `bun add @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-code-block-lowlight lowlight @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-highlight @tiptap/extension-typography @tiptap/extension-youtube @tiptap/extension-character-count`.
