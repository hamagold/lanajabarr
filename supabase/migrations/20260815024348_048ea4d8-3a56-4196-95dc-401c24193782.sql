-- Trigger helper should never be callable via the API
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Share functions: remove blanket PUBLIC execute, grant explicitly
REVOKE ALL ON FUNCTION public.get_public_share(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.respond_to_share(text, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_share(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_share(text, text, text) TO anon, authenticated;