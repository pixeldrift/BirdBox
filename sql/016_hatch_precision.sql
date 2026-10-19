-- Run once in the Neon SQL editor.
-- A hatch date can be just a year or a year and month when that's all you know, and can be marked
-- approximate. A partial date is stored as the first of the month / first of the year, with
-- hatch_precision saying how much of it is real. Existing birds are exact days.

alter table birds add column if not exists hatch_precision text not null default 'day';
alter table birds add column if not exists hatch_approx boolean not null default false;
