-- Run once in the Neon SQL editor (after 036_show_results.sql). Photos can be linked to awards and results, like they can
-- to birds, supplies and receipts. Also adds two kinds of calendar event: Show and Vet appointment.
alter table media_links drop constraint if exists media_links_target_type_check;
alter table media_links add constraint media_links_target_type_check
  check (target_type in ('bird', 'health', 'waybill', 'transaction', 'contact', 'aviary', 'location', 'building', 'room', 'cage', 'supply', 'award'));
