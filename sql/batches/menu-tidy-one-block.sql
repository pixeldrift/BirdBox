-- MENU TIDY — one statement. Paste ALL of this file into the Neon SQL editor and run it once. Safe to run again.
do $menus$
begin
-- Run once in the Neon SQL editor. Tidies the saved menu choices of an account that customized (or was seeded with) its menus:
--   Production sits before Health · Privacy is hidden for now · the retired Customize tab and the old My Team spot are cleared
-- (My Team now lives under Business, Awards is a new tab next to Production, and Reminders is a new tab — hidden for now — next to Health;
-- those need no saved rows). Accounts that never customized their menus follow the built-in layout and need nothing. Plain statements; safe to re-run.
alter table navigation no force row level security;
update navigation set sort = 37 where id = 'mybirds/production' and sort > 40;
update navigation set visible = false where id = 'account/privacy';
delete from navigation where id in ('account/customize', 'account/myteam');
alter table navigation force row level security;

end
$menus$;
