
-- 1. Drop overly permissive public write policies on chat tables (server uses service role instead)
DROP POLICY IF EXISTS "Anyone can update a chat conversation by session" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can create a chat conversation" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.chat_messages;

-- 2. Remove public SELECT policy on media_assets metadata table
DROP POLICY IF EXISTS "Public can read media assets" ON public.media_assets;

-- 3. Revoke EXECUTE on SECURITY DEFINER helper functions from anon/authenticated.
-- They are called from within RLS policies and triggers (which run as the function owner),
-- so revoking API-level EXECUTE does not affect internal usage.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_edit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_content_version() FROM PUBLIC, anon, authenticated;

-- next_document_number is invoked from admin UI by editors via PostgREST RPC; keep it callable
-- by signed-in users (its own body enforces can_edit()), but not by anonymous.
REVOKE EXECUTE ON FUNCTION public.next_document_number(public.doc_type) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_document_number(public.doc_type) TO authenticated;
