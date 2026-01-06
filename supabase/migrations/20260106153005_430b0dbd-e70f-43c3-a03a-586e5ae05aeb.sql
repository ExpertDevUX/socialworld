-- Grant execute permissions on the security definer functions
GRANT EXECUTE ON FUNCTION public.is_user_in_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Also ensure the anon role can't bypass
REVOKE ALL ON FUNCTION public.is_user_in_conversation(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM anon;