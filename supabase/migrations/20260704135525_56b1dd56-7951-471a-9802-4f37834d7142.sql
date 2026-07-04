-- Seed missing CMS content from legacy HTML so admins can edit existing copy
-- Safe to re-run: uses COALESCE/NULLIF so admin edits are preserved.

-- ============================================================
-- 1) SERVICES — enrich the 3 services missing long_description/features/CTA
-- ============================================================
UPDATE public.services SET
  long_description = COALESCE(NULLIF(long_description, ''),
    'Precision-crafted frames that enhance both the functionality and beauty of your openings while ensuring perfect fit and durability.'),
  features = CASE WHEN features IS NULL OR jsonb_array_length(features) = 0
    THEN '["Custom sizing for any opening","Seamless integration with doors/windows","Termite-resistant treatments","Smooth operation and longevity","Matching interior trim options"]'::jsonb
    ELSE features END,
  cta_label = COALESCE(NULLIF(cta_label, ''), 'View Frame Projects'),
  cta_url = COALESCE(NULLIF(cta_url, ''), '/portfolio?filter=frames')
WHERE lower(title) LIKE 'frame%';

UPDATE public.services SET
  long_description = COALESCE(NULLIF(long_description, ''),
    'From grand staircases to space-saving designs, we create functional works of art that become focal points of your space.'),
  features = CASE WHEN features IS NULL OR jsonb_array_length(features) = 0
    THEN '["Straight, curved, and spiral designs","Floating and traditional styles","Handrails and balustrades","Non-slip treatments","Indoor and outdoor options"]'::jsonb
    ELSE features END,
  cta_label = COALESCE(NULLIF(cta_label, ''), 'View Staircase Projects'),
  cta_url = COALESCE(NULLIF(cta_url, ''), '/portfolio?filter=staircases')
WHERE lower(title) LIKE 'staircase%';

UPDATE public.services SET
  long_description = COALESCE(NULLIF(long_description, ''),
    'Bespoke furniture pieces designed for your space, lifestyle, and aesthetic preferences, built to last for generations.'),
  features = CASE WHEN features IS NULL OR jsonb_array_length(features) = 0
    THEN '["Dining tables and chairs","Bed frames and headboards","Cabinets and shelving","Office furniture","Entertainment units"]'::jsonb
    ELSE features END,
  cta_label = COALESCE(NULLIF(cta_label, ''), 'View Furniture Projects'),
  cta_url = COALESCE(NULLIF(cta_url, ''), '/portfolio?filter=furniture')
WHERE lower(title) LIKE '%furniture%';

-- Custom Doors: fill CTA if missing (long_description/features already present)
UPDATE public.services SET
  cta_label = COALESCE(NULLIF(cta_label, ''), 'View Door Projects'),
  cta_url = COALESCE(NULLIF(cta_url, ''), '/portfolio?filter=doors')
WHERE lower(title) LIKE '%door%';

-- ============================================================
-- 2) PORTFOLIO — add default location for rows missing one
-- ============================================================
UPDATE public.portfolio_projects
SET location = COALESCE(NULLIF(location, ''), 'Nairobi, Kenya')
WHERE location IS NULL OR location = '';

-- ============================================================
-- 3) SHOP PRODUCTS — seed 20 items from legacy shop.js, only if table empty
-- ============================================================
INSERT INTO public.shop_products (slug, title, description, category, is_published, is_featured, sort_order)
SELECT slug, title, description, category, true, is_featured, sort_order
FROM (VALUES
  ('solid-mahogany-door','Solid Mahogany Door','Handcrafted from premium mahogany with elegant finish.','doors', true, 1),
  ('oak-wooden-frame','Oak Wooden Frame','Durable oak frame for windows and doors.','frames', true, 2),
  ('spiral-wooden-staircase','Spiral Wooden Staircase','Custom designed spiral staircase with handrails.','staircases', true, 3),
  ('executive-office-desk','Executive Office Desk','Large executive desk made from teak wood.','furniture', true, 4),
  ('custom-carved-door','Custom Carved Door','Beautifully carved door with traditional designs.','doors', false, 5),
  ('modern-tv-stand','Modern TV Stand','Contemporary TV stand with shelving.','furniture', false, 6),
  ('french-window-frames','French Window Frames','Elegant french-style window frames.','frames', false, 7),
  ('floating-staircase','Floating Staircase','Modern floating staircase design.','staircases', false, 8),
  ('dining-table-set','Dining Table Set','6-seater dining table with chairs.','furniture', false, 9),
  ('rustic-barn-door','Rustic Barn Door','Charming rustic-style sliding barn door.','doors', false, 10),
  ('bedroom-wardrobe','Bedroom Wardrobe','Spacious wardrobe with mirror doors.','furniture', false, 11),
  ('custom-arch-frame','Custom Arch Frame','Arched doorway frame for elegant entryways.','frames', false, 12),
  ('outdoor-deck-stairs','Outdoor Deck Stairs','Weather-resistant stairs for decks.','staircases', false, 13),
  ('coffee-table','Coffee Table','Handcrafted wooden coffee table.','furniture', false, 14),
  ('security-door','Security Door','Reinforced solid wood security door.','doors', false, 15),
  ('bookshelf','Bookshelf','Floor-to-ceiling wooden bookshelf.','furniture', false, 16),
  ('bay-window-frame','Bay Window Frame','Custom frame for bay windows.','frames', false, 17),
  ('l-shaped-staircase','L-Shaped Staircase','Space-saving L-shaped staircase.','staircases', false, 18),
  ('bed-frame','Bed Frame','Queen size wooden bed frame.','furniture', false, 19),
  ('custom-design-consultation','Custom Design Consultation','Personalized design service for your project.','custom', false, 20)
) AS v(slug, title, description, category, is_featured, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.shop_products);

