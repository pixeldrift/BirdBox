-- Run once in the Neon SQL editor (after 024_tasks.sql). Calendar events: appointments with clients, meetups,
-- aviary tours, calls and anything else with a date (and usually a time). An event can be linked to the records it's
-- about — birds, shipments, contacts, cages — so one entry can lead to all the details. Tasks, shipments and health
-- visits appear on the Calendar automatically from their own records; this table is only for events.

create table if not exists events (
  id text primary key,
  title text not null,
  kind text not null default 'Appointment',
  notes text not null default '',
  place text not null default '',
  start_date date not null,
  end_date date,
  all_day boolean not null default false,
  start_time text not null default '',
  end_time text not null default '',
  contact_id text,
  assigned_to text,
  created_at timestamptz not null default now()
);
create index if not exists events_start_idx on events (start_date);

create table if not exists event_links (
  id text primary key,
  event_id text not null,
  target_type text not null,
  target_id text not null,
  unique (event_id, target_type, target_id)
);
create index if not exists event_links_event_idx on event_links (event_id);
