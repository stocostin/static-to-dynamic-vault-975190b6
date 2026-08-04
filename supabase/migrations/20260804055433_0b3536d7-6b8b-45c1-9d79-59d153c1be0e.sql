ALTER VIEW public.team_members_public SET (security_invoker = on);

-- Anonymous visitors: safe columns only, published rows only
GRANT SELECT (id, name, position, bio, photo_url, social_links, skills, sort_order, is_published, created_at, updated_at)
  ON public.team_members TO anon;

DROP POLICY IF EXISTS "Public read published team" ON public.team_members;
CREATE POLICY "Public read published team" ON public.team_members
  FOR SELECT TO anon
  USING (is_published);