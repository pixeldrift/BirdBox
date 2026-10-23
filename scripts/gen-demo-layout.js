// Builds sql/026_demo_layout.sql: a demo aviary layout — locations, buildings, rooms and cages — and puts the
// Game of Thrones test birds (sql/020) into cages, species by species, families kept together.
// Usage: node scripts/gen-demo-layout.js "<path to Geneology Sample Data - Sheet1.tsv>"
const fs = require('fs');
const { load } = require('./gen-test-pedigree.js');
const { birds, speciesOf, fam } = load(process.argv[2]);
const by = {}; birds.forEach((b) => { by[b.id] = b; });

// generation depth, so grandparents sit before their grandchildren
const depth = {};
const d = (id) => { if (id in depth) return depth[id]; depth[id] = 0; const b = by[id]; const m = b.mother && by[b.mother] ? d(b.mother) : -1; const f = b.father && by[b.father] ? d(b.father) : -1; return (depth[id] = Math.max(m, f) + 1); };
birds.forEach((b) => d(b.id));
const famOf = {}; Object.values(fam).forEach((list, i) => list.forEach((b) => { famOf[b.id] = i; }));

const BUILDINGS_FOR = { gcc: ['F1', 'F2'], cockatiel: ['F3'], ringneck: ['F5'], lovebird: ['F6'], sun: ['F6'] };
const ROOM_FOR = { F2: 'room-demo-flight', F6: 'room-demo-nursery' };
const PER_CAGE = 6;
const next = {}; // next cage number per building
const cages = []; // { code, building, room, birds }
Object.keys(BUILDINGS_FOR).forEach((sp) => {
  const list = birds.filter((b) => speciesOf[b.id] === sp).sort((a, b) => famOf[a.id] - famOf[b.id] || depth[a.id] - depth[b.id] || a.sex.localeCompare(b.sex) || a.id.localeCompare(b.id));
  for (let i = 0, n = 0; i < list.length; i += PER_CAGE, n++) {
    const bld = BUILDINGS_FOR[sp][n % BUILDINGS_FOR[sp].length];
    next[bld] = (next[bld] || 100) + 1;
    cages.push({ code: bld + '-' + next[bld], building: bld, room: ROOM_FOR[bld] || null, birds: list.slice(i, i + PER_CAGE).map((b) => 'b-got-' + b.id) });
  }
});

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const sql = `-- Run once in the Neon SQL editor. OPTIONAL — a demo aviary layout so you can see the whole Caging explorer with
-- real-looking content: two locations, five buildings, a few rooms, and cages holding the Game of Thrones test birds
-- (run 020_test_pedigree.sql first for the birds). Families are kept together, one species per building.
-- Safe to re-run, and self-contained (creates any missing places tables). Undo with 026_remove_demo_layout.sql.

create table if not exists locations (id text primary key, name text not null, description text not null default '');
create table if not exists buildings (code text primary key, nickname text not null, description text not null default '');
alter table buildings add column if not exists location_id text;
create table if not exists rooms (id text primary key, name text not null, description text not null default '', building_code text, location_id text);
create table if not exists cages (code text primary key, building_code text, description text not null default '');
alter table cages add column if not exists room_id text;

insert into locations (id, name, description) values
  ('loc-demo-home', 'Home Farm', 'Main breeding site (demo)'),
  ('loc-demo-ranch', 'Fallbrook Ranch', 'Second site (demo)')
on conflict (id) do nothing;

-- Buildings (kept if you already have them; added if not).
insert into buildings (code, nickname, description) values
  ('F1', '1', 'Demo building'), ('F2', '2', 'Demo building'), ('F3', '3', 'Demo building'), ('F5', '5', 'Demo building'), ('F6', '6', 'Demo building')
on conflict (code) do nothing;
update buildings set location_id = 'loc-demo-home' where code in ('F1', 'F2', 'F3') and location_id is null;
update buildings set location_id = 'loc-demo-ranch' where code in ('F5', 'F6') and location_id is null;

insert into rooms (id, name, description, building_code, location_id) values
  ('room-demo-flight', 'Flight Room', 'Large flight cages (demo)', 'F2', null),
  ('room-demo-quarantine', 'Quarantine', 'New arrivals (demo)', 'F1', null),
  ('room-demo-nursery', 'Nursery', 'Hand-feeding and weaning (demo)', 'F6', null),
  ('room-demo-hatchery', 'Hatchery', 'Incubators (demo) — straight on the location, no building', null, 'loc-demo-ranch')
on conflict (id) do nothing;

-- Cages for the test birds.
insert into cages (code, building_code, room_id, description) values
${cages.map((c) => `  (${q(c.code)}, ${c.room ? 'null' : q(c.building)}, ${c.room ? q(c.room) : 'null'}, 'Demo cage')`).join(',\n')}
on conflict (code) do nothing;

-- Put the test birds in them (only birds that have no cage yet).
${cages.map((c) => `update birds set cage = ${q(c.code)} where id in (${c.birds.map(q).join(', ')}) and cage is null;`).join('\n')}

-- And file a few of your existing cages into rooms, if they exist.
insert into cages (code, room_id) select distinct cage, 'room-demo-quarantine' from birds where cage in ('F1-012') on conflict (code) do update set room_id = coalesce(cages.room_id, excluded.room_id);
`;
fs.writeFileSync('sql/026_demo_layout.sql', sql);
console.log(cages.length, 'cages', JSON.stringify(cages.reduce((a, c) => { a[c.building] = (a[c.building] || 0) + 1; return a; }, {})));
