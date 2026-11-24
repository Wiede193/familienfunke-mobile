-- Familienfunke: mehr freiwillige Profilinteressen ermöglichen.
-- Bereits vorhandene Werte bleiben unverändert. RLS, Moderation und
-- Profil-Sichtbarkeit werden nicht verändert.
begin;
alter table public.profiles drop constraint if exists profiles_interests_check;
alter table public.profiles
  add constraint profiles_interests_check check (cardinality(interests) <= 24);
commit;
