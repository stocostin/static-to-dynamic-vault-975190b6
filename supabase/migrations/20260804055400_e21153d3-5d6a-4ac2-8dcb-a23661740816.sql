CREATE OR REPLACE VIEW public.team_members_public AS
SELECT id, name, position, bio, photo_url, social_links, skills, sort_order, created_at, updated_at
FROM public.team_members
WHERE is_published;

ALTER VIEW public.team_members_public SET (security_invoker = off);

GRANT SELECT ON public.team_members_public TO anon, authenticated;

DROP POLICY IF EXISTS "Public read team" ON public.team_members;
DROP POLICY IF EXISTS "Public read published team (safe columns)" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated read team" ON public.team_members;

REVOKE SELECT ON public.team_members FROM anon;
REVOKE SELECT ON public.team_members FROM authenticated;
GRANT SELECT ON public.team_members TO authenticated;

CREATE POLICY "Editors read team" ON public.team_members
  FOR SELECT TO authenticated
  USING (private.can_edit(auth.uid()));