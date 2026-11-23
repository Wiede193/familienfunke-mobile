-- Source-confirmed child theatre performances for Advent and Christmas 2026.
-- Exact dated show sessions, not inferred repeats. Reviewed 2026-11-23.
insert into public.ff_official_family_events(source_key,title,summary,category,district,city,venue,start_date,end_date,start_time,end_time,source_url,source_name,source_kind,age_note,cost_note,booking_note,checked_on,published)
values
('ffo-weihnachtsgans-auguste-2026-12-06','Die Weihnachtsgans Auguste · Kindertheater','Weihnachtliche Puppentheatergeschichte nach Friedrich Wolf über die Gans Auguste und die Familie Löwenhaupt. Spielort und Eintrittskonditionen direkt beim Theater kontrollieren.','theater','frankfurt-oder','Frankfurt (Oder)','Theater des Lachens, Ziegelstraße 31','2026-12-06','2026-12-06','10:00',NULL,'https://www.reiseland-brandenburg.de/veranstaltung/seenland-oder-spree/weihnachtsgans-auguste/','Tourismus-Marketing Brandenburg','tourism','Kinderprogramm; individuelle Altersempfehlung beim Theater prüfen','','Ticketverfügbarkeit und eventuelle Programmänderungen beim Veranstalter prüfen.','2026-11-23',true),
('bad-saarow-weihnachtsgeschichte-2026-12-13','Eine Weihnachtsgeschichte · Theater am See','Weihnachtliche Familieninszenierung nach Charles Dickens mit Schauspiel und Projektionen im Theater am See Bad Saarow. Einlass, Tickets und Eignung für jüngere Kinder beim Veranstalter prüfen.','theater','oder-spree','Bad Saarow','Theater am See, Seestraße 22','2026-12-13','2026-12-13','15:00','17:00','https://www.reiseland-brandenburg.de/veranstaltung/seenland-oder-spree/eine-weihnachtsgeschichte-im-theater-am-see-bad-saarow/','Tourismus-Marketing Brandenburg','tourism','Als Familienerlebnis angekündigt','','Ticketverfügbarkeit und eventuelle Programmänderungen beim Veranstalter prüfen.','2026-11-23',true),
('bad-freienwalde-weihnachtsfest-gans-2026-12-26','Weihnachtsfest mit/ohne Gans · Puppenspiel','Weihnachtliches Puppenspiel über eine listige Gans und hungrige Waldbewohner. Aufführung im Hof-Theater Bad Freienwalde für Kinder ab vier Jahren.','theater','maerkisch-oderland','Bad Freienwalde (Oder)','Hof-Theater, Königstraße 11','2026-12-26','2026-12-26','16:00','17:00','https://www.reiseland-brandenburg.de/veranstaltung/seenland-oder-spree/weihnachtsfest-mit-strich-ohne-gans/','Tourismus-Marketing Brandenburg','tourism','Ab 4 Jahren','','Ticketverfügbarkeit und eventuelle Programmänderungen beim Veranstalter prüfen.','2026-11-23',true),
('bad-freienwalde-weihnachtsfest-gans-2026-12-27','Weihnachtsfest mit/ohne Gans · Puppenspiel','Weihnachtliches Puppenspiel über eine listige Gans und hungrige Waldbewohner. Zweiter Aufführungstag im Hof-Theater Bad Freienwalde für Kinder ab vier Jahren.','theater','maerkisch-oderland','Bad Freienwalde (Oder)','Hof-Theater, Königstraße 11','2026-12-27','2026-12-27','16:00','17:00','https://www.reiseland-brandenburg.de/veranstaltung/seenland-oder-spree/weihnachtsfest-mit-strich-ohne-gans/','Tourismus-Marketing Brandenburg','tourism','Ab 4 Jahren','','Ticketverfügbarkeit und eventuelle Programmänderungen beim Veranstalter prüfen.','2026-11-23',true),
('frankfurt-traumzauberbaum-2026-12-20','Der Traumzauberbaum – Herr Kellerstaub rettet Weihnachten','Familienmusical mit Liedern und fantasievollen Figuren rund um den Traumzauberbaum. Die Show wird für Kinder ab drei Jahren angekündigt und findet im Kleist Forum statt.','theater','frankfurt-oder','Frankfurt (Oder)','Kleist Forum, Platz der Einheit 1','2026-12-20','2026-12-20','16:00','18:00','https://www.reiseland-brandenburg.de/veranstaltung/seenland-oder-spree/der-traumzauberbaum-herr-kellerstaub-rettet-weihnachten/','Tourismus-Marketing Brandenburg','tourism','Ab 3 Jahren','','Ticketverfügbarkeit und eventuelle Programmänderungen beim Veranstalter prüfen.','2026-11-23',true)
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
 booking_note=excluded.booking_note,
 checked_on=excluded.checked_on,
 published=excluded.published,
 updated_at=now();
