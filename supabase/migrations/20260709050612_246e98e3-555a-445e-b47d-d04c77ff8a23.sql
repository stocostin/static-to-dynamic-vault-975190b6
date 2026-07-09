REVOKE SELECT ON public.team_members FROM anon;
GRANT SELECT (id, name, position, bio, photo_url, sort_order, is_published, created_at, updated_at) ON public.team_members TO anon;