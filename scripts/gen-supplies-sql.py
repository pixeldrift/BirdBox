#!/usr/bin/env python3
"""Builds sql/027_supplies_from_photos.sql from images/supplies/index.json (see build-supply-images.py) and the details
read off the labels in the photos. Run after build-supply-images.py."""
import json
idx = json.load(open('images/supplies/index.json'))

META = {
  'kruse-ar-pellets': ('Avian Resources Diet pellets, 50 lb', 'Feed', 'O.H. Kruse Grain and Milling', 'bag',
    'Pelleted diet. Guaranteed analysis: crude protein min. 16.5%, crude fat min. 2.0%, crude fiber max. 4.0%. Feed free choice as the sole ration or as part of a varied diet with seed, sprouts and fresh produce. 50 lb (22.68 kg) bag.'),
  'kruse-sprout-mix': ('Kruse Avian Resources Sprout Mix, 50 lb', 'Feed', 'Kruse', 'bag',
    'Sprouting mix: oats, Alaskan peas, paddy rice, black sunflower, Canadian peas, buckwheat, lentils, hulled peanuts, garbanzo beans, soybeans and pinto beans. Crude protein not less than 17.61%. 50 lb (22.68 kg). Manufactured for Western Milling LLC.'),
  'kruse-game-bird-crumble': ('Gamebird / Turkey Grower Crumbles, 50 lb', 'Feed', 'O.H. Kruse Grain and Milling', 'bag',
    'Designed for growing and finishing gamebirds and turkeys; also used for quail, ducks, geese and pheasants. Crude protein min. 24.0%. Provide grit to aid digestion. 50 lb (22.68 kg).'),
  'kruse-pigeon-pellets': ('22% Pigeon Pellets 1/8", 50 lb', 'Feed', 'O.H. Kruse Grain and Milling', 'bag',
    'Designed to be fed to pigeons as the sole ration; keep feeders about half full. Crude protein min. 22.0%. 50 lb (22.68 kg).'),
  'fine-feathers-millet': ('Fine Feathers Parakeet Mix, 50 lb', 'Feed', 'Fine Feathers (O.H. Kruse Grain and Milling)', 'bag',
    'Seed mix with canary seed, oat groats and millet. Crude protein min. 13.0%, crude fat min. 4.6%, crude fiber max. 5.3%. 50 lb (22.68 kg).'),
  'magnolia-seed-mix': ('Magnolia Bird Farm Sr. Large Hookbill mix (no sunflower), 50 lb', 'Feed', 'Magnolia Bird Farm', 'bag',
    'Seed mix for large parrots, without sunflower. 50 lb bag, packaged by Magnolia Bird Farm (Anaheim / Riverside, CA).'),
  'zupreme-pellets': ('ZuPreem AvianBreeder Diets, 40 lb', 'Feed', 'ZuPreem', 'bag',
    'Balanced nutrition for health and reproduction in breeding birds. Comes in FruitBlend (natural fruit flavors) and Natural (added vitamins, minerals and amino acids) versions for large parrots, parrots and conures, and cockatiels. 40 lb (18.1 kg).'),
  'equine-pellets': ('Pine pellet bedding, 40 lb', 'Other', 'Tractor Supply Co', 'bag',
    'Natural pine pelletized bedding for horses and small animals: absorbent, reduces cleaning time, neutralizes odor, biodegradable. 40 lb (18.14 kg) bag.'),
  'meal-worms': ('Mealworms (live)', 'Feed', '', 'box',
    'Live mealworms. Arrive in a ventilated "Live animals" box and are kept in a bucket.'),
  'super-worms': ('Superworms (live)', 'Feed', '', 'box',
    'Live superworms, shipped in a box and kept in a bucket.'),
  'mice': ('Frozen mice, small', 'Feed', '', 'bag',
    'Small frozen mice, bagged (a bag is marked "100 Sm") and boxed.'),
}
q = lambda s: "'" + s.replace("'", "''") + "'"
rows = []
for key, (name, cat, brand, unit, desc) in META.items():
    imgs = [i['file'] for i in idx[key]['images']]
    rows.append("  (%s, %s, %s, %s, %s, %s, array[%s]::text[], %s)" % (
        q('sup-' + key), q(name), q(cat), q(brand), q(unit), q(desc), ', '.join(q(i) for i in imgs),
        q('Added from the supply photos. Count and reorder level not set yet.')))
sql = """-- Run once in the Neon SQL editor (after 022_supplies.sql). OPTIONAL — adds the %d supplies photographed in
-- src/images/Supplies as entries in your Supplies list, each with its photos (web-sized copies in images/supplies/).
-- Names, brands and descriptions are read off the labels in the photos; the amount on hand, reorder level, price and
-- vendor are left blank for you to fill in. Safe to re-run. Remove with 027_remove_supplies_from_photos.sql.

alter table supplies add column if not exists images text[] not null default '{}';

insert into supplies (id, name, category, brand, unit, description, images, notes) values
%s
on conflict (id) do nothing;
""" % (len(META), ',\n'.join(rows))
open('sql/027_supplies_from_photos.sql', 'w').write(sql)
open('sql/027_remove_supplies_from_photos.sql', 'w').write("""-- Removes the supplies added by 027_supplies_from_photos.sql (and any care-plan lines that used them).
delete from care_items where supply_id like 'sup-%' and supply_id in (select id from supplies where notes like 'Added from the supply photos%');
delete from supplies where notes like 'Added from the supply photos%';
""")
print(len(META), 'supplies')
