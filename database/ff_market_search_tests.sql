-- Run in the SQL editor; the transaction ROLLS BACK all temporary index changes.
-- Tests exact color, size and type and prevents matching different items in a package.
begin;
do $test$
declare
  target uuid;
  exact_query tsquery:=plainto_tsquery('german',private.ff_market_normalize_query('Kinderjeans Größe 110 blau'));
  wrong_query tsquery:=plainto_tsquery('german',private.ff_market_normalize_query('Jeans Größe 116 rot'));
  count_rows int;
  count_hits int;
  wrong_hits int;
begin
  select id into target from public.ff_market_listings limit 1;
  if target is null then raise notice 'No listings to use for transactional test'; return; end if;
  perform private.ff_market_rebuild_search(target,'Kleidung','2-teiliges Kleidungspaket',
    E'Artikel-Steckbrief\n\nPersönliche Notiz:\nPaketinhalt:\n1. Kinderjeans · Gr. 110 · blau\n2. Pullover · Gr. 116 · rot\n\nPersönliche Ergänzung:\n');
  select count(*) into count_rows from private.ff_market_search_items where listing_id=target;
  select count(*) into count_hits from private.ff_market_search_items
    where listing_id=target and search_vector @@ exact_query;
  select count(*) into wrong_hits from private.ff_market_search_items
    where listing_id=target and search_vector @@ wrong_query;
  if count_rows<>2 or count_hits<>1 or wrong_hits<>0 then
    raise exception 'Incorrect package search: rows %, correct hits %, cross-item wrong hits %',
      count_rows,count_hits,wrong_hits;
  end if;
end;
$test$;
rollback;
