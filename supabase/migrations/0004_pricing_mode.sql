-- Pickle — two ways an event can cost money.
--
--   split     the venue charges one booking fee, divided between whoever came
--   per_head  everyone pays the same fixed amount, so the total depends on
--             how many turned up
--
-- Paste into the Supabase SQL Editor and press Run. Safe to re-run.

alter table events
  add column if not exists pricing_mode text not null default 'split',
  add column if not exists price_per_head numeric(12, 2);

-- Existing events all worked the one way, and the default above keeps them there.
alter table events drop constraint if exists events_pricing_mode_check;
alter table events
  add constraint events_pricing_mode_check
  check (pricing_mode in ('split', 'per_head'));

-- Exactly one of the two amounts applies, depending on the mode. Keeping the
-- unused one null stops a stale figure from resurfacing if the mode changes.
alter table events drop constraint if exists events_pricing_amount_check;
alter table events
  add constraint events_pricing_amount_check
  check (
    (pricing_mode = 'split'    and price_per_head is null)
    or
    (pricing_mode = 'per_head' and total_cost     is null)
  );
