// Supplies: feed, supplements, cleaning products, medical items and equipment kept on hand (sql/022_supplies.sql).
// Care plans will link to these, so a food can be tapped for its photos, source and how much is left.
var SUPPLIES_SAMPLE = [];

var SUPPLY_CATEGORIES = ['Feed', 'Supplement', 'Cleaning', 'Medical', 'Equipment', 'Other'];

var suppliesLoaded = fetch('/api/records?type=supplies')
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load supplies');
    return res.json();
  })
  .then(function (list) {
    SUPPLIES_SAMPLE.length = 0;
    Array.prototype.push.apply(SUPPLIES_SAMPLE, list);
  })
  .catch(function (err) {
    console.error('Could not load supplies from the server:', err);
  });

function getSupply(id) {
  return SUPPLIES_SAMPLE.filter(function (s) { return s.id === id; })[0] || null;
}

// The picture to show for a supply: its main uploaded photo, else the first of the photos that came with the app.
function supplyThumbUrl(s) {
  if (s.mainImage) return s.mainImage;
  return mediaMainPhotoUrl('supply', s.id) || (s.images && s.images[0]) || '';
}

// "12 bags" / "3.5 lb" — the amount on hand with its unit.
function supplyAmount(s, qty) {
  var q = qty === undefined ? s.quantity : qty;
  if (q === null || q === undefined || q === '') return 'Not counted';
  return q + (s.unit ? ' ' + s.unit : '');
}

// Running low: a reorder level is set and the amount on hand is at or under it.
function supplyIsLow(s) {
  return s.reorderLevel !== null && s.reorderLevel !== undefined && s.quantity !== null && s.quantity !== undefined && Number(s.quantity) <= Number(s.reorderLevel);
}
