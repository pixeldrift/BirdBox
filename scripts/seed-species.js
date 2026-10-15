// Loads the eBird/Clements taxonomy into the `species` table (see sql/007_species.sql), then
// the hand-curated alternate names in scripts/species-aliases.js. Safe to re-run: it upserts, so
// a new taxonomy version updates names/order/family in place without touching your
// `aviculture_override` edits.
//
//   DATABASE_URL=postgres://... npm run seed:species
//   node scripts/seed-species.js --file path/to/taxonomy.json   (skip the download)
//
// Uses eBird's public taxonomy endpoint, which worked without an API key when tried; if eBird
// starts requiring one, set EBIRD_API_KEY and it is sent as the X-eBirdApiToken header.

const { ALIASES, DISPLAY, GENUS_RULES, POPULAR } = require('./species-aliases');

const TAXONOMY_URL = 'https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&cat=species';
const VERSIONS_URL = 'https://api.ebird.org/v2/ref/taxonomy/versions';

// First-guess "a breeder might keep this" rules — a starting point to review, not a verdict.
// Wild songbirds are deliberately excluded (rare in aviculture); finches and their relatives are in.
const AVICULTURE_ORDERS = new Set([
  'Psittaciformes', 'Columbiformes', 'Anseriformes', 'Galliformes', 'Struthioniformes',
  'Rheiformes', 'Casuariiformes', 'Phoenicopteriformes', 'Musophagiformes',
]);
const AVICULTURE_FAMILIES = new Set([
  'Estrildidae', 'Fringillidae', 'Ploceidae', 'Viduidae', 'Sturnidae', 'Ramphastidae', 'Bucerotidae', 'Falconidae',
]);

function isAviculture(r) {
  return AVICULTURE_ORDERS.has(r.order) || AVICULTURE_FAMILIES.has(r.familySciName);
}

function genusOf(r) {
  return r.sciName.split(' ')[0];
}

// The rule-derived name for a species (e.g. "Nanday Parakeet" -> "Nanday Conure"), or null.
function ruleName(r, onlyDisplay) {
  for (const rule of GENUS_RULES) {
    if (onlyDisplay && !rule.display) continue;
    if (rule.genera.indexOf(genusOf(r)) !== -1 && r.comName.endsWith(' ' + rule.from)) {
      return { name: r.comName.slice(0, -rule.from.length) + rule.to, kind: rule.kind };
    }
  }
  return null;
}

// Name shown in labels: an explicit US name, else a genus-rule name, else null (use eBird's).
function displayName(r) {
  if (DISPLAY[r.sciName]) return DISPLAY[r.sciName];
  const rule = ruleName(r, true);
  return rule ? rule.name : null;
}

async function fetchJson(url) {
  const headers = process.env.EBIRD_API_KEY ? { 'X-eBirdApiToken': process.env.EBIRD_API_KEY } : {};
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('eBird request failed (' + res.status + '): ' + url);
  return res.json();
}

// Alias rows [code, name, kind, source] resolved against this taxonomy; `unresolved` lists
// scientific names that no longer exist (e.g. after a revision) so they can be re-pointed.
function buildAliases(taxonomy) {
  const bySci = new Map(taxonomy.map((r) => [r.sciName, r]));
  const rows = [];
  const unresolved = [];
  Object.keys(ALIASES).forEach((sci) => {
    const r = bySci.get(sci);
    if (!r) { unresolved.push(sci); return; }
    ALIASES[sci].forEach((a) => rows.push([r.speciesCode, a[0], a[1], 'curated']));
  });
  taxonomy.forEach((r) => {
    const rule = ruleName(r, false);
    if (rule) rows.push([r.speciesCode, rule.name, rule.kind, 'genus rule']);
    if (DISPLAY[r.sciName]) rows.push([r.speciesCode, DISPLAY[r.sciName], 'trade', 'display name']);
  });
  return { rows, unresolved };
}

// `query(text, params)` runs one parameterised statement — injected so tests can use any driver.
async function seed({ query, taxonomy, version, log = console.log }) {
  const popularity = new Map(POPULAR.map((sci, i) => [sci, 100 - i]));
  const cols = [[], [], [], [], [], [], [], [], [], [], [], []];
  taxonomy.forEach((r) => {
    [r.speciesCode, r.comName, r.sciName, r.order, r.familyCode || null, r.familyComName || null,
      r.familySciName || null, r.taxonOrder, version, isAviculture(r), popularity.get(r.sciName) || 0, displayName(r)]
      .forEach((v, i) => cols[i].push(v));
  });

  const BATCH = 1000;
  for (let start = 0; start < taxonomy.length; start += BATCH) {
    const p = cols.map((c) => c.slice(start, start + BATCH));
    await query(`
      insert into species (code, common_name, scientific_name, order_name, family_code, family_name,
                           family_scientific, taxon_order, taxonomy_version, aviculture, popularity, display_name)
      select * from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[],
                           $7::text[], $8::numeric[], $9::text[], $10::boolean[], $11::int[], $12::text[])
      on conflict (code) do update set
        common_name = excluded.common_name, scientific_name = excluded.scientific_name,
        order_name = excluded.order_name, family_code = excluded.family_code,
        family_name = excluded.family_name, family_scientific = excluded.family_scientific,
        taxon_order = excluded.taxon_order, taxonomy_version = excluded.taxonomy_version,
        aviculture = excluded.aviculture, popularity = excluded.popularity,
        display_name = excluded.display_name`, p);
  }
  log('Species upserted: ' + taxonomy.length + ' (taxonomy ' + version + ')');

  const { rows, unresolved } = buildAliases(taxonomy);
  const acols = [[], [], [], []];
  rows.forEach((r) => r.forEach((v, i) => acols[i].push(v)));
  await query(`
    insert into species_names (species_code, name, kind, source)
    select a.code, a.name, a.kind, a.source
    from unnest($1::text[], $2::text[], $3::text[], $4::text[]) as a(code, name, kind, source)
    join species s on s.code = a.code
    where lower(a.name) <> lower(s.common_name)
    on conflict (species_code, (lower(name))) do nothing`, acols);
  log('Alternate names considered: ' + rows.length);
  if (unresolved.length) log('WARNING: aliases whose scientific name is not in this taxonomy: ' + unresolved.join(', '));
  return { species: taxonomy.length, aliases: rows.length, unresolved };
}

async function main() {
  const fileArg = process.argv.indexOf('--file');
  let taxonomy, version;
  if (fileArg !== -1) {
    taxonomy = JSON.parse(require('fs').readFileSync(process.argv[fileArg + 1], 'utf8'));
    version = 'file';
  } else {
    taxonomy = await fetchJson(TAXONOMY_URL);
    const versions = await fetchJson(VERSIONS_URL);
    const latest = versions.find((v) => v.latest) || versions[0];
    version = String(latest.authorityVer).replace(/\.0$/, '');
  }
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL to your Neon connection string');
  const { neon } = require('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);
  await seed({ query: (text, params) => sql(text, params), taxonomy, version });
}

if (require.main === module) {
  main().catch((err) => { console.error(err.message); process.exit(1); });
}

module.exports = { seed, buildAliases, isAviculture, displayName };
