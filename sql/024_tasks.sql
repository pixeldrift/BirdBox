-- Run once in the Neon SQL editor (after 023_care_plans.sql). Tasks: one-off and repeating jobs (feeding,
-- cleaning, health, maintenance…), who they're assigned to, and where or which bird they're for. Each day a task
-- comes up is ticked off separately (task_done), so a daily task isn't stored hundreds of times. Feeding tasks
-- read the care plans; the Calendar will show every task alongside shipments and appointments.

create table if not exists tasks (
  id text primary key,
  title text not null,
  kind text not null default 'General',
  notes text not null default '',
  start_date date not null,
  time_of_day text not null default 'Anytime',
  repeat text not null default 'None',
  every integer,
  weekdays text not null default '',
  end_date date,
  assigned_to text,
  target_type text,
  target_id text,
  created_at timestamptz not null default now()
);
create index if not exists tasks_start_idx on tasks (start_date);

-- One row per task per day (and per cage, for a feeding round that covers several cages) once it's done.
create table if not exists task_done (
  id text primary key,
  task_id text not null,
  on_date date not null,
  sub_key text not null default '',
  done_by text,
  done_at timestamptz not null default now(),
  notes text not null default '',
  unique (task_id, on_date, sub_key)
);
create index if not exists task_done_date_idx on task_done (on_date);
