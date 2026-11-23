// Builds sql/batches/places-one-block.sql: sql/040_places.sql as ONE statement (a DO block), for SQL editors that split or half-run a long
// script. Run it once in the Neon SQL editor.   node scripts/gen-places-block.js
const fs = require('fs'), path = require('path');
const body = fs.readFileSync(path.join(__dirname, '..', 'sql', '040_places.sql'), 'utf8');
const out = `-- PLACES — one statement. Paste ALL of this file into the Neon SQL editor and run it once. Safe to run again.
-- Your locations, buildings, rooms and cages become "places" (any place can be inside any other, and you choose the kinds).
-- Nothing is deleted: the old tables stay as they are. Check it afterwards with the query at the bottom.
do $places$
begin
${body}
end
$places$;

-- Check (run on its own afterwards; places should be more than zero, and "still pointing at the old kinds" should be 0):
-- select (select count(*) from places) as places, (select count(*) from care_items where target_type in ('location', 'building', 'room', 'cage')) as still_pointing_at_the_old_kinds;
`;
fs.writeFileSync(path.join(__dirname, '..', 'sql', 'batches', 'places-one-block.sql'), out);
console.log('wrote sql/batches/places-one-block.sql');
