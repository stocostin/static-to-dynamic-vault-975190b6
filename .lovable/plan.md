
## Problem

Right now most sections you asked about (About hero, Mission/Vision, Our Story, Process, Team intro; Services page intro & "What We Offer"; Portfolio hero; Shop hero & products; Blog list & post editor; Contact details) are only editable through the generic **Page Sections** screen, which asks for CSS selectors. That is technical and easy to break.

The plan is to replace that with **one friendly editor per page**, each with named fields that map to the exact blocks on the live site. No visual changes to the public site.

## What gets added

### 1. `/admin/pages/about` — About page editor
Named fields (all pre-seeded with current copy):
- Hero: eyebrow, title, subtitle, background image
- Our Mission: title + body
- Vision & Objective: title + body (two side-by-side cards, each with title/body)
- Our Story: title, body, image
- Our Process: title + repeater of steps (number, title, description)
- Meet Our Craftsmen: section title + subtitle (the team cards themselves stay wired to the existing **Team** admin)

### 2. `/admin/pages/services` — Services page editor
- Hero: title ("Expert Woodwork Services in Kenya"), subtitle, background image
- "What We Offer" intro: title + body
- Per-service detail blocks: title, long description, feature bullets (repeater), image, CTA label + link — one block per service, pulled from and saved back to the existing `services` table (extended with a `features jsonb` and `long_description` column so the block renders identically to today)
- Bottom CTA: title, body, button label + link

### 3. `/admin/pages/portfolio` — Portfolio page editor
- Hero: title ("Crafted to Impress — See What We Build"), subtitle, background image
- Filters intro copy
- Bottom CTA
- Individual projects continue to be edited on the existing **Portfolio** admin, which already covers title, description, category, location (added), cover image, gallery, completion date, featured flag, sort order. A "Location" text column will be added to `portfolio_projects` since the live cards show it.

### 4. `/admin/pages/shop` — Shop page editor
- Hero: title, subtitle, background image
- Featured products section: title + subtitle + which products are featured (uses `is_featured` flag on products)
- All products section: title + subtitle
- Products themselves are managed on a new `/admin/shop-products` screen (title, description, image, gallery, price, currency, in-stock, featured, sort). Backed by a new `shop_products` table so shop items are separate from portfolio pieces.

### 5. `/admin/pages/blog` — Blog list + `/admin/blog/$id` post editor
- Blog list page fields: hero title, subtitle, background image, intro copy
- New **rich-text editor** (Tiptap) for each post with: bold/italic/underline, headings, lists, links, images (uploaded to the existing `admin-uploads` bucket), quotes, code, alignment
- Post fields: title, slug, cover image, excerpt, category, tags, author, published_at, is_published, body (rich HTML), SEO title & meta description
- Backed by a new `blog_posts` table (replaces the earlier idea of storing posts as page_sections)

### 6. `/admin/pages/contact` — Contact page editor
- Hero: title, subtitle, background image
- Intro copy
- Contact details block: address, phone(s), email(s), business hours (repeater: day + hours), Google Maps embed URL
- "Send us a message" form heading + subtitle + success message text
- Social icons already live in Settings → Contact & Social

### 7. Admin navigation
The admin sidebar gets a new **Pages** group with one entry per page above, plus keeps the existing collection managers (Services, Portfolio, Team, Testimonials, FAQs, Messages, Menus, Settings). The old generic "Page Sections" screen stays available under **Advanced** for power users but is no longer the primary way to edit copy.

## How it hooks into the live site

- Each named field is stored as a `page_sections` row with a stable `section_key` (e.g. `about.hero.title`, `services.what_we_offer.body`, `contact.hours`). The hydration layer already reads `page_sections`; it gets a small per-page map from `section_key → live-site selector + renderer` so authors never touch selectors.
- All new tables get RLS + GRANTs matching existing patterns (editors write, anon reads published rows), and the existing `bump_content_version` trigger is extended to `blog_posts` and `shop_products` so edits appear on the live site within ~1 second.
- No CSS/HTML/JS changes to the public site — only the hydration map grows and two new tables render into existing markup slots.

## Deliverable order

1. Migration: add `blog_posts`, `shop_products`, `portfolio_projects.location`, `services.long_description`/`features`, seed `page_sections` rows for every named field above with current copy.
2. Hydration: extend per-page hydrators with the new `section_key` map; render blog list, blog post detail, shop products, service detail blocks from the new tables.
3. Admin: new page editors + shop products manager + blog post editor with Tiptap. Sidebar reorganized into "Pages" and "Collections" groups.
4. Manual walkthrough: edit one field per page, confirm it appears live within ~1s.

## Non-goals

- No visual redesign of the public site.
- No checkout/payments on the shop (products stay display-only, matching today).
- No multi-language / draft-preview workflow beyond the existing `is_published` flag.
