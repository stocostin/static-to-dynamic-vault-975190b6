DROP POLICY IF EXISTS "Public read published team" ON public.team_members;

REVOKE ALL ON public.team_members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

ALTER VIEW public.team_members_public SET (security_invoker = false);
GRANT SELECT ON public.team_members_public TO anon, authenticated;