-- ============================================================
-- 4) BLOG POSTS — seed 6 posts from legacy blog.html, only if table empty
-- ============================================================
INSERT INTO public.blog_posts (slug, title, excerpt, body_html, category, author, is_published, published_at, sort_order)
SELECT slug, title, excerpt, body_html, category, 'Shachavir Timber Limited', true, published_at, sort_order
FROM (VALUES
  ('2023-wood-design-trends',
   '2023 Wood Design Trends: What''s Hot in Kenyan Homes',
   'Discover the top woodworking trends transforming Kenyan interiors this year, from sustainable materials to minimalist designs that blend tradition with modernity.',
   '<p>Discover the top woodworking trends transforming Kenyan interiors this year, from sustainable materials to minimalist designs that blend tradition with modernity.</p><p>Edit this post from the admin dashboard to add the full article body.</p>',
   'Design Trends', '2023-06-15'::timestamptz, 1),
  ('protecting-wooden-furniture-in-kenya',
   'Protecting Your Wooden Furniture in Kenya''s Climate',
   'Learn essential maintenance techniques to protect your wood investments from humidity, temperature changes, and pests common in our region.',
   '<p>Learn essential maintenance techniques to protect your wood investments from humidity, temperature changes, and pests common in our region.</p><p>Edit this post from the admin dashboard to add the full article body.</p>',
   'Wood Care', '2023-05-28'::timestamptz, 2),
  ('beginners-guide-to-wood-finishing',
   'Beginner''s Guide to Wood Finishing Techniques',
   'Step-by-step instructions for achieving professional-looking finishes on your wood projects, even as a beginner.',
   '<p>Step-by-step instructions for achieving professional-looking finishes on your wood projects, even as a beginner.</p><p>Edit this post from the admin dashboard to add the full article body.</p>',
   'DIY Tips', '2023-04-12'::timestamptz, 3),
  ('sustainable-wood-sourcing-in-east-africa',
   'Sustainable Wood Sourcing in East Africa',
   'How we responsibly source our materials and what you should look for when purchasing wood products in Kenya.',
   '<p>How we responsibly source our materials and what you should look for when purchasing wood products in Kenya.</p><p>Edit this post from the admin dashboard to add the full article body.</p>',
   'Sustainability', '2023-03-30'::timestamptz, 4),
  ('crafting-a-custom-mahogany-entry-door',
   'Behind the Scenes: Crafting a Custom Mahogany Entry Door',
   'A detailed look at our process for creating a bespoke entry door for a Karen residence, from design to installation.',
   '<p>A detailed look at our process for creating a bespoke entry door for a Karen residence, from design to installation.</p><p>Edit this post from the admin dashboard to add the full article body.</p>',
   'Project Spotlight', '2023-02-18'::timestamptz, 5),
  ('choosing-the-right-wood-kenyan-hardwoods',
   'Choosing the Right Wood for Your Project: Kenyan Hardwoods Compared',
   'An expert comparison of local wood species, their characteristics, and ideal applications for your home or business.',
   '<p>An expert comparison of local wood species, their characteristics, and ideal applications for your home or business.</p><p>Edit this post from the admin dashboard to add the full article body.</p>',
   'Design Trends', '2023-01-05'::timestamptz, 6)
) AS v(slug, title, excerpt, body_html, category, published_at, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.blog_posts);

-- ============================================================
-- 5) Bump content version so public cache picks up new data
-- ============================================================
INSERT INTO public.site_settings (key, value)
VALUES ('content_version', to_jsonb(extract(epoch from clock_timestamp())::text))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
