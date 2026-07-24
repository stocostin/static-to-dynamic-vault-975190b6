## Goal
Elevate the admin area (dashboard + every sub-page) to look professional and cohesive, using the existing warm brown/gold palette. No database or business-logic changes — appearance only.

## Scope
- `/admin` (dashboard home)
- All admin sub-pages: Blog Posts, Products, Portfolio, Pages (Home/About/Services/Contact/Portfolio), Messages, Chat, Documents (Invoice/Quotation/Receipt/Estimate lists + editor), Media, Team, Site Settings

## Design direction
Warm branded, balanced density.
- Surfaces: cream (`#F7F1E6`) page background, white cards with subtle brown-tinted borders and soft shadows
- Primary: deep brown `#3E2A1E`; Accent: gold `#B8873B`
- Typography: existing serif for headings, sans for body; tighten sizes and weights for hierarchy
- Rounded-lg cards, consistent 6-unit padding, hover lift on interactive cards

## Changes

### 1. Shared admin shell
- Add a consistent page header component used across every admin sub-page: title (serif), subtitle/description, right-aligned primary action button, thin gold underline accent
- Refine the admin sidebar: active-route highlight in gold, section labels in muted brown, icon + label alignment, collapsed mini state polish
- Top bar: breadcrumb (Admin › Section), subtle border-bottom, cream backdrop

### 2. Dashboard home (`admin.index.tsx`)
- Hero header row: greeting + date + "Publish" CTA
- Stat cards (4): unread messages, active chats, published blogs, products — each with color-coded icon chip (brown/gold/olive/sand), large number, subtle trend line row, hover elevation
- Quick Actions row: 4 tiles (New blog, New product, New document, Site settings) with icons + short descriptions
- Two-column activity area: "Latest messages" and "Recent chats" as clean list cards with avatar initials, timestamp, unread dot
- Small "System" strip at bottom: site status, last publish, storage indicator

### 3. Sub-page polish (applied uniformly)
- List pages (Blog/Products/Portfolio/Messages/Documents/Media/Team):
  - Toolbar row: search input, filter chips, "New" primary button
  - Replace bare tables with card-wrapped tables: zebra rows, hover highlight, status badges in brand colors, action icons instead of text buttons where appropriate
  - Empty states: centered illustration block with icon + helpful copy + CTA
- Editor pages (Blog editor, Product editor, Document editor, Page editors):
  - Two-column layout on desktop: main editor card + right rail with meta/SEO/publish card
  - Sticky save bar at bottom with status pill (Draft / Published / Unsaved changes)
  - Section cards with clear labels and helper text under fields
- Site Settings: group into tabbed cards (Branding, Contact, Documents, SEO, Social) with the same card treatment

### 4. Design tokens (styles.css)
- Add/refine semantic tokens: `--admin-bg`, `--admin-surface`, `--admin-border`, `--admin-accent`, `--admin-accent-soft`, `--shadow-card`, `--shadow-card-hover`
- Add a shared `.admin-card`, `.admin-page-header`, `.admin-stat`, `.admin-empty` utility layer via `@utility` in Tailwind v4 style
- All colors via tokens — no hardcoded hex in components

### 5. Micro-polish
- Buttons: consistent sizing, gold primary with brown hover, ghost variant for secondary actions
- Badges: status (published/draft/archived) with brand-tinted backgrounds
- Skeleton loaders on list pages instead of spinners
- Toasts: match brand palette

## Out of scope
- No database, RLS, schema, or server-function changes
- No changes to public-site pages
- No changes to PDF rendering
- No new features — visual only

## Files touched (expected)
- `src/styles.css` (tokens + utilities)
- `src/components/admin/AdminShell.tsx`, `AdminSidebar.tsx`, `AdminPageHeader.tsx` (new/refined)
- `src/routes/_authenticated/admin.index.tsx`
- All `src/routes/_authenticated/admin.*.tsx` sub-pages (presentational updates)
- `src/components/admin/DocumentEditor.tsx` (layout wrapper + right rail only, no logic)

## Verification
- Visit each admin route in the preview at desktop and mobile viewports
- Confirm no console errors, no layout overflow, active nav highlight works, empty states render
- Confirm document editor still saves and PDF still downloads unchanged
