-- Run once in the Neon SQL editor. Awards and results for a bird: shows, races and trials — the event, the date, the class or
-- category, and the placement ("1st", "Best of Breed", "Champion"…). A bird can have as many as you like, and the results of a
-- bird's parents and grandparents show up on its own page as pedigree credentials.

create table if not exists show_results (
  id text primary key,
  bird_id text not null,
  kind text not null default 'Show',
  event text not null,
  date date,
  location text not null default '',
  category text not null default '',
  placement text not null default '',
  entries integer,
  judge text not null default '',
  notes text not null default ''
);
create index if not exists show_results_bird_idx on show_results (bird_id);
