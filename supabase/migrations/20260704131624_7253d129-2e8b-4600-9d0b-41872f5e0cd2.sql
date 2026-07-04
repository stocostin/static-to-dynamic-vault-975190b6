
CREATE OR REPLACE FUNCTION public.bump_content_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.site_settings (key, value)
  VALUES ('content_version', to_jsonb(extract(epoch from clock_timestamp())::text))
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = now();
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bump_content_version() FROM PUBLIC, anon, authenticated;
