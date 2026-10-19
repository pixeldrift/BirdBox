const { neon } = require('@neondatabase/serverless');
const { normalize, escapeLike, toSpecies } = require('../_lib/species');
const { expand } = require('../_lib/dictionary');

const sql = neon(process.env.DATABASE_URL);

const NAMES = `
  select code, common_name as name, false as is_sci from species
  union all select code, display_name, false from species where display_name is not null
  union all select species_code, name, false from species_names
  union all select code, scientific_name, true from species`;

const SELECT = `
  select s.code, s.common_name, s.display_name, s.scientific_name, s.family_name, s.order_name,
         coalesce(s.aviculture_override, s.aviculture) as aviculture`;

// Typeahead. Results are ranked: species a breeder is likely to keep first, an exact name match
// above all, then the curated popular species, then prefix / word-start / contains matches
// (scientific-name matches rank behind name matches). Official names, US display names, scientific
// names and every alternate name are searched. If that finds only a few species, a typo-tolerant
// pass adds close spellings ("major mitchels" -> Major Mitchell's Cockatoo).
async function search(q, limit, avicultureOnly) {
  const n = normalize(q);
  // Every spelling the search dictionary treats as the same thing (data/search-dictionary.json).
  const variants = expand(n);
  const escs = variants.map(escapeLike);
  const strict = await sql(`
    with hits as (
      select code, name, is_sci, bb_norm(name) as nn from (${NAMES}) n
    ), scored as (
      select code, name,
        (case when nn = any($6::text[]) then -1 when nn like any($1::text[]) then 0 when nn like any($2::text[]) then 1 else 2 end)
          + (case when is_sci then 3 else 0 end) as rank
      from hits where nn like any($3::text[])
    )
    ${SELECT},
           (array_agg(h.name order by h.rank, length(h.name)))[1] as matched_name,
           min(h.rank) as rank
    from scored h join species s on s.code = h.code
    where ($4::boolean = false or coalesce(s.aviculture_override, s.aviculture))
    group by s.code
    order by coalesce(s.aviculture_override, s.aviculture) desc, (min(h.rank) = -1) desc,
             (s.popularity > 0) desc, min(h.rank), s.popularity desc, s.taxon_order
    limit $5`, [escs.map((e) => e + '%'), escs.map((e) => '% ' + e + '%'), escs.map((e) => '%' + e + '%'), avicultureOnly, limit, variants]);

  let rows = strict;
  if (rows.length < Math.min(limit, 5) && n.length >= 4) {
    const fuzzy = await sql(`
      with hits as (
        select code, name, bb_norm(name) as nn from (${NAMES}) n where not is_sci
      )
      ${SELECT},
             (array_agg(h.name order by word_similarity($1, h.nn) + similarity($1, h.nn) desc))[1] as matched_name,
             max(word_similarity($1, h.nn) + similarity($1, h.nn)) as score
      from hits h join species s on s.code = h.code
      where word_similarity($1, h.nn) >= 0.55 and similarity($1, h.nn) >= 0.3
        and ($2::boolean = false or coalesce(s.aviculture_override, s.aviculture))
        and s.code <> all($3::text[])
      group by s.code
      order by round((max(word_similarity($1, h.nn) + similarity($1, h.nn)) + (case when coalesce(s.aviculture_override, s.aviculture) then 0.3 else 0 end))::numeric, 1) desc, s.popularity desc
      limit $4`, [n, avicultureOnly, rows.map((r) => r.code), limit - rows.length]);
    // Keep only spellings about as close as the best one, so a clear typo gives one answer.
    const best = fuzzy.length ? Math.max.apply(null, fuzzy.map((r) => Number(r.score))) : 0;
    rows = rows.concat(fuzzy.filter((r) => Number(r.score) >= best - 0.25));
  }
  return rows;
}

// Browse the taxonomy level by level: orders > families > genera > species.
//   ?tree=root                  the orders
//   ?tree=order&value=<order>   its families
//   ?tree=family&value=<family> its genera
//   ?tree=genus&value=<genus>   its species
// Each group carries how many species it holds and how many are commonly kept (aviculture);
// scope=aviculture limits the counts and the species to the commonly kept ones.
async function tree(kind, value, avicultureOnly) {
  const keep = avicultureOnly ? 'and coalesce(aviculture_override, aviculture)' : '';
  const counts = 'count(*)::int as species, (count(*) filter (where coalesce(aviculture_override, aviculture)))::int as kept';
  if (kind === 'root') {
    return sql(`select order_name as name, ${counts} from species where true ${keep} group by order_name order by min(taxon_order)`);
  }
  if (kind === 'order') {
    return sql(`select family_name as name, min(family_scientific) as scientific, ${counts} from species where order_name = $1 ${keep}
                group by family_name order by min(taxon_order)`, [value]);
  }
  if (kind === 'family') {
    return sql(`select split_part(scientific_name, ' ', 1) as name, ${counts} from species where family_name = $1 ${keep}
                group by split_part(scientific_name, ' ', 1) order by min(taxon_order)`, [value]);
  }
  if (kind === 'genus') {
    const rows = await sql(`${SELECT} from species s where split_part(s.scientific_name, ' ', 1) = $1 ${avicultureOnly ? 'and coalesce(s.aviculture_override, s.aviculture)' : ''}
                            order by s.taxon_order limit 300`, [value]);
    return rows.map(toSpecies);
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const query = req.query || {};
  try {
    if (query.tree) {
      const rows = await tree(String(query.tree), String(query.value || ''), query.scope === 'aviculture');
      if (!rows) { res.status(400).json({ error: 'Unknown level' }); return; }
      res.status(200).json(rows);
      return;
    }
    if (query.code) {
      const rows = await sql(`
        ${SELECT}, s.taxonomy_version,
               coalesce((select json_agg(json_build_object('name', n.name, 'kind', n.kind) order by n.name)
                         from species_names n where n.species_code = s.code), '[]'::json) as names
        from species s where s.code = $1`, [String(query.code)]);
      if (!rows.length) {
        res.status(404).json({ error: 'Species not found' });
        return;
      }
      res.status(200).json(Object.assign(toSpecies(rows[0]), { alternateNames: rows[0].names, taxonomyVersion: rows[0].taxonomy_version }));
      return;
    }
    const q = String(query.q || '').trim();
    if (!q) {
      res.status(400).json({ error: 'Provide q (search text) or code' });
      return;
    }
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 15, 1), 50);
    const rows = await search(q, limit, query.scope === 'aviculture');
    res.status(200).json(rows.map((r) => {
      const s = toSpecies(r);
      // Which alternate name matched, shown when it isn't the name we'd label the species with.
      s.matchedName = r.matched_name && normalize(r.matched_name) !== normalize(s.name) &&
        normalize(r.matched_name) !== normalize(s.scientificName) ? r.matched_name : null;
      return s;
    }));
  } catch (err) {
    res.status(500).json({ error: 'Failed to search species' });
  }
};
