-- Pickleball / Group Event Tracker — initial schema
-- Paste this whole file into the Supabase SQL Editor and press Run.
-- Safe to re-run: every statement is guarded.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- players: everyone in the friend group, plus any walk-in added on the spot
-- ---------------------------------------------------------------------------
create table if not exists players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null default 'emerald',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Names are matched case-insensitively so "Ricky" and "ricky" are one person.
create unique index if not exists players_name_key on players (lower(name));

-- ---------------------------------------------------------------------------
-- events: one pickleball session, birthday, or other hangout
-- ---------------------------------------------------------------------------
create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  kind       text not null default 'pickleball'
             check (kind in ('pickleball', 'birthday', 'other')),
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  venue_name text,
  maps_url   text,
  notes      text,
  total_cost numeric(12, 2),          -- null = free event, no money tracking
  created_at timestamptz not null default now()
);

create index if not exists events_starts_at_idx on events (starts_at);

-- ---------------------------------------------------------------------------
-- event_players: one row per person per event — their RSVP, whether they
-- actually showed up, and their money status
-- ---------------------------------------------------------------------------
create table if not exists event_players (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events (id) on delete cascade,
  player_id      uuid not null references players (id) on delete cascade,
  rsvp           text not null default 'no_reply'
                 check (rsvp in ('going', 'maybe', 'out', 'no_reply')),
  attended       boolean not null default false,
  share_override numeric(12, 2),      -- null = use the equal split
  paid           boolean not null default false,
  paid_note      text,                -- e.g. "GCash ref 1234", "paid cash"
  created_at     timestamptz not null default now(),
  unique (event_id, player_id)
);

create index if not exists event_players_event_idx on event_players (event_id);

-- ---------------------------------------------------------------------------
-- Lock the database down.
--
-- RLS is enabled with NO policies, which means anon and authenticated clients
-- can read and write nothing at all. The app reaches the database only from
-- the Next.js server using the service_role key, which bypasses RLS and never
-- leaves the server. So a leaked site URL gives a stranger no data access.
-- ---------------------------------------------------------------------------
alter table players       enable row level security;
alter table events        enable row level security;
alter table event_players enable row level security;

-- ---------------------------------------------------------------------------
-- Optional: seed your regulars so the roster isn't empty on first load.
-- Edit these names (or delete the block) before running — you can also add
-- players from the Players tab in the app at any time.
-- ---------------------------------------------------------------------------
insert into players (name, color) values
  ('Ricky', 'emerald')
on conflict do nothing;
