
-- =========================================================
-- 1. Extend existing tables
-- =========================================================
ALTER TABLE public.portfolio_projects
  ADD COLUMN IF NOT EXISTS location text;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_url text;

-- =========================================================
-- 2. blog_posts
-- =========================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  cover_image_url text,
  body_html text NOT NULL DEFAULT '',
  category text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  author text,
  seo_title text,
  meta_description text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published blog posts"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR public.can_edit(auth.uid()));

CREATE POLICY "Editors manage blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (public.can_edit(auth.uid()))
  WITH CHECK (public.can_edit(auth.uid()));

CREATE TRIGGER blog_posts_updated
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_bump_content_version_blog
  AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
  FOR EACH STATEMENT EXECUTE FUNCTION public.bump_content_version();

-- =========================================================
-- 3. shop_products
-- =========================================================
CREATE TABLE IF NOT EXISTS public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  image_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  price_cents integer,
  currency text NOT NULL DEFAULT 'KES',
  in_stock boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  category text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shop_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_products TO authenticated;
GRANT ALL ON public.shop_products TO service_role;

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published shop products"
  ON public.shop_products FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR public.can_edit(auth.uid()));

CREATE POLICY "Editors manage shop products"
  ON public.shop_products FOR ALL
  TO authenticated
  USING (public.can_edit(auth.uid()))
  WITH CHECK (public.can_edit(auth.uid()));

CREATE TRIGGER shop_products_updated
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_bump_content_version_shop
  AFTER INSERT OR UPDATE OR DELETE ON public.shop_products
  FOR EACH STATEMENT EXECUTE FUNCTION public.bump_content_version();

-- =========================================================
-- 4. Ensure pages exist
-- =========================================================
INSERT INTO public.pages (slug, title, is_published)
VALUES
  ('home', 'Home', true),
  ('about', 'About', true),
  ('services', 'Services', true),
  ('portfolio', 'Portfolio', true),
  ('shop', 'Shop', true),
  ('blog', 'Blog', true),
  ('contact', 'Contact', true)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- 5. Seed named page_sections rows (idempotent by section_key)
