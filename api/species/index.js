const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// Ignore case, hyphens and apostrophes so "green cheek" finds "Green-cheeked" and
// "bourkes" finds "Bourke's" — matches the expression used in the SQL below.
function normalize(s) {
  return String(s || '').toLowerCase().replace(/[-]/g, ' ').replace(/['’]/g, '').replace(/\s+/g, ' ').trim();
}

function escapeLike(s) {
  return s.replace(/[\\%_]/g, (c) => '\\' + c);
}

function toSpecies(row) {
  return {
    code: row.code,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    family: row.family_name,
    order: row.order_name,
    aviculture: row.aviculture,
    // Set when the query matched an alternate name (trade name, older name, ...) rather than the
    // official common name, so the picker can show "Sun Conure → Sun Parakeet".
    matchedName: row.matched_name && row.matched_name !== row.common_name ? row.matched_name : null,
    birdsOfTheWorldUrl: 'https://birdsoftheworld.org/bow/species/' + row.code + '/cur/introduction',
  };
}

const NORM = "lower(replace(replace(replace(name, '-', ' '), '''', ''), '’', ''))";

// Typeahead: species a breeder is likely to keep come first, and among those the curated
// popular ones; then prefix matches, word-start matches, and anything containing the text
// (scientific-name matches rank behind name matches); popularity and taxonomic order break ties.
// Matches the official name, scientific name, and every alternate name.
async function search(q, limit, avicultureOnly) {
  const n = escapeLike(normalize(q));
  return sql(`
    with hits as (
      select code, name,
        (case when ${NORM} like $1 then 0 when ${NORM} like $2 then 1 else 2 end) + (case when is_sci then 3 else 0 end) as rank
      from (
        select code, common_name as name, false as is_sci from species
        union all select species_code, name, false from species_names
        union all select code, scientific_name, true from species
      ) n
      where ${NORM} like $3
    )
    select s.code, s.common_name, s.scientific_name, s.family_name, s.order_name,
           coalesce(s.aviculture_override, s.aviculture) as aviculture,
           (array_agg(h.name order by h.rank, length(h.name)))[1] as matched_name
    from hits h join species s on s.code = h.code
    where ($4::boolean = false or coalesce(s.aviculture_override, s.aviculture))
    group by s.code
    order by coalesce(s.aviculture_override, s.aviculture) desc, (s.popularity > 0) desc, min(h.rank), s.popularity desc, s.taxon_order
    limit $5`, [n + '%', '% ' + n + '%', '%' + n + '%', avicultureOnly, limit]);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const query = req.query || {};
  try {
    if (query.code) {
      const rows = await sql(`
        select s.*, coalesce(s.aviculture_override, s.aviculture) as aviculture_effective,
               coalesce((select json_agg(json_build_object('name', n.name, 'kind', n.kind) order by n.name)
                         from species_names n where n.species_code = s.code), '[]'::json) as names
        from species s where s.code = $1`, [String(query.code)]);
      if (!rows.length) {
        res.status(404).json({ error: 'Species not found' });
        return;
      }
      const r = rows[0];
      res.status(200).json(Object.assign(toSpecies(Object.assign({}, r, { aviculture: r.aviculture_effective })), { alternateNames: r.names, taxonomyVersion: r.taxonomy_version }));
      return;
    }
    const q = String(query.q || '').trim();
    if (!q) {
      res.status(400).json({ error: 'Provide q (search text) or code' });
      return;
    }
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 15, 1), 50);
    const rows = await search(q, limit, query.scope === 'aviculture');
    res.status(200).json(rows.map(toSpecies));
  } catch (err) {
    res.status(500).json({ error: 'Failed to search species' });
  }
};

module.exports.normalize = normalize;
