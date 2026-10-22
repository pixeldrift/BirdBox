-- Removes the demo places added by 021_demo_places.sql. Buildings and cages stay, just unfiled again.
update cages set room_id = null where room_id like 'room-demo-%';
delete from media_links where target_type = 'room' and target_id like 'room-demo-%';
delete from rooms where id like 'room-demo-%';
update buildings set location_id = null where location_id like 'loc-demo-%';
delete from media_links where target_type = 'location' and target_id like 'loc-demo-%';
delete from locations where id like 'loc-demo-%';
