// Lightweight building lookup, just enough to give a cage a friendly location name.
// Matches the real Buildings table's short codes (see docs/data-model.md) but BirdBox
// doesn't need a full Buildings/Cages entity yet — Birds.cage (a plain code like
// "F2-001" or "FLN") is grouped directly into "cages in use" by the Caging screen.
const BUILDINGS_SAMPLE = [
  { code: 'F1', nickname: '1', description: 'Top of the hill' },
  { code: 'F2', nickname: '2', description: 'Up the hill' },
  { code: 'F3', nickname: '3', description: 'Up the hill' },
  { code: 'F4', nickname: '4', description: 'Up the hill' },
  { code: 'F5', nickname: '5', description: 'Up the hill' },
  { code: 'F6', nickname: '6', description: 'Base of the hill' },
  { code: 'FD', nickname: 'Driveway', description: 'Between the two driveways' },
  { code: 'FUN', nickname: 'Upper Nursery', description: "Steve's Garage" },
  { code: 'FLN', nickname: 'Lower Nursery', description: 'Guesthouse Garage' },
];

function buildingForCage(cageCode) {
  if (!cageCode) return null;
  var prefix = cageCode.indexOf('-') !== -1 ? cageCode.split('-')[0] : cageCode;
  return BUILDINGS_SAMPLE.filter(function (b) { return b.code === prefix; })[0] || null;
}
