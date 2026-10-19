-- Run once in the Neon SQL editor.
-- The app's navigation as data: the home screen tiles (groups) and the tabs inside each (screens),
-- in order. Rearrange, rename or hide them here — or in Account → Customize — and the app follows.
-- The built-in layout is still the fallback if this table is empty or missing.

create table if not exists navigation (
  id text primary key,            -- a group id ('mybirds') or group/screen ('mybirds/birds')
  parent_id text,                 -- null for a home tile; the group id for a tab
  label text not null,
  icon text not null default '',
  blurb text not null default '',
  sort integer not null default 0,
  visible boolean not null default true,
  home_tile boolean not null default true
);

insert into navigation (id, parent_id, label, icon, blurb, sort, visible, home_tile)
select * from (values
  ('mybirds', null::text, 'My Birds', 'icons/tinted/mybirds/Birds.png', 'Pedigree and genetics — the heart of BirdBox.', 10, true, true),
  ('mybirds/birds', 'mybirds', 'Birds', 'icons/tinted/mybirds/Birds.png', 'Your full flock: profiles, photos, and details for every bird you own.', 10, true, false),
  ('mybirds/genealogy', 'mybirds', 'Genealogy', 'icons/tinted/mybirds/Genealogy.png', 'Visual family trees showing parents, siblings, and offspring.', 20, true, false),
  ('mybirds/genetics', 'mybirds', 'Genetics', 'icons/tinted/mybirds/Genetics.png', 'Mutation calculator and pairing predictor for expected offspring traits.', 30, true, false),
  ('mybirds/health', 'mybirds', 'Health', 'icons/tinted/mybirds/Health.png', 'Vet visits, medications, and health notes per bird.', 40, true, false),
  ('mybirds/production', 'mybirds', 'Production', 'icons/tinted/mybirds/Production.png', 'Egg-laying, clutches, and hatch records.', 50, true, false),
  ('mybirds/labels', 'mybirds', 'Labels', 'icons/tinted/mybirds/Labels.png', 'Print band/ID labels for cages and carriers.', 60, true, false),
  ('aviary', null::text, 'Aviary', 'icons/tinted/aviary/Caging.png', 'Day-to-day husbandry: cages, feeding, and chores.', 20, true, true),
  ('aviary/caging', 'aviary', 'Caging', 'icons/tinted/aviary/Caging.png', 'Cages, flights, and location assignments.', 10, true, false),
  ('aviary/feedwater', 'aviary', 'Feed/Water', 'icons/tinted/aviary/FeedWater.png', 'Feeding schedules and diet tracking.', 20, true, false),
  ('aviary/supplies', 'aviary', 'Supplies', 'icons/tinted/aviary/Supplies.png', 'Inventory of feed, medication, and supplies on hand.', 30, true, false),
  ('aviary/cleaning', 'aviary', 'Cleaning', 'icons/tinted/aviary/Cleaning.png', 'Cleaning schedules and checklists.', 40, true, false),
  ('aviary/tasks', 'aviary', 'Tasks', 'icons/tinted/aviary/Tasks.png', 'Chores and recurring to-dos.', 50, true, false),
  ('aviary/calendar', 'aviary', 'Calendar', 'icons/tinted/aviary/Calendar.png', 'Upcoming hatch dates, tasks, and reminders.', 60, true, false),
  ('business', null::text, 'Business', 'icons/tinted/business/Accounting.png', 'Invoicing, shipping, and reports.', 30, true, true),
  ('business/accounting', 'business', 'Accounting', 'icons/tinted/business/Accounting.png', 'Invoices, billing, and accounts receivable.', 10, true, false),
  ('business/shipping', 'business', 'Shipping', 'icons/tinted/business/Shipping.png', 'Book and track live-animal shipments.', 20, true, false),
  ('business/reports', 'business', 'Reports', 'icons/tinted/business/Reports.png', 'Visual reports: sales, production, and inbreeding coefficients.', 30, true, false),
  ('business/contacts', 'business', 'Contacts', 'icons/tinted/business/Contacts.png', 'Buyers, sellers, and vendor address book.', 40, true, false),
  ('business/media', 'business', 'Media', 'icons/tinted/classifieds/Notes.png', 'Every photo, receipt, waybill and document in one searchable library.', 50, true, false),
  ('registry', null::text, 'Registry', 'icons/tinted/registry/Registry.png', 'The public band-number registry — search, register, or report a lost bird.', 40, true, true),
  ('registry/search', 'registry', 'Search', 'icons/tinted/registry/Registry.png', 'Look up a band number to see its public pedigree record.', 10, true, false),
  ('registry/register', 'registry', 'Register', 'icons/tinted/registry/Labels.png', 'Register a new band number and start its official record.', 20, true, false),
  ('registry/lostfound', 'registry', 'Lost & Found', 'icons/tinted/registry/Notifications.png', 'Post or search Lost & Found alerts for missing birds.', 30, true, false),
  ('classifieds', null::text, 'Classifieds', 'icons/tinted/classifieds/Classifieds.png', 'Buy, sell, and browse listings from other breeders.', 50, true, true),
  ('classifieds/browse', 'classifieds', 'Browse', 'icons/tinted/classifieds/Classifieds.png', 'Browse birds for sale from other breeders.', 10, true, false),
  ('classifieds/mylistings', 'classifieds', 'My Listings', 'icons/tinted/classifieds/Notes.png', 'Manage the listings you''ve posted.', 20, true, false),
  ('account', null::text, 'Account', 'icons/tinted/account/My_Profile.png', 'Your profile, messages, and app settings.', 60, true, false),
  ('account/myprofile', 'account', 'My Profile', 'icons/tinted/account/My_Profile.png', 'Your personal info and account details.', 10, true, false),
  ('account/messages', 'account', 'Messages', 'icons/tinted/account/Contacts.png', 'Private messages between breeders and buyers.', 20, true, false),
  ('account/notifications', 'account', 'Notifications', 'icons/tinted/account/Notifications.png', 'Alerts for sales, messages, and account activity.', 30, true, false),
  ('account/myteam', 'account', 'My Team', 'icons/tinted/account/My_Team.png', 'Manage collaborators who can access your records.', 40, true, false),
  ('account/settings', 'account', 'Settings', 'icons/tinted/account/Settings.png', 'App preferences and configuration.', 50, true, false),
  ('account/privacy', 'account', 'Privacy', 'icons/tinted/account/Privacy.png', 'Control what''s public, member-only, or private.', 60, true, false),
  ('account/cloudsync', 'account', 'Cloud Sync', 'icons/tinted/account/Cloud_Sync.png', 'Back up and sync your data across devices.', 70, true, false),
  ('account/ondevice', 'account', 'On Device', 'icons/tinted/account/On_Device.png', 'Keep data stored locally on this device only.', 80, true, false),
  ('account/help', 'account', 'Help', 'icons/tinted/account/Help.png', 'Guides, FAQs, and support.', 90, true, false),
  ('account/about', 'account', 'About', 'icons/tinted/mybirds/Birds.png', 'Who made BirdBox, who it’s for, and where it’s headed.', 100, true, false),
  ('account/customize', 'account', 'Customize', 'icons/tinted/account/Settings.png', 'Reorder and hide the home screen tiles and the tabs inside each section.', 110, true, false),
  ('account/credits', 'account', 'Credits', 'icons/tinted/classifieds/Notes.png', 'The sources, artists, and partners behind BirdBox.', 120, true, false)
) as seed(id, parent_id, label, icon, blurb, sort, visible, home_tile)
where not exists (select 1 from navigation limit 1);
