
-- =========== ENUMS & HELPERS ===========
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========== USER ROLES ===========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bootstrap: first signup becomes admin (one-shot; no-op after first admin exists).
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created_bootstrap_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

-- Reusable can-edit predicate.
CREATE OR REPLACE FUNCTION public.can_edit(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'editor');
$$;

-- =========== SITE SETTINGS (singleton-ish key/value) ===========
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors manage settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
CREATE TRIGGER site_settings_updated BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== PAGES + SECTIONS ===========
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  seo_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pages TO anon, authenticated;
GRANT ALL ON public.pages TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.pages TO authenticated;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published pages" ON public.pages FOR SELECT TO anon, authenticated
  USING (is_published OR public.can_edit(auth.uid()));
CREATE POLICY "Editors manage pages" ON public.pages FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
CREATE TRIGGER pages_updated BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_id, section_key)
);
CREATE INDEX page_sections_page_idx ON public.page_sections(page_id, sort_order);
GRANT SELECT ON public.page_sections TO anon, authenticated;
GRANT ALL ON public.page_sections TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.page_sections TO authenticated;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read visible sections" ON public.page_sections FOR SELECT TO anon, authenticated
  USING (is_visible OR public.can_edit(auth.uid()));
CREATE POLICY "Editors manage sections" ON public.page_sections FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
CREATE TRIGGER page_sections_updated BEFORE UPDATE ON public.page_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== MENUS ===========
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menus TO anon, authenticated;
GRANT ALL ON public.menus TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.menus TO authenticated;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read menus" ON public.menus FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors manage menus" ON public.menus FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
CREATE TRIGGER menus_updated BEFORE UPDATE ON public.menus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX menu_items_menu_idx ON public.menu_items(menu_id, sort_order);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read menu items" ON public.menu_items FOR SELECT TO anon, authenticated
  USING (is_visible OR public.can_edit(auth.uid()));
CREATE POLICY "Editors manage menu items" ON public.menu_items FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
CREATE TRIGGER menu_items_updated BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== SERVICES ===========
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  category TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX services_published_idx ON public.services(is_published, sort_order);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read services" ON public.services FOR SELECT TO anon, authenticated
  USING (is_published OR public.can_edit(auth.uid()));
CREATE POLICY "Editors manage services" ON public.services FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
CREATE TRIGGER services_updated BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== PORTFOLIO ===========
CREATE TABLE public.portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  client TEXT,
  description TEXT,
  category TEXT,
  cover_image_url TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  completion_date DATE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  seo_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX portfolio_published_idx ON public.portfolio_projects(is_published, sort_order);
GRANT SELECT ON public.portfolio_projects TO anon, authenticated;
GRANT ALL ON public.portfolio_projects TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.portfolio_projects TO authenticated;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read portfolio" ON public.portfolio_projects FOR SELECT TO anon, authenticated
  USING (is_published OR public.can_edit(auth.uid()));
CREATE POLICY "Editors manage portfolio" ON public.portfolio_projects FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
CREATE TRIGGER portfolio_updated BEFORE UPDATE ON public.portfolio_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== TESTIMONIALS ===========
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  position TEXT,
  photo_url TEXT,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  review TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT ALL ON public.testimonials TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT TO anon, authenticated
  USING (is_published OR public.can_edit(auth.uid()));
CREATE POLICY "Editors manage testimonials" ON public.testimonials FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
CREATE TRIGGER testimonials_updated BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== TEAM ===========
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  phone TEXT,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.team_members TO anon, authenticated;
GRANT ALL ON public.team_members TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read team" ON public.team_members FOR SELECT TO anon, authenticated
  USING (is_published OR public.can_edit(auth.uid()));
CREATE POLICY "Editors manage team" ON public.team_members FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
CREATE TRIGGER team_updated BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== FAQS ===========
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT ALL ON public.faqs TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT TO anon, authenticated
  USING (is_published OR public.can_edit(auth.uid()));
CREATE POLICY "Editors manage faqs" ON public.faqs FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
CREATE TRIGGER faqs_updated BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== MEDIA ASSETS ===========
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  width INT,
  height INT,
  alt_text TEXT,
  caption TEXT,
  folder TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bucket, storage_path)
);
CREATE INDEX media_folder_idx ON public.media_assets(folder);
GRANT SELECT ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Editors read media" ON public.media_assets FOR SELECT TO authenticated
  USING (public.can_edit(auth.uid()));
CREATE POLICY "Editors manage media" ON public.media_assets FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));

-- =========== CONTACT MESSAGES ===========
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  source_page TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX contact_unread_idx ON public.contact_messages(is_read, created_at DESC);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
-- Anyone can submit
CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);
-- Only admins can view/manage
CREATE POLICY "Admins read contact" ON public.contact_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update contact" ON public.contact_messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete contact" ON public.contact_messages FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
