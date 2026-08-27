-- DaveAwards – Supabase-Datenbankschema
--
-- Einmalig im Supabase-Projekt unter "SQL Editor" ausführen.
-- Danach unter "Authentication" → "Users" mindestens ein Jury-Konto
-- (E-Mail + Passwort) anlegen – das ist das "Passwort-Gateway" für den
-- Jury-Bereich (jury.html). Jede Person mit einem solchen Login gilt
-- als Jury-Mitglied.

create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category_id text not null check (char_length(category_id) between 1 and 64),
  clip_url text not null check (
    char_length(clip_url) between 1 and 500
    and clip_url ~* '^https?://'
  ),
  submitter_name text check (submitter_name is null or char_length(submitter_name) <= 80),
  note text check (note is null or char_length(note) <= 500),
  status text not null default 'pending'
    check (status in ('pending', 'passend', 'unpassend', 'falsche_kategorie')),
  suggested_category_id text check (suggested_category_id is null or char_length(suggested_category_id) <= 64),
  reviewed_at timestamptz,
  reviewed_by text
);

create index if not exists submissions_category_idx on public.submissions (category_id);
create index if not exists submissions_status_idx on public.submissions (status);

alter table public.submissions enable row level security;

-- Jede/r Besucher:in (auch ohne Login) darf neue Einreichungen anlegen,
-- aber NUR im Ausgangszustand "pending" ohne Jury-Felder – so kann
-- niemand über die API direkt eine "passend"-Bewertung faken.
drop policy if exists "Public can submit clips" on public.submissions;
create policy "Public can submit clips"
  on public.submissions
  for insert
  to anon
  with check (
    status = 'pending'
    and suggested_category_id is null
    and reviewed_at is null
    and reviewed_by is null
  );

-- Es gibt bewusst KEINE Select-Policy für "anon": normale Besucher:innen
-- können die Liste der Einreichungen nicht einsehen (weder eigene noch
-- fremde) – das ist die technische Umsetzung von "kein Zugriff auf die
-- Kategorien/Einreichungen während der Einreichungsphase".

-- Jury (jeder eingeloggte Supabase-Auth-User) darf alles sehen und bewerten.
drop policy if exists "Jury can view all submissions" on public.submissions;
create policy "Jury can view all submissions"
  on public.submissions
  for select
  to authenticated
  using (true);

drop policy if exists "Jury can review submissions" on public.submissions;
create policy "Jury can review submissions"
  on public.submissions
  for update
  to authenticated
  using (true)
  with check (true);
