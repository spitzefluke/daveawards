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

-- Für "pending"/"unpassend"/"falsche_kategorie" gibt es bewusst KEINE
-- Select-Policy für "anon": normale Besucher:innen können diese
-- Einreichungen nicht einsehen – das ist die technische Umsetzung von
-- "kein Zugriff auf die Einreichungen während der Einreichungsphase".
--
-- Nur von der Jury als "passend" freigegebene Einreichungen (= die
-- Nominierten) sind öffentlich sichtbar, sobald die Voting-Phase
-- beginnt (siehe SITE_PHASE in assets/js/data.js). Das ist nötig,
-- damit die Community überhaupt sehen kann, wofür sie abstimmt.
drop policy if exists "Public can view nominees" on public.submissions;
create policy "Public can view nominees"
  on public.submissions
  for select
  to anon
  using (status = 'passend');

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


-- ============================================================
-- Voting: 15% Jury / 25% Streamer-Jury / 60% Community
-- ============================================================

-- Rollentabelle für eingeloggte Konten. Jedes Jury-Auth-Konto ohne
-- Eintrag hier gilt automatisch als normale "jury" (Rückwärtskompatibel
-- zu bereits angelegten Konten). Um jemanden zur Streamer-Jury zu
-- machen: nach dem Anlegen des Auth-Kontos hier manuell einen Eintrag
-- mit role='streamer_jury' hinzufügen, z. B.:
--   insert into public.jury_roles (user_id, role)
--   values ('<user-id-aus-auth.users>', 'streamer_jury');
create table if not exists public.jury_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'jury' check (role in ('jury', 'streamer_jury')),
  created_at timestamptz not null default now()
);

alter table public.jury_roles enable row level security;

-- Jede eingeloggte Person darf ausschließlich ihre eigene Rolle lesen
-- (nötig, damit jury.html weiß, welche Tabs/Rechte sie anzeigen soll).
drop policy if exists "Users can read own role" on public.jury_roles;
create policy "Users can read own role"
  on public.jury_roles
  for select
  to authenticated
  using (user_id = auth.uid());

-- Eine Stimme pro Kategorie und Person (Jury/Streamer-Jury) bzw. pro
-- Kategorie und Gerät (Community, siehe device_token).
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category_id text not null check (char_length(category_id) between 1 and 64),
  nominee_id uuid not null references public.submissions(id) on delete cascade,
  voter_type text not null check (voter_type in ('jury', 'streamer_jury', 'community')),
  voter_id uuid references auth.users(id) on delete cascade,
  device_token text check (device_token is null or char_length(device_token) <= 100)
);

-- Jury/Streamer-Jury: höchstens eine (aktualisierbare) Stimme pro
-- Kategorie und Person.
create unique index if not exists votes_one_per_juror
  on public.votes (category_id, voter_type, voter_id)
  where voter_id is not null;

-- Community: höchstens eine Stimme pro Kategorie und Gerät (device_token
-- wird clientseitig zufällig erzeugt und in localStorage abgelegt).
create unique index if not exists votes_one_per_device
  on public.votes (category_id, device_token)
  where device_token is not null;

create index if not exists votes_category_idx on public.votes (category_id);
create index if not exists votes_nominee_idx on public.votes (nominee_id);

alter table public.votes enable row level security;

-- Community (anon) darf abstimmen, aber nur als "community" ohne
-- eingeloggte voter_id – so kann niemand über die API eine Jury- oder
-- Streamer-Jury-Stimme faken.
drop policy if exists "Community can vote" on public.votes;
create policy "Community can vote"
  on public.votes
  for insert
  to anon
  with check (
    voter_type = 'community'
    and voter_id is null
    and device_token is not null
  );

-- Jury/Streamer-Jury dürfen nur unter ihrer eigenen user_id abstimmen,
-- und nur mit dem voter_type, der zu ihrer tatsächlichen Rolle in
-- jury_roles passt (Default ohne Eintrag = 'jury').
drop policy if exists "Jury and streamer jury can vote" on public.votes;
create policy "Jury and streamer jury can vote"
  on public.votes
  for insert
  to authenticated
  with check (
    voter_id = auth.uid()
    and device_token is null
    and voter_type = coalesce(
      (select role from public.jury_roles where user_id = auth.uid()),
      'jury'
    )
  );

