DROP POLICY IF EXISTS "Anyone with the link can respond" ON public.location_shares;
DROP POLICY IF EXISTS "Anyone with the link can view a share" ON public.location_shares;

REVOKE ALL ON public.location_shares FROM anon;

CREATE OR REPLACE FUNCTION public.get_public_share(p_id text)
RETURNS TABLE (id text, data jsonb, locations jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.data, s.locations
  FROM public.location_shares s
  WHERE s.id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_share(p_id text, p_location_id text, p_comment text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_data jsonb;
BEGIN
  UPDATE public.location_shares s
  SET data = s.data
        || jsonb_build_object(
             'selectedLocationId', p_location_id,
             'selectedAt', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
             'clientComment', coalesce(p_comment, '')
           )
  WHERE s.id = p_id
    AND s.locations @> jsonb_build_array(jsonb_build_object('id', p_location_id))
  RETURNING s.data INTO v_data;

  RETURN v_data;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_share(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_share(text, text, text) TO anon, authenticated;