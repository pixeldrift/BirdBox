// Builds sql/020_test_pedigree.sql from the Game of Thrones sample pedigree in the Tree of Birds repo.
// Usage: node scripts/gen-test-pedigree.js "<path to Geneology Sample Data - Sheet1.tsv>"
// Every connected family gets ONE species (siblings can't be different species), and several unrelated
// families share a species so pairings between families give a low inbreeding coefficient.
const fs = require('fs');
const rows = fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(Boolean).map((l) => l.split('\t'));
const head = rows.shift();
const col = (r, k) => (r[head.indexOf(k)] || '').trim();
const birds = rows.filter((r) => (r[head.indexOf('id')] || '').trim()).map((r) => ({ id: col(r, 'id').padStart(3, '0'), name: col(r, 'name'), sex: col(r, 'sex'), father: col(r, 'fatherID') && col(r, 'fatherID').padStart(3, '0'), mother: col(r, 'motherID') && col(r, 'motherID').padStart(3, '0'), mutation: col(r, 'mutation'), splits: col(r, 'splits') }));
const by = {}; birds.forEach((b) => { by[b.id] = b; });

// connected families
const uf = {}; birds.forEach((b) => { uf[b.id] = b.id; });
const find = (x) => { while (uf[x] !== x) { uf[x] = uf[uf[x]]; x = uf[x]; } return x; };
birds.forEach((b) => [b.father, b.mother].forEach((p) => { if (p && by[p]) uf[find(b.id)] = find(p); }));
const fam = {}; birds.forEach((b) => { (fam[find(b.id)] = fam[find(b.id)] || []).push(b); });

const SP = {
  gcc: { sci: 'Pyrrhura molinae', common: 'Green-cheeked Conure' },
  cockatiel: { sci: 'Nymphicus hollandicus', common: 'Cockatiel' },
  ringneck: { sci: 'Psittacula krameri', common: 'Indian Ringneck' },
  lovebird: { sci: 'Agapornis roseicollis', common: 'Peach-faced Lovebird' },
  sun: { sci: 'Aratinga solstitialis', common: 'Sun Conure' },
};
// What each family is, by a member who identifies it (first name).
const FAMILY_SPECIES = { Rickard: 'gcc', Randyll: 'cockatiel', Balon: 'gcc', Walder: 'gcc', Selyse: 'cockatiel', Tywin: 'gcc', Luthor: 'lovebird', Cersei: 'ringneck', Gregor: 'ringneck', Jeor: 'sun', Maege: 'lovebird' };
const MUT = {
  gcc: { normal: 'Normal', cinnamon: 'Cinnamon', yellow: 'Yellow-sided', opamint: 'Opamint', pineapple: 'Pineapple', turqoise: 'Turquoise', turqouise: 'Turquoise', turquoise: 'Turquoise', 'opaline dilute': 'Dilute Yellow-sided', blue: 'Turquoise' },
  cockatiel: { cinnamon: 'Cinnamon', opaline: 'Pearl', pied: 'Pied', 'opaline dilute': 'Pearl', yellow: 'Lutino' },
  ringneck: { blue: 'Blue', grey: 'Grey', pied: 'Pied', cinnamon: 'Cinnamon' },
  lovebird: { blue: 'Blue', yellow: 'Pallid', pied: 'Pied', cinnamon: 'Cinnamon' },
  sun: {},
};
const founders = [];
const speciesOf = {};
Object.values(fam).forEach((list) => {
  if (list.length === 1) { founders.push(list[0]); return; }
  const key = Object.keys(FAMILY_SPECIES).find((k) => list.some((b) => b.name.split(' ')[0] === k));
  if (!key) throw new Error('No species chosen for the family of ' + list[0].name);
  list.forEach((b) => { speciesOf[b.id] = FAMILY_SPECIES[key]; });
});
// Loners become unrelated founders spread across the species, alternating so each species gets both sexes.
const order = ['gcc', 'cockatiel', 'ringneck', 'lovebird', 'sun'];
founders.forEach((b, i) => { speciesOf[b.id] = order[i % order.length]; });

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const sex = (s) => (s === 'M' ? 'Male' : s === 'F' ? 'Female' : 'Unsexed');
const lines = birds.map((b) => {
  const sp = SP[speciesOf[b.id]];
  const mut = MUT[speciesOf[b.id]][b.mutation.toLowerCase()] || null;
  const notes = 'Test pedigree (Game of Thrones).' + (b.splits ? ' Known carrier of: ' + b.splits + '.' : '');
  return `  ('b-got-${b.id}', ${q(b.name)}, ${q(sex(b.sex))}, ${q(sp.common)}, (select code from species where scientific_name = ${q(sp.sci)} limit 1), ${mut ? q(mut) : 'null'}, ${b.mother ? q('b-got-' + b.mother) : 'null'}, ${b.father ? q('b-got-' + b.father) : 'null'}, ${q(notes)})`;
});
const sql = `-- Run once in the Neon SQL editor. OPTIONAL — a ${birds.length}-bird Game of Thrones pedigree for trying out the
-- Genealogy tools (family tree, inbreeding check, mutation predictor). Remove it any time with
-- 020_remove_test_pedigree.sql.
--
-- Every family is one species, so siblings are never different species. Several unrelated families share a
-- species (Green-cheeked Conure x4, Cockatiel x2, Indian Ringneck x2, Peach-faced Lovebird x2, Sun Conure),
-- so pairing birds from different families shows a low inbreeding coefficient, while pairing within a family
-- shows a high one. The loners are unrelated founders spread across the species.
-- Needs the species table loaded (npm run seed:species) so each bird gets its species.

insert into birds (id, name, sex, species, species_code, mutation, mother_id, father_id, notes, status)
select v.id, v.name, v.sex, v.species, v.species_code, v.mutation, v.mother_id, v.father_id, v.notes, 'Available'
from (values
${lines.join(',\n')}
) as v(id, name, sex, species, species_code, mutation, mother_id, father_id, notes)
on conflict (id) do nothing;
`;
fs.writeFileSync('sql/020_test_pedigree.sql', sql);
const counts = {}; Object.values(speciesOf).forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
console.log(birds.length, 'birds', counts, 'families', Object.keys(fam).length);