-- Stimme ändern: nur die eigene Jury/Streamer-Jury-Stimme, Community-
-- Stimmen sind bewusst nicht änderbar (kein Update-Recht für anon).
drop policy if exists "Jury and streamer jury can change their vote" on public.votes;
create policy "Jury and streamer jury can change their vote"
  on public.votes
  for update
  to authenticated
  using (voter_id = auth.uid())
  with check (
    voter_id = auth.uid()
    and voter_type = coalesce(
      (select role from public.jury_roles where user_id = auth.uid()),
      'jury'
    )
  );

-- Es gibt bewusst KEINE Select-Policy für "anon" auf votes: die
-- Öffentlichkeit sieht keine Zwischenstände (kein Bandwagon-Effekt
-- während das Voting läuft).
drop policy if exists "Jury can view all votes" on public.votes;
create policy "Jury can view all votes"
  on public.votes
  for select
  to authenticated
  using (true);

-- Nominierte = alle von der Jury als "passend" eingestuften Einreichungen.
create or replace view public.nominees
  with (security_invoker = true) as
  select id, category_id, clip_url, submitter_name, note, created_at
  from public.submissions
  where status = 'passend';

-- Gewichtetes Endergebnis je Kategorie/Nominierung:
-- 15% Jury-Stimmenanteil + 25% Streamer-Jury-Stimmenanteil
-- + 60% Community-Stimmenanteil (jeweils Anteil INNERHALB der eigenen
-- Wählergruppe, damit unterschiedlich große Gruppen fair verglichen
-- werden). Nur für eingeloggte Jury/Streamer-Jury-Konten sichtbar
-- (siehe fehlende anon-Policy oben) – zum Ermitteln der Gewinner:innen
-- nach Ende der Voting-Phase im Supabase SQL Editor abfragen, z. B.:
--   select * from public.weighted_results where category_id = 'clip-des-jahres';
create or replace view public.weighted_results
  with (security_invoker = true) as
  with vote_counts as (
    select category_id, nominee_id, voter_type, count(*) as votes
    from public.votes
    group by category_id, nominee_id, voter_type
  ),
  totals as (
    select category_id, voter_type, sum(votes) as total_votes
    from vote_counts
    group by category_id, voter_type
  ),
  shares as (
    select
      vc.category_id,
      vc.nominee_id,
      vc.voter_type,
      vc.votes,
      vc.votes::numeric / nullif(t.total_votes, 0) as share
    from vote_counts vc
    join totals t using (category_id, voter_type)
  )
  select
    s.category_id,
    s.nominee_id,
    sub.clip_url,
    sub.submitter_name,
    coalesce(max(s.votes) filter (where s.voter_type = 'jury'), 0) as jury_votes,
    coalesce(max(s.votes) filter (where s.voter_type = 'streamer_jury'), 0) as streamer_jury_votes,
    coalesce(max(s.votes) filter (where s.voter_type = 'community'), 0) as community_votes,
    round(coalesce(max(s.share) filter (where s.voter_type = 'jury'), 0) * 100, 1) as jury_pct,
    round(coalesce(max(s.share) filter (where s.voter_type = 'streamer_jury'), 0) * 100, 1) as streamer_jury_pct,
    round(coalesce(max(s.share) filter (where s.voter_type = 'community'), 0) * 100, 1) as community_pct,
    round(
      (
        coalesce(max(s.share) filter (where s.voter_type = 'jury'), 0) * 0.15
        + coalesce(max(s.share) filter (where s.voter_type = 'streamer_jury'), 0) * 0.25
        + coalesce(max(s.share) filter (where s.voter_type = 'community'), 0) * 0.60
      ) * 100,
      2
    ) as weighted_score_pct
  from shares s
  join public.submissions sub on sub.id = s.nominee_id
  group by s.category_id, s.nominee_id, sub.clip_url, sub.submitter_name
  order by s.category_id, weighted_score_pct desc;
