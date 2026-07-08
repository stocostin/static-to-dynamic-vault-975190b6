
-- 1. team_members: restrict anon column access to hide email/phone
REVOKE SELECT ON public.team_members FROM anon;
GRANT SELECT (id, name, position, bio, photo_url, social_links, skills, is_published, sort_order, created_at, updated_at)
  ON public.team_members TO anon;

-- 2. contact_messages: drop overly-permissive duplicate INSERT policies (keep validated one)
DROP POLICY IF EXISTS "Anyone can submit a contact message" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

-- 3. Move SECURITY DEFINER helpers out of PostgREST-exposed public schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.can_edit(uuid) SET SCHEMA private;
ALTER FUNCTION public.bootstrap_first_admin() SET SCHEMA private;
ALTER FUNCTION public.bump_content_version() SET SCHEMA private;

-- Ensure EXECUTE remains for RLS/trigger evaluation
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.can_edit(uuid) TO authenticated, anon, service_role;

-- 4. Convert next_document_number to SECURITY INVOKER with explicit editor check
--    Requires an editor UPDATE policy on document_counters
DROP POLICY IF EXISTS "Editors update counters" ON public.document_counters;
CREATE POLICY "Editors update counters" ON public.document_counters
  FOR UPDATE TO authenticated
  USING (private.can_edit(auth.uid()))
  WITH CHECK (private.can_edit(auth.uid()));

CREATE OR REPLACE FUNCTION public.next_document_number(_type doc_type)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  _next integer;
BEGIN
  IF NOT private.can_edit(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.document_counters
    SET last_number = last_number + 1, updated_at = now()
    WHERE doc_type = _type
    RETURNING last_number INTO _next;
  RETURN _next;
END;
$function$;
