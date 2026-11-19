-- Bugfix für bereits aktivierte Datenbankmigration: Spaltenname in RPC qualifizieren.
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
