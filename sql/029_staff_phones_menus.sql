-- Run once in the Neon SQL editor. Three small tidy-ups:
-- 1. The team role "Employee" is now called "Staff".
-- 2. Phone numbers are saved as xxx-xxx-xxxx (new ones are normalised automatically; this fixes the ones already saved).
--    Only ten-digit numbers (or eleven with a leading 1) are changed; anything else is left as typed.
-- 3. "On Device" and "Cloud Sync" are no longer menu sections (they'll come back as a status indicator once the app works
--    offline), so their saved menu rows are removed.

update users set role = 'Staff' where role = 'Employee';

update contacts set phone = regexp_replace(regexp_replace(phone, '[^0-9]', '', 'g'), '^1?([0-9]{3})([0-9]{3})([0-9]{4})$', '\1-\2-\3')
  where regexp_replace(phone, '[^0-9]', '', 'g') ~ '^1?[0-9]{10}$' and phone !~ '[A-Za-z]' and phone !~ '^\+[02-9]';
update users set phone = regexp_replace(regexp_replace(phone, '[^0-9]', '', 'g'), '^1?([0-9]{3})([0-9]{3})([0-9]{4})$', '\1-\2-\3')
  where regexp_replace(phone, '[^0-9]', '', 'g') ~ '^1?[0-9]{10}$' and phone !~ '[A-Za-z]' and phone !~ '^\+[02-9]';
update aviary set phone = regexp_replace(regexp_replace(phone, '[^0-9]', '', 'g'), '^1?([0-9]{3})([0-9]{3})([0-9]{4})$', '\1-\2-\3')
  where regexp_replace(phone, '[^0-9]', '', 'g') ~ '^1?[0-9]{10}$' and phone !~ '[A-Za-z]' and phone !~ '^\+[02-9]';

delete from navigation where id in ('account/cloudsync', 'account/ondevice');
