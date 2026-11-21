-- ENTWURF / NICHT AUSGEFÜHRT: vor Produktiveinsatz prüfen und als Migration anwenden.
-- Familienbasar: eigene strukturierte Größen, serverseitig suchbar.
-- Anzeigentext bleibt lesbar, aber nie die autoritative Größen-Suchquelle.
BEGIN;

ALTER TABLE public.ff_market_listings
  ADD COLUMN IF NOT EXISTS size_labels text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.ff_market_listings
  ADD CONSTRAINT ff_market_size_labels_safe CHECK (
    cardinality(size_labels)<=40
    AND array_position(size_labels,NULL) IS NULL
  );

CREATE INDEX IF NOT EXISTS ff_market_listings_size_labels_gin
  ON public.ff_market_listings USING GIN (size_labels);

-- Einmalige Übernahme erkennbarer, explizit geschriebener Größen aus älteren
-- Anzeigen. Ab danach: ausschließlich size_labels schreiben und abfragen.
WITH legacy AS (
 SELECT old.id,
        array_agg(DISTINCT parts.size ORDER BY parts.size) AS labels
 FROM public.ff_market_listings old
 CROSS JOIN LATERAL regexp_matches(
   concat_ws(E'\n',old.title,old.description),
   '(?:Größe[[:space:]]*:[[:space:]]*|Gr[.][[:space:]]*)([[:digit:]]{1,3}(?:[[:space:]]*/[[:space:]]*[[:digit:]]{1,3})?)',
   'gi'
 ) AS found
 CROSS JOIN LATERAL unnest(
   string_to_array(regexp_replace(found[1],'[[:space:]]','','g'),'/')
 ) AS parts(size)
 WHERE old.category IN ('Kleidung','Babyausstattung')
 GROUP BY old.id
)
UPDATE public.ff_market_listings l
SET size_labels=legacy.labels
FROM legacy
WHERE l.id=legacy.id AND cardinality(l.size_labels)=0;

-- Die Größen kommen aus der UI als geprüfte einzelne Tokens, z.B. 98,104.
-- Der Aufruf bleibt an RLS gebunden; keine SECURITY-DEFINER-Suche.
CREATE OR REPLACE FUNCTION public.ff_market_search(
  p_query text DEFAULT '',
  p_category text DEFAULT NULL,
  p_size text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_trade_type text DEFAULT NULL,
  p_min_price integer DEFAULT NULL,
  p_max_price integer DEFAULT NULL,
  p_sort text DEFAULT 'newest',
  p_only_mine boolean DEFAULT false,
  p_only_favorites boolean DEFAULT false,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 81
)
RETURNS SETOF public.ff_market_listings
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = ''
AS $function$
 SELECT l.*
 FROM public.ff_market_listings l
 WHERE (
   (p_only_mine AND l.seller_id=(SELECT auth.uid()))
   OR (NOT p_only_mine AND l.moderation_status='approved')
 )
 AND (p_category IS NULL OR p_category='' OR p_category='Alle' OR l.category=p_category)
 AND (p_size IS NULL OR p_size='' OR p_size='Alle' OR l.size_labels @> ARRAY[p_size]::text[])
 AND (p_region IS NULL OR p_region='' OR p_region='Alle' OR lower(btrim(l.region_label))=lower(btrim(p_region)))
 AND (p_trade_type IS NULL OR p_trade_type='all' OR l.trade_type=p_trade_type)
 AND (p_min_price IS NULL OR (l.trade_type='sell' AND l.price_cents>=p_min_price))
 AND (p_max_price IS NULL OR (l.trade_type='sell' AND l.price_cents<=p_max_price))
 AND (p_query IS NULL OR btrim(p_query)='' OR position(
   lower(left(btrim(p_query),100)) IN lower(concat_ws(' ',l.title,l.description,l.region_label,l.category))
 )>0)
 AND (NOT p_only_favorites OR EXISTS(
   SELECT 1 FROM public.ff_market_favorites fav
   WHERE fav.listing_id=l.id AND fav.user_id=(SELECT auth.uid())
 ))
 ORDER BY
   CASE WHEN p_sort='low' THEN l.price_cents END ASC NULLS LAST,
   CASE WHEN p_sort='high' THEN l.price_cents END DESC NULLS LAST,
   l.created_at DESC,l.id DESC
 LIMIT LEAST(GREATEST(p_limit,1),81)
 OFFSET LEAST(GREATEST(p_offset,0),100000)
