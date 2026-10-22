-- Run once in the Neon SQL editor (after 018_aviary_rooms.sql).
-- Team members: the people who help run your aviary — employees, volunteers, family. There are no
-- logins yet; this just lets you define them (and, later, assign them to tasks and give each a role's
-- permissions). Every team member also appears in your address book, kept in step automatically.

create table if not exists users (
  id text primary key,
  first_name text not null,
  last_name text not null default '',
  role text not null default 'Volunteer',
  status text not null default 'Active',
  email text not null default '',
  phone text not null default '',
  notes text not null default ''
);

-- The address-book entry that mirrors a team member.
alter table contacts add column if not exists user_id text;
create index if not exists contacts_user_idx on contacts (user_id);

-- Anyone already added (none yet) would be mirrored too.
insert into contacts (id, name, type, email, phone, user_id)
select 'c-' || id, btrim(first_name || ' ' || last_name), 'Team', email, phone, id from users
on conflict (id) do nothing;
