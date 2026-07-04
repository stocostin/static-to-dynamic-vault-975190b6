
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'page',
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

ALTER TABLE public.portfolio_projects
  ADD COLUMN IF NOT EXISTS for_sale boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_cents integer,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'KES';

GRANT SELECT ON public.pages, public.page_sections, public.services,
  public.portfolio_projects, public.testimonials, public.team_members,
  public.faqs, public.menus, public.menu_items, public.site_settings,
  public.media_assets TO anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pages' AND policyname='Public can read published pages') THEN
    CREATE POLICY "Public can read published pages" ON public.pages FOR SELECT TO anon USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='page_sections' AND policyname='Public can read visible page sections') THEN
    CREATE POLICY "Public can read visible page sections" ON public.page_sections FOR SELECT TO anon USING (is_visible = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='services' AND policyname='Public can read published services') THEN
    CREATE POLICY "Public can read published services" ON public.services FOR SELECT TO anon USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='portfolio_projects' AND policyname='Public can read published portfolio projects') THEN
    CREATE POLICY "Public can read published portfolio projects" ON public.portfolio_projects FOR SELECT TO anon USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='testimonials' AND policyname='Public can read published testimonials') THEN
    CREATE POLICY "Public can read published testimonials" ON public.testimonials FOR SELECT TO anon USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_members' AND policyname='Public can read published team members') THEN
    CREATE POLICY "Public can read published team members" ON public.team_members FOR SELECT TO anon USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='faqs' AND policyname='Public can read published faqs') THEN
    CREATE POLICY "Public can read published faqs" ON public.faqs FOR SELECT TO anon USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='menus' AND policyname='Public can read menus') THEN
    CREATE POLICY "Public can read menus" ON public.menus FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='menu_items' AND policyname='Public can read visible menu items') THEN
    CREATE POLICY "Public can read visible menu items" ON public.menu_items FOR SELECT TO anon USING (is_visible = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='site_settings' AND policyname='Public can read site settings') THEN
    CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='media_assets' AND policyname='Public can read media assets') THEN
    CREATE POLICY "Public can read media assets" ON public.media_assets FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Editors can write media bucket') THEN
    CREATE POLICY "Editors can write media bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.can_edit(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Editors can update media bucket') THEN
    CREATE POLICY "Editors can update media bucket" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.can_edit(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Editors can delete media bucket') THEN
    CREATE POLICY "Editors can delete media bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.can_edit(auth.uid()));
  END IF;
END $$;

-- Anonymous contact form submissions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_messages' AND policyname='Anyone can submit contact messages') THEN
    CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;
GRANT INSERT ON public.contact_messages TO anon;
