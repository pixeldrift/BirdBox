-- Undoes 026_demo_layout.sql: takes the test birds out of the demo cages and removes the demo cages, rooms,
-- locations and the buildings it added. Buildings you already had stay (just unfiled again).
update birds set cage = null where cage in (select code from cages where description = 'Demo cage');
delete from cages where description = 'Demo cage';
update cages set room_id = null where room_id like 'room-demo-%';
delete from media_links where target_type = 'room' and target_id like 'room-demo-%';
delete from rooms where id like 'room-demo-%';
update buildings set location_id = null where location_id like 'loc-demo-%';
delete from media_links where target_type = 'location' and target_id like 'loc-demo-%';
delete from locations where id like 'loc-demo-%';
delete from buildings where description = 'Demo building';
