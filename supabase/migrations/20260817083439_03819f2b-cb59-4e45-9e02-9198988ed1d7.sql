ALTER VIEW public.team_members_public SET (security_invoker = true);

GRANT SELECT (id, name, "position", bio, photo_url, social_links, skills, sort_order, created_at, updated_at, is_published) ON public.team_members TO anon;

CREATE POLICY "Public read published team safe columns"
ON public.team_members
FOR SELECT
TO anon
USING (is_published);