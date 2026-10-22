-- Run in the Neon SQL editor to remove the Game of Thrones test birds added by 020_test_pedigree.sql.
-- Only birds whose id starts with b-got- are touched. Their photos stay in the Media library, unlinked.
delete from media_links where target_type = 'bird' and target_id like 'b-got-%';
delete from health_records where bird_id like 'b-got-%';
delete from birds where id like 'b-got-%';
