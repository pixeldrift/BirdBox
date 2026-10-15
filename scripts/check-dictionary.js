// Checks data/search-dictionary.json after an edit: node scripts/check-dictionary.js
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'data', 'search-dictionary.json');
let data;
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (err) {
  console.error('Not valid JSON — check commas and quotes: ' + err.message);
  process.exit(1);
}
const groups = data.groups;
if (!Array.isArray(groups)) { console.error('"groups" must be a list'); process.exit(1); }
let bad = 0;
const seen = new Map();
groups.forEach((g, i) => {
  if (!Array.isArray(g) || g.length < 2 || g.some((w) => typeof w !== 'string' || !w.trim())) {
    console.error('Group ' + (i + 1) + ' needs at least two words in quotes: ' + JSON.stringify(g)); bad++; return;
  }
  g.forEach((w) => {
    const k = w.toLowerCase().trim();
    if (seen.has(k) && seen.get(k) !== i) { console.error('"' + w + '" appears in groups ' + (seen.get(k) + 1) + ' and ' + (i + 1) + ' — merge them'); bad++; }
    seen.set(k, i);
  });
});
console.log(bad ? bad + ' problem(s).' : 'OK — ' + groups.length + ' groups.');
process.exit(bad ? 1 : 0);
