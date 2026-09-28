-- Pickle — round 2
-- Adds: who created an event, a soft "admin" flag, and per-event payment
-- details (GCash number plus up to two QR images).
--
-- Paste this whole file into the Supabase SQL Editor and press Run.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Who made the event, and who can clean up after everyone
-- ---------------------------------------------------------------------------
alter table events
  add column if not exists created_by uuid references players (id) on delete set null;

alter table players
  add column if not exists is_admin boolean not null default false;

-- ---------------------------------------------------------------------------
-- Payment details shown to players when money is owed.
-- The QR columns hold a path inside the private storage bucket below, not a
-- public URL — the app mints a short-lived signed link when it renders them.
-- ---------------------------------------------------------------------------
alter table events
  add column if not exists gcash_name   text,
  add column if not exists gcash_number text,
  add column if not exists qr_one_path  text,
  add column if not exists qr_one_label text,
  add column if not exists qr_two_path  text,
  add column if not exists qr_two_label text;

-- ---------------------------------------------------------------------------
-- Private bucket for the QR images.
--
-- public = false, so the files are not readable by URL guessing. The app
-- uploads and reads them with the service_role key and hands the browser a
-- signed link that expires, which keeps payment QRs behind the passcode like
-- everything else.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-qr',
  'event-qr',
  false,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public             = excluded.public;

-- ---------------------------------------------------------------------------
-- Make the first player an admin so the delete guard has an owner from day one.
-- Adjust later from the Players tab.
-- ---------------------------------------------------------------------------
update players
set is_admin = true
where id = (select id from players order by created_at limit 1)
  and not exists (select 1 from players where is_admin);
