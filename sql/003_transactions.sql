-- Run once against Neon. Creates the transactions table and seeds it with the
-- records that used to live in js/data/transactions-sample.js. References
-- contacts/birds by id but doesn't enforce FKs on client_id/bird_id (both can
-- be null, e.g. a buyer not yet identified) -- kept as plain text columns to
-- match, no cross-table constraint needed for this app's scale.

create table if not exists transactions (
  id text primary key,
  item text not null,
  amount numeric not null,
  date date not null,
  category text not null,
  funding text not null default '',
  client_id text,
  bird_id text,
  notes text not null default ''
);

create index if not exists transactions_date_idx on transactions (date);
create index if not exists transactions_category_idx on transactions (category);

insert into transactions (id, item, amount, date, category, funding, client_id, bird_id, notes)
select * from (values
  ('tx-001', 'Payment to Steve — Invoice 22-2086', -540, date '2022-01-04', 'Purchase', 'PayPal', 'c-001', null, ''),
  ('tx-002', 'Payment to Steve on balance', -600, date '2021-02-07', 'Purchase', 'PayPal', 'c-001', null, ''),
  ('tx-003', 'Payment to Steve for African Grey', -1000, date '2021-03-13', 'Purchase', 'PayPal', 'c-001', 'AR15002CA', ''),
  ('tx-004', 'DNA Sexing — Invoice ABI 322119', -45, date '2021-05-10', 'Expense', 'Bank of America', 'c-008', null, ''),
  ('tx-005', 'Cage order', -320, date '2021-06-01', 'Expense', 'Check', 'c-007', null, ''),
  ('tx-006', 'Deposit on Red Factor Sun Conure', 300, date '2022-04-10', 'Deposit', 'Venmo', 'c-004', 'AR11103CA', ''),
  ('tx-007', 'Final payment on Sun Conure', 600, date '2021-08-20', 'Sale', 'Cash', 'c-002', 'AR11101CA', ''),
  ('tx-008', 'Payment for IRN Parakeet', 450, date '2021-09-05', 'Sale', 'PayPal', 'c-003', 'AR13002CA', ''),
  ('tx-009', 'Deposit on Green-Cheeked Conure', 200, date '2022-02-01', 'Deposit', 'Venmo', 'c-010', 'AR12002CA', ''),
  ('tx-010', 'Feed & supplies run', -180, date '2022-03-02', 'Expense', 'Cash', null, null, ''),
  ('tx-011', 'Payment to Steve — Invoice 22-2105', -2000, date '2022-04-25', 'Purchase', 'PayPal', 'c-001', null, ''),
  ('tx-012', 'Deposit on Rio', 1000, date '2022-03-15', 'Deposit', 'Zelle', null, 'AR14002CA', 'Buyer TBD — phone inquiry.')
) as seed(id, item, amount, date, category, funding, client_id, bird_id, notes)
where not exists (select 1 from transactions limit 1);
