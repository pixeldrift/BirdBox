-- Run once against Neon. Creates the health_records table and seeds it with
-- the records that used to live in js/data/health-sample.js.
--
-- attachments stays a jsonb array of {name, kind, url}, matching the app's
-- shape -- but note this does NOT solve attachment persistence. The url is
-- still a browser-local URL.createObjectURL() blob (see js/screens/health.js),
-- which dies the moment the tab closes, so newly-added attachments will look
-- broken after a reload even though the record itself now survives one. Real
-- attachment persistence needs actual file storage (e.g. Vercel Blob) wired
-- into the POST handler -- a separate piece of work from this migration.

create table if not exists health_records (
  id text primary key,
  bird_id text not null,
  type text not null,
  date date not null,
  provider text not null default '',
  notes text not null default '',
  attachments jsonb not null default '[]'
);

create index if not exists health_records_bird_idx on health_records (bird_id);

insert into health_records (id, bird_id, type, date, provider, notes, attachments)
select * from (values
  ('hr-001', 'AR15002CA', 'DNA Certificate', date '2016-10-02', 'Avian Biotech International', 'DNA sexing confirmed male. Certificate on file.', '[]'::jsonb),
  ('hr-002', 'AR15002CA', 'Vet Visit', date '2023-06-14', 'Fallbrook Avian & Exotic', 'Annual wellness exam. Weight 412g, body condition good.', '[]'::jsonb),
  ('hr-003', 'AR10001CA', 'Surgical Sexing', date '2019-08-20', 'Dr. Reyes, Avian Surgical Associates', 'Laparoscopic sexing performed prior to DNA sexing becoming standard.', '[]'::jsonb),
  ('hr-004', 'AR10001CA', 'Immunization', date '2020-01-15', 'Fallbrook Avian & Exotic', 'Polyoma vaccine, first dose.', '[]'::jsonb),
  ('hr-005', 'AR10002CA', 'Immunization', date '2020-01-15', 'Fallbrook Avian & Exotic', 'Polyoma vaccine, first dose.', '[]'::jsonb),
  ('hr-006', 'AR14001CA', 'Vet Visit', date '2024-02-03', 'Dr. Amara Singh, DVM', 'Beak trim, nails trimmed. No concerns.', '[]'::jsonb),
  ('hr-007', 'AR11103CA', 'DNA Certificate', date '2022-05-01', 'Avian Biotech International', 'Certificate ABI 322119 — confirmed male.', '[]'::jsonb),
  ('hr-008', 'AR14002CA', 'Other', date '2021-12-10', '', '30-day quarantine completed after arrival, no signs of illness.', '[]'::jsonb)
) as seed(id, bird_id, type, date, provider, notes, attachments)
where not exists (select 1 from health_records limit 1);
