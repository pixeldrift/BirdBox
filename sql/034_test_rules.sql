-- Run once in the Neon SQL editor (after 033_health_tests.sql). How often each disease should be re-tested, so the app can
-- flag tests that are due soon or overdue. Only the ones you change are stored here; the app has sensible starting
-- defaults for the common diseases. interval_months = 0 means "no reminder".

create table if not exists test_rules (
  id text primary key,
  disease text not null unique,
  interval_months integer not null default 0 check (interval_months >= 0)
);
