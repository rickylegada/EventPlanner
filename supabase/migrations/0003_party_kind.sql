-- Pickle — rename the "birthday" event kind to the more general "party",
-- so Christmas parties, despedidas and the rest have somewhere to live.
--
-- Paste into the Supabase SQL Editor and press Run. Safe to re-run.

-- The check constraint has to come off before existing rows can be relabelled.
alter table events drop constraint if exists events_kind_check;

update events set kind = 'party' where kind = 'birthday';

alter table events
  add constraint events_kind_check
  check (kind in ('pickleball', 'party', 'other'));
