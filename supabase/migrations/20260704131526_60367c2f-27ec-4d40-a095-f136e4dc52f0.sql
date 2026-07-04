
-- Bump a version key whenever any content table changes; hydration layer
-- keys its cache off this so admin edits appear on the site immediately.
CREATE OR REPLACE FUNCTION public.bump_content_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.site_settings (key, value)
  VALUES ('content_version', to_jsonb(extract(epoch from clock_timestamp())::text))
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = now();
  RETURN NULL;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'site_settings','pages','page_sections','services','portfolio_projects',
    'testimonials','team_members','faqs','menus','menu_items','media_assets'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_bump_content_version ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_bump_content_version
         AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH STATEMENT EXECUTE FUNCTION public.bump_content_version()', t);
  END LOOP;
END;
$$;

-- Belt-and-braces GRANTs so the publishable (anon) key can read
-- public content and the admin (authenticated) key can write.
GRANT SELECT ON public.site_settings, public.pages, public.page_sections,
                 public.services, public.portfolio_projects, public.testimonials,
                 public.team_members, public.faqs, public.menus, public.menu_items,
                 public.media_assets
  TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings, public.pages,
       public.page_sections, public.services, public.portfolio_projects,
       public.testimonials, public.team_members, public.faqs, public.menus,
       public.menu_items, public.media_assets, public.contact_messages
  TO authenticated;

GRANT INSERT ON public.contact_messages TO anon;

GRANT ALL ON public.site_settings, public.pages, public.page_sections,
             public.services, public.portfolio_projects, public.testimonials,
             public.team_members, public.faqs, public.menus, public.menu_items,
             public.media_assets, public.contact_messages
  TO service_role;

-- Allow the anon public contact-form insert (RLS).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='contact_messages'
      AND policyname='Anyone can submit a contact message'
  ) THEN
    CREATE POLICY "Anyone can submit a contact message"
      ON public.contact_messages FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;
