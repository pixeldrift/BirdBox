// Shared by the species and birds endpoints. (Files starting with "_" are not served as routes.)

// Mirror of the bb_norm() SQL function in sql/007_species.sql — keep the two identical.
function normalize(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/['’]/g, '')
    .replace(/\./g, '')
    .replace(/&/g, ' and ')
    .replace(/grey/g, 'gray')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeLike(s) {
  return s.replace(/[\\%_]/g, (c) => '\\' + c);
}

function bowUrl(code) {
  return 'https://birdsoftheworld.org/bow/species/' + code + '/cur/introduction';
}

// Row from the species table -> what the app sees. `name` is the label to show: the US
// display name when there is one, else eBird's common name. Scientific name is secondary.
function toSpecies(row) {
  return {
    code: row.code,
    name: row.display_name || row.common_name,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    family: row.family_name,
    order: row.order_name,
    aviculture: row.aviculture,
    birdsOfTheWorldUrl: bowUrl(row.code),
  };
}

module.exports = { normalize, escapeLike, bowUrl, toSpecies };
