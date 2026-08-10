ALTER VIEW public.team_members_public SET (security_invoker = true);

-- anon may read only non-contact columns, enforced by column-level privileges
REVOKE ALL ON public.team_members FROM anon;
GRANT SELECT (id, name, "position", bio, photo_url, social_links, skills, sort_order, is_published, created_at, updated_at)
  ON public.team_members TO anon;

CREATE POLICY "Public read published team" ON public.team_members
  FOR SELECT TO anon USING (is_published);

GRANT SELECT ON public.team_members_public TO anon, authenticated;