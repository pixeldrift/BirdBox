-- Run once in the Neon SQL editor. Lets a shipment be "Pending" (hasn't left yet).
-- Every existing shipment stays "Complete" (already shipped or received), except the two
-- sample records that were still waiting on something.

alter table waybills add column if not exists status text not null default 'Complete';

update waybills set status = 'Pending' where id in ('wb-005', 'wb-006') and status = 'Complete';
