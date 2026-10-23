-- Run once in the Neon SQL editor (after 027_supplies_from_photos.sql). Lets you choose which of a supply's photos is
-- its main picture, including the photos that came with the app.
alter table supplies add column if not exists main_image text not null default '';
