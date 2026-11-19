-- Nähe-Suche: replizierbare 24h-Wechselsperre für Postleitzahl-Gebietsmittelpunkte.
-- Erst nach ff_nearby_optin_discovery.sql ausführen.
CREATE TABLE IF NOT EXISTS private.ff_nearby_change_limits (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 last_changed_at timestamptz NOT NULL DEFAULT 'epoch'::timestamptz
);
ALTER TABLE private.ff_nearby_change_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.ff_nearby_change_limits FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ff_set_nearby_location(p_lat_e2 integer DEFAULT NULL::integer, p_lon_e2 integer DEFAULT NULL::integer, p_enabled boolean DEFAULT true)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_uid uuid := (SELECT auth.uid());
 v_changed_at timestamptz;
BEGIN
 IF v_uid IS NULL THEN
  RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000';
 END IF;
 -- Do not delay deletion/opt-out, even for suspended or rejected accounts.
 IF p_enabled IS NOT TRUE THEN
  DELETE FROM private.ff_nearby_locations WHERE user_id=v_uid;
  RETURN false;
 END IF;
 IF NOT private.is_active_adult(v_uid)
    OR NOT EXISTS (SELECT 1 FROM public.profiles p
                   WHERE p.user_id=v_uid AND p.is_discoverable) THEN
  RAISE EXCEPTION 'Nearby discovery requires a visible verified adult profile'
    USING ERRCODE='42501';
 END IF;
 IF p_lat_e2 IS NULL OR p_lon_e2 IS NULL
    OR p_lat_e2 NOT BETWEEN 4700 AND 5600
    OR p_lon_e2 NOT BETWEEN 500 AND 1600 THEN
  RAISE EXCEPTION 'Invalid approximate Germany area coordinates'
    USING ERRCODE='22023';
 END IF;
 -- Keeping the same area does not count as another location change.
 IF EXISTS(SELECT 1 FROM private.ff_nearby_locations l
   WHERE l.user_id=v_uid AND l.enabled AND
         l.latitude_e2=p_lat_e2 AND l.longitude_e2=p_lon_e2) THEN
  RETURN true;
 END IF;
 INSERT INTO private.ff_nearby_change_limits(user_id,last_changed_at)
 VALUES (v_uid,'epoch'::timestamptz)
 ON CONFLICT (user_id) DO NOTHING;
 SELECT last_changed_at INTO v_changed_at
 FROM private.ff_nearby_change_limits WHERE user_id=v_uid FOR UPDATE;
 IF v_changed_at>now()-interval '24 hours' THEN
  RAISE EXCEPTION 'FF_NEARBY_CHANGE_LIMIT'
    USING ERRCODE='P0001',
          HINT='Approximate location may be changed once every 24 hours; opt-out is always possible.';
 END IF;
 INSERT INTO private.ff_nearby_locations(user_id,latitude_e2,longitude_e2,enabled)
 VALUES(v_uid,p_lat_e2,p_lon_e2,true)
 ON CONFLICT (user_id) DO UPDATE SET
 latitude_e2=excluded.latitude_e2,
 longitude_e2=excluded.longitude_e2,
 enabled=true,updated_at=now();
 UPDATE private.ff_nearby_change_limits SET last_changed_at=now() WHERE user_id=v_uid;
 RETURN true;
END;
$function$
REVOKE ALL ON FUNCTION public.ff_set_nearby_location(integer,integer,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_set_nearby_location(integer,integer,boolean) TO authenticated;
