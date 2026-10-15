// Search "autocorrect" dictionary: data/search-dictionary.json lists groups of words that mean the
// same thing when searching. It only widens what a search matches; stored names are never changed.
const { normalize } = require('./species');

let groups = [];
try {
  const raw = require('../../data/search-dictionary.json');
  groups = (raw.groups || [])
    .filter(Array.isArray)
    .map((g) => Array.from(new Set(g.map(normalize).filter(Boolean))))
    .filter((g) => g.length > 1);
} catch (err) {
  groups = []; // a broken file must never take searching down
}

const MAX_VARIANTS = 24;

function replacePhrase(text, from, to) {
  const padded = ' ' + text + ' ';
  const needle = ' ' + from + ' ';
  const at = padded.indexOf(needle);
  if (at < 0) return null;
  return (padded.slice(0, at) + ' ' + to + ' ' + padded.slice(at + needle.length)).trim().replace(/\s+/g, ' ');
}

// Normalised search text -> the text itself plus every spelling the dictionary says is equivalent.
function expand(text, dict) {
  const list = dict || groups;
  const out = [text];
  const seen = new Set(out);
  for (const group of list) {
    for (const current of out.slice()) {
      for (const member of group) {
        for (const other of group) {
          if (other === member) continue;
          const next = replacePhrase(current, member, other);
          if (next && !seen.has(next) && out.length < MAX_VARIANTS) {
            seen.add(next);
            out.push(next);
          }
        }
      }
    }
  }
  return out;
}

module.exports = { expand, groupCount: groups.length };
