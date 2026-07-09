CREATE OR REPLACE FUNCTION private.can_edit(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT private.has_role(_user_id, 'admin'::public.app_role)
      OR private.has_role(_user_id, 'editor'::public.app_role);
$$;