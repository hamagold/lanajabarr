REVOKE ALL ON FUNCTION public.get_public_share(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.respond_to_share(text, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_share(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.respond_to_share(text, text, text) TO service_role;