$function$;
REVOKE ALL ON FUNCTION public.ff_market_search(text,text,text,text,text,integer,integer,text,boolean,boolean,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ff_market_search(text,text,text,text,text,integer,integer,text,boolean,boolean,integer,integer) TO authenticated;

-- Versionierte Bearbeitung mit Größenindex: Rechtekontrolle wie bisher.
CREATE OR REPLACE FUNCTION public.ff_market_edit_listing_v2(
 p_listing_id uuid, p_title text,p_description text,p_category text,
 p_item_condition text,p_trade_type text,p_price_cents integer,
 p_region_label text,p_size_labels text[]
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_user uuid:=(SELECT auth.uid());
BEGIN
 IF v_user IS NULL OR NOT private.is_active_adult(v_user) THEN RETURN false; END IF;
 IF p_title IS NULL OR char_length(btrim(p_title)) NOT BETWEEN 4 AND 100
 OR p_description IS NULL OR char_length(p_description)>1500
 OR p_category IS NULL OR p_category NOT IN ('Kleidung','Spielzeug','Bücher','Babyausstattung','Möbel','Sonstiges')
 OR p_item_condition IS NULL OR p_item_condition NOT IN ('Neu','Sehr gut','Gut','Gebraucht')
 OR p_trade_type IS NULL OR p_trade_type NOT IN ('sell','gift','swap')
 OR p_price_cents IS NULL OR p_price_cents NOT BETWEEN 0 AND 10000000
 OR (p_trade_type<>'sell' AND p_price_cents<>0)
 OR p_region_label IS NULL OR char_length(p_region_label)>80
 OR p_size_labels IS NULL OR cardinality(p_size_labels)>40
 OR EXISTS(
    SELECT 1 FROM unnest(p_size_labels) AS v(size)
    WHERE v.size IS NULL OR char_length(v.size)>20 OR
          v.size !~ '^(?:[0-9]{1,3}(?:[.][05])?|XXS|XS|S|M|L|XL|XXL|3XL)$'
 ) THEN RETURN false; END IF;
 UPDATE public.ff_market_listings SET
   title=btrim(p_title),description=p_description,
   category=p_category,item_condition=p_item_condition,
   trade_type=p_trade_type,price_cents=p_price_cents,
   region_label=p_region_label,size_labels=p_size_labels,
   moderation_status='pending',review_version=review_version+1
 WHERE id=p_listing_id AND seller_id=v_user
   AND moderation_status IN ('pending','approved','rejected');
 RETURN found;
END;
$function$;
REVOKE ALL ON FUNCTION public.ff_market_edit_listing_v2(uuid,text,text,text,text,text,integer,text,text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ff_market_edit_listing_v2(uuid,text,text,text,text,text,integer,text,text[]) TO authenticated;

-- Ältere App-Versionen setzen beim Bearbeiten veraltete Größentags zurück,
-- damit der strukturierte Index keine nachweislich überholten Angaben enthält.
CREATE OR REPLACE FUNCTION public.ff_market_edit_listing(
 p_listing_id uuid,p_title text,p_description text,p_category text,
 p_item_condition text,p_trade_type text,p_price_cents integer,p_region_label text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_user uuid:=(SELECT auth.uid());
BEGIN
 IF v_user IS NULL OR NOT private.is_active_adult(v_user) THEN RETURN false; END IF;
 IF p_title IS NULL OR char_length(btrim(p_title)) NOT BETWEEN 4 AND 100
 OR p_description IS NULL OR char_length(p_description)>1500
 OR p_category IS NULL OR p_category NOT IN ('Kleidung','Spielzeug','Bücher','Babyausstattung','Möbel','Sonstiges')
 OR p_item_condition IS NULL OR p_item_condition NOT IN ('Neu','Sehr gut','Gut','Gebraucht')
 OR p_trade_type IS NULL OR p_trade_type NOT IN ('sell','gift','swap')
 OR p_price_cents IS NULL OR p_price_cents NOT BETWEEN 0 AND 10000000
 OR (p_trade_type<>'sell' AND p_price_cents<>0)
 OR p_region_label IS NULL OR char_length(p_region_label)>80 THEN RETURN false; END IF;
 UPDATE public.ff_market_listings SET
   title=btrim(p_title),description=p_description,
   category=p_category,item_condition=p_item_condition,
   trade_type=p_trade_type,price_cents=p_price_cents,
   region_label=p_region_label,size_labels='{}'::text[],
   moderation_status='pending',review_version=review_version+1
 WHERE id=p_listing_id AND seller_id=v_user
   AND moderation_status IN ('pending','approved','rejected');
 RETURN found;
END;
$function$;

COMMIT;
