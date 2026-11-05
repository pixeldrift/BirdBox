-- Run once in the Neon SQL editor. What kind of birds you keep, so the app can use your words ("coop" and "hatch" for
-- chickens, "cage" and "clutch" for parrots). Set it in Account -> Settings -> My Aviary.
alter table aviary add column if not exists keeps text not null default '';
