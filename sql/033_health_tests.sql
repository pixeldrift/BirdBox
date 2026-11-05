-- Run once in the Neon SQL editor. Health records can now be disease TESTS: which disease was tested for and the
-- result (the date and the lab or vet use the existing date and provider columns). A bird can have as many as you like;
-- the app shows the most recent result per disease as a badge.

alter table health_records add column if not exists disease text not null default '';
alter table health_records add column if not exists result text not null default '';
create index if not exists health_records_disease_idx on health_records (disease);
