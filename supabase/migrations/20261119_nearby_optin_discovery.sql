-- Familienfunke – freiwillige PLZ-Nähe-Suche (2026-11-19).
-- Es wird KEINE PLZ und KEINE GPS-Koordinate gespeichert; nur der offline
-- ermittelte, auf 0.01 Grad gerundete Mittelpunkt eines PLZ-Gebiets.
-- Alle fremden Koordinaten sind ausschließlich im privaten Schema.
-- Die API gibt nur EntfernungsBEREICHE und Nutzer-IDs zurück.
BEGIN;

CREATE TABLE IF NOT EXISTS private.ff_nearby_locations (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 latitude_e2 integer NOT NULL CHECK (latitude_e2 BETWEEN 4700 AND 5600),
 longitude_e2 integer NOT NULL CHECK (longitude_e2 BETWEEN 500 AND 1600),
 enabled boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.ff_nearby_locations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.ff_nearby_locations FROM PUBLIC, anon, authenticated;
COMMENT ON TABLE private.ff_nearby_locations IS
 'Nur opt-in: gerundete PLZ-Gebietsmittelpunkte. Keine Postleitzahl, GPS-Position oder Privatadresse.';

CREATE OR REPLACE FUNCTION private.ff_centroid_distance_km(
 lat1 integer, lon1 integer, lat2 integer, lon2 integer
) RETURNS double precision LANGUAGE sql IMMUTABLE STRICT
SET search_path=''
AS $body$
  SELECT 6371.0088 * 2 * asin(
    least(1.0::double precision,sqrt(
      power(sin(radians((lat1-lat2)/100.0)/2),2)
      + cos(radians(lat1/100.0)) * cos(radians(lat2/100.0))
      * power(sin(radians((lon1-lon2)/100.0)/2),2)
    ))
  );
$body$;
REVOKE ALL ON FUNCTION private.ff_centroid_distance_km(integer,integer,integer,integer) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ff_nearby_status()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=''
AS $body$
 SELECT EXISTS (
  SELECT 1 FROM private.ff_nearby_locations l
  WHERE l.user_id=(SELECT auth.uid()) AND l.enabled
 );
$body$;
REVOKE ALL ON FUNCTION public.ff_nearby_status() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_nearby_status() TO authenticated;

CREATE OR REPLACE FUNCTION public.ff_set_nearby_location(
 p_lat_e2 integer DEFAULT NULL,
 p_lon_e2 integer DEFAULT NULL,
 p_enabled boolean DEFAULT true
) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=''
AS $body$
DECLARE v_uid uuid := (SELECT auth.uid());
BEGIN
 IF v_uid IS NULL THEN
  RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000';
 END IF;
 -- A switch-off permanently deletes the saved coordinates, even if the
 -- user is now suspended or hidden.
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
 INSERT INTO private.ff_nearby_locations(user_id,latitude_e2,longitude_e2,enabled)
 VALUES(v_uid,p_lat_e2,p_lon_e2,true)
 ON CONFLICT (user_id) DO UPDATE SET
 latitude_e2=excluded.latitude_e2,
 longitude_e2=excluded.longitude_e2,
 enabled=true,updated_at=now();
 RETURN true;
END;
$body$;
REVOKE ALL ON FUNCTION public.ff_set_nearby_location(integer,integer,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_set_nearby_location(integer,integer,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.ff_nearby_families(p_radius_km integer DEFAULT 25)
RETURNS TABLE(user_id uuid,distance_band text,distance_bucket integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path=''
AS $body$
DECLARE v_uid uuid := (SELECT auth.uid());
BEGIN
 IF v_uid IS NULL THEN
  RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000';
 END IF;
 IF p_radius_km NOT IN (10,25,50,100) THEN
  RAISE EXCEPTION 'Unsupported search radius' USING ERRCODE='22023';
 END IF;
 IF NOT private.is_active_adult(v_uid)
    OR NOT EXISTS (SELECT 1 FROM public.profiles p
                   WHERE p.user_id=v_uid AND p.is_discoverable) THEN
  RETURN;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM private.ff_nearby_locations l
                WHERE l.user_id=v_uid AND l.enabled) THEN
  RETURN;
 END IF;
 RETURN QUERY
 WITH distances AS (
  SELECT target.user_id AS candidate_id,
   private.ff_centroid_distance_km(
     mine.latitude_e2,mine.longitude_e2,
     target.latitude_e2,target.longitude_e2
   ) AS km
  FROM private.ff_nearby_locations mine
  JOIN private.ff_nearby_locations target ON target.enabled
  JOIN public.profiles p ON p.user_id=target.user_id
  WHERE mine.user_id=v_uid AND mine.enabled
    AND target.user_id<>v_uid
    AND p.moderation_status='approved' AND p.is_discoverable
    AND private.is_active_adult(target.user_id)
    AND NOT EXISTS(
      SELECT 1 FROM public.blocks b
      WHERE (b.blocker_id=v_uid AND b.blocked_id=target.user_id)
         OR (b.blocker_id=target.user_id AND b.blocked_id=v_uid)
    )
 )
 SELECT d.candidate_id,
  CASE WHEN d.km<=10 THEN 'bis 10 km'
       WHEN d.km<=25 THEN '10–25 km'
       WHEN d.km<=50 THEN '25–50 km'
       ELSE '50–100 km' END,
  CASE WHEN d.km<=10 THEN 1
       WHEN d.km<=25 THEN 2
       WHEN d.km<=50 THEN 3 ELSE 4 END
 FROM distances d
 WHERE d.km<=p_radius_km
 ORDER BY 3,1
 LIMIT 60;
END;
$body$;
REVOKE ALL ON FUNCTION public.ff_nearby_families(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_nearby_families(integer) TO authenticated;

COMMIT;

-- Security boundaries:
-- * No direct SELECT/INSERT/UPDATE/DELETE access to private locations.
-- * Both users must opt in and pass adult/profile/status checks.
-- * Only authenticated callers; no real coordinates returned.
-- * Any account may immediately turn its own visibility OFF and erase location.
-- * Inaccuracies stem from postal area centroid + 0.01 degree rounding.
-- * Exhaustive probing by multiple accounts remains a privacy review item.
