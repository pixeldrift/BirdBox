-- Removes the supplies added by 027_supplies_from_photos.sql (and any care-plan lines that used them).
delete from care_items where supply_id like 'sup-%' and supply_id in (select id from supplies where notes like 'Added from the supply photos%');
delete from supplies where notes like 'Added from the supply photos%';