-- =========================================================
DO $$
DECLARE
  v_page_id uuid;
  rec record;
  seeds jsonb := '[
    {"page":"about","key":"hero","content":{"eyebrow":"","title":"About Shachavir Timber Limited","subtitle":"Driven by Precision, Delivered with Passion","image_url":""}},
    {"page":"about","key":"our_story","content":{"title":"Our Story","body":"Founded in 2010, Shachavir Timber Limited began as a small workshop with a vision to redefine woodworking in Kenya. What started as a passion project has grown into a respected name in custom woodwork, serving both residential and commercial clients across the country.\n\nOur journey has been guided by an unwavering commitment to quality, innovation, and customer satisfaction. Every piece that leaves our workshop carries the signature of our dedication to the craft.","image_url":"assets/images/workshop.jpg","badge_number":"13+","badge_text":"Years of Excellence"}},
    {"page":"about","key":"mission_vision","content":{"title":"Our Mission, Vision & Objective","mission_title":"Mission","mission_body":"To deliver exceptional woodwork solutions that enhance the beauty and functionality of spaces, while fostering a culture of craftsmanship and innovation.","vision_title":"Vision","vision_body":"To be the leading provider of bespoke woodwork in Kenya, recognized for our quality, creativity, and commitment to customer satisfaction.","objective_title":"Our Objective","objective_body":"To be a trusted leader in premium timber solutions by delivering quality craftsmanship, exceeding client expectations, and promoting sustainable, innovative joinery."}},
    {"page":"about","key":"process","content":{"title":"Our Process","intro":"At Shachavir Timber Limited, we follow a structured process that ensures every project meets our high standards and your expectations:","summary":"From concept to completion, we prioritize clear communication, timely delivery, and customer satisfaction.","steps":[{"title":"Consultation","body":"We begin with a one-on-one consultation to understand your needs, preferences, and budget."},{"title":"Design & Planning","body":"Our team creates tailored designs and recommends the best timber solutions for your project."},{"title":"Material Selection","body":"We help you choose high-quality, durable timber sourced responsibly."},{"title":"Craftsmanship","body":"Our skilled artisans bring the design to life with precision and care."},{"title":"Quality Checks","body":"Every piece undergoes thorough inspection to ensure excellence."},{"title":"Delivery & Installation","body":"We deliver and, if required, install the final product with minimal disruption."}]}},
    {"page":"about","key":"team_intro","content":{"title":"Meet Our Craftsmen","body":"Our team combines decades of experience with fresh perspectives to deliver exceptional woodwork."}},

    {"page":"services","key":"hero","content":{"title":"Expert Woodwork Services in Kenya","subtitle":"Comprehensive timber solutions crafted with precision and passion","image_url":""}},
    {"page":"services","key":"what_we_offer","content":{"title":"What We Offer","body":"From bespoke furniture to complete interior joinery, we deliver quality craftsmanship on every project."}},
    {"page":"services","key":"cta_footer","content":{"title":"Ready to Start Your Project?","body":"Contact us today for a free consultation and quote.","cta_label":"Get in Touch","cta_url":"contact.html"}},

    {"page":"portfolio","key":"hero","content":{"title":"Crafted to Impress — See What We Build","subtitle":"A showcase of our finest woodwork projects across Kenya","image_url":""}},
    {"page":"portfolio","key":"filters_intro","content":{"title":"Our Work","body":"Filter by category to explore projects that match your interest."}},
    {"page":"portfolio","key":"cta_footer","content":{"title":"Have a Project in Mind?","body":"Let''s bring your vision to life.","cta_label":"Start Your Project","cta_url":"contact.html"}},

    {"page":"shop","key":"hero","content":{"title":"Shop Our Collection","subtitle":"Handcrafted timber products, ready to ship","image_url":""}},
    {"page":"shop","key":"featured","content":{"title":"Featured Products","body":"Our most popular pieces, handpicked for you."}},
    {"page":"shop","key":"all_products","content":{"title":"All Products","body":"Browse the full collection."}},

    {"page":"blog","key":"hero","content":{"title":"Our Blog","subtitle":"Expert Tips, Trends & Inspiration from Our Craftsmen","image_url":""}},
    {"page":"blog","key":"intro","content":{"title":"Latest Articles","body":"Insights from our workshop, delivered to you."}},

    {"page":"contact","key":"hero","content":{"title":"Get In Touch","subtitle":"We''d love to hear about your project","image_url":""}},
    {"page":"contact","key":"intro","content":{"title":"Contact Us","body":"Reach out through any channel below or send us a message using the form."}},
    {"page":"contact","key":"details","content":{"address":"Nairobi, Kenya","phone":"+254 700 000 000","phone_2":"","email":"info@shachavir.co.ke","email_2":"","map_embed_url":""}},
    {"page":"contact","key":"hours","content":{"title":"Business Hours","items":[{"day":"Monday - Friday","hours":"8:00 AM - 6:00 PM"},{"day":"Saturday","hours":"9:00 AM - 4:00 PM"},{"day":"Sunday","hours":"Closed"}]}},
    {"page":"contact","key":"form","content":{"title":"Send Us a Message","subtitle":"We''ll get back to you within 24 hours.","success_message":"Thanks! Your message has been sent. We''ll be in touch soon."}}
  ]'::jsonb;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(seeds) AS s(item)
  LOOP
    SELECT id INTO v_page_id FROM public.pages WHERE slug = (rec.item->>'page');
    IF v_page_id IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.page_sections (page_id, section_key, content, is_visible, sort_order)
    VALUES (
      v_page_id,
      rec.item->>'key',
      rec.item->'content',
      true,
      0
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
