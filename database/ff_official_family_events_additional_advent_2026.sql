-- Additional organizer/municipal family events for Advent 2026, verified 2026-11-23.
-- No automatic publication from unreviewed web sources.
insert into public.ff_official_family_events
(source_key,title,summary,category,district,city,venue,start_date,end_date,start_time,end_time,source_url,source_name,source_kind,age_note,cost_note,booking_note,checked_on,published)
values
('eberswalde-bilderbuchkino-2026-11-26','Bilderbuchkino für Kinder von 3 bis 6 Jahren','Bildergeschichten auf großer Leinwand in der Stadtbibliothek Eberswalde; ein niedrigschwelliges Vorlese- und Bilderlebnis für jüngere Kinder.','theater','barnim','Eberswalde','Stadtbibliothek, Puschkinstraße 13','2026-11-26','2026-11-26','16:30','17:00','https://www.meineberswalde.de/veranstaltungen.html','Mein Eberswalde – städtischer Veranstaltungskalender','tourism','Für Kinder von 3 bis 6 Jahren','Eintritt frei laut Kalender','','2026-11-23',true),
('eberswalde-bilderbuchkino-2026-12-17','Bilderbuchkino für Kinder von 3 bis 6 Jahren','Bilderbuch-Geschichte auf großer Leinwand in der Stadtbibliothek. Für Kinder zwischen drei und sechs Jahren; die individuelle Geschichte ist eine Überraschung.','theater','barnim','Eberswalde','Stadtbibliothek, Puschkinstraße 13','2026-12-17','2026-12-17','16:30','17:00','https://www.meineberswalde.de/veranstaltungen.html','Mein Eberswalde – städtischer Veranstaltungskalender','tourism','Für Kinder von 3 bis 6 Jahren','Eintritt frei laut Kalender','','2026-11-23',true),
('eberswalde-weihnachtsmarkt-bv-2026','Weihnachtsmarkt im Brandenburgischen Viertel','Weihnachtsmarkt mit festlichem Bühnenprogramm, Bastelangeboten und regionalen Ständen auf dem Potsdamer Platz im Brandenburgischen Viertel.','market','barnim','Eberswalde','Potsdamer Platz, Brandenburgisches Viertel','2026-12-13','2026-12-13','14:00','18:00','https://www.meineberswalde.de/veranstaltungen.html','Mein Eberswalde – städtischer Veranstaltungskalender','tourism','','Eintritt frei laut Kalender','','2026-11-23',true),
('frankfurt-weihnachtselch-2026','Der Weihnachtselch – Kindertheater','Kindertheater „Der Weihnachtselch“ vom Theater des Lachens in Frankfurt (Oder). Familienfreundliche Aufführung zur Weihnachtszeit.','theater','frankfurt-oder','Frankfurt (Oder)','Theater des Lachens, Ziegelstraße 31','2026-12-13','2026-12-13','10:00',NULL,'https://www.reiseland-brandenburg.de/veranstaltung/seenland-oder-spree/der-weihnachtselch/','Tourismus-Marketing Brandenburg','tourism','','','Vorverkauf und mögliche Änderungen bei der Originalquelle prüfen.','2026-11-23',true)
on conflict(source_key) do update set
title=excluded.title,
summary=excluded.summary,
category=excluded.category,
district=excluded.district,
city=excluded.city,
venue=excluded.venue,
start_date=excluded.start_date,
end_date=excluded.end_date,
start_time=excluded.start_time,
end_time=excluded.end_time,
source_url=excluded.source_url,
source_name=excluded.source_name,
source_kind=excluded.source_kind,
age_note=excluded.age_note,
cost_note=excluded.cost_note,
booking_note=excluded.booking_note,checked_on=excluded.checked_on,published=excluded.published,updated_at=now();
