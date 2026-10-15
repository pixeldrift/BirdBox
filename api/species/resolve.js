const { neon } = require('@neondatabase/serverless');
const { normalize, toSpecies } = require('../_lib/species');

const sql = neon(process.env.DATABASE_URL);

const NAMES = `
  select code, common_name as name from species
  union all select code, display_name from species where display_name is not null
  union all select species_code, name from species_names
  union all select code, scientific_name from species`;

// POST { names: ["Sun Conure", "cockatel", ...] } -> one result per name, used by the CSV import:
//   exact      exactly one species has this name (official, US, alternate or scientific)
//   ambiguous  several species share it (e.g. "Eclectus Parrot"); candidates listed
//   close      no exact match, but a near spelling exists; suggested, never auto-accepted
//   none       nothing close
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const names = req.body && req.body.names;
  if (!Array.isArray(names) || names.length === 0 || names.length > 300) {
    res.status(400).json({ error: 'Send between 1 and 300 names' });
    return;
  }
  try {
    const norms = Array.from(new Set(names.map(normalize).filter(Boolean)));
    const exact = norms.length ? await sql(`
      select q.nn, s.code, s.common_name, s.display_name, s.scientific_name, s.family_name, s.order_name,
             coalesce(s.aviculture_override, s.aviculture) as aviculture
      from unnest($1::text[]) as q(nn)
      join (${NAMES}) n on bb_norm(n.name) = q.nn
      join species s on s.code = n.code
      group by q.nn, s.code`, [norms]) : [];
    const byNorm = new Map();
    exact.forEach((r) => {
      if (!byNorm.has(r.nn)) byNorm.set(r.nn, []);
      byNorm.get(r.nn).push(toSpecies(r));
    });

    const close = new Map();
    const unresolved = norms.filter((n) => !byNorm.has(n)).slice(0, 25);
    for (const n of unresolved) {
      if (n.length < 4) continue;
      const rows = await sql(`
        select s.code, s.common_name, s.display_name, s.scientific_name, s.family_name, s.order_name,
               coalesce(s.aviculture_override, s.aviculture) as aviculture,
               max(word_similarity($1, bb_norm(n.name)) + similarity($1, bb_norm(n.name))) as score
        from (${NAMES}) n join species s on s.code = n.code
        where word_similarity($1, bb_norm(n.name)) >= 0.55 and similarity($1, bb_norm(n.name)) >= 0.3
        group by s.code
        order by round((max(word_similarity($1, bb_norm(n.name)) + similarity($1, bb_norm(n.name))) + (case when coalesce(s.aviculture_override, s.aviculture) then 0.3 else 0 end))::numeric, 1) desc, s.popularity desc
        limit 3`, [n]);
      if (rows.length) {
        const best = Math.max.apply(null, rows.map((r) => Number(r.score)));
        close.set(n, rows.filter((r) => Number(r.score) >= best - 0.15).map(toSpecies));
      }
    }

    res.status(200).json(names.map((input) => {
      const n = normalize(input);
      const hits = byNorm.get(n);
      if (hits && hits.length === 1) return { input, status: 'exact', species: hits[0] };
      if (hits) return { input, status: 'ambiguous', candidates: hits.slice(0, 5) };
      if (close.has(n)) return { input, status: 'close', candidates: close.get(n) };
      return { input, status: 'none' };
    }));
  } catch (err) {
    res.status(500).json({ error: 'Failed to look up species' });
  }
};
