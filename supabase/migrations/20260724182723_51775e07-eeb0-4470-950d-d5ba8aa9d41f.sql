-- Restrict anonymous access to non-sensitive team_members columns only.
-- Remove blanket table-level SELECT for anon and grant per-column access instead.
REVOKE SELECT ON public.team_members FROM anon;

GRANT SELECT
  (id, name, position, bio, photo_url, social_links, skills, is_published, sort_order, created_at, updated_at)
  ON public.team_members TO anon;

-- Drop the duplicate/overly-broad anon SELECT policies and replace with a single
-- clear policy. RLS still gates rows; column grants gate which columns anon can read.
DROP POLICY IF EXISTS "Public can read published team members" ON public.team_members;
DROP POLICY IF EXISTS "Public read team" ON public.team_members;

CREATE POLICY "Public read published team (safe columns)"
  ON public.team_members
  FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "Authenticated read team"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (is_published OR private.can_edit(auth.uid()));