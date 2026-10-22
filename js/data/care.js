// Care plans: what each cage, room, building, location, bird — or the whole aviary — is fed and given
// (sql/023_care_plans.sql). The most specific plan wins: a bird's own plan, else its cage's, else its room's,
// else its building's, else its location's, else the aviary-wide one.
var CARE_SAMPLE = [];

var MEAL_TIMES = ['Morning', 'Midday', 'Evening', 'Night', 'Anytime'];

var careLoaded = fetch('/api/records?type=care')
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load care plans');
    return res.json();
  })
  .then(function (list) {
    CARE_SAMPLE.length = 0;
    Array.prototype.push.apply(CARE_SAMPLE, list);
  })
  .catch(function (err) {
    console.error('Could not load care plans from the server:', err);
  });

// A plan's own lines for one target, in time-of-day order.
function careItems(targetType, targetId) {
  return CARE_SAMPLE.filter(function (c) { return c.targetType === targetType && c.targetId === targetId; })
    .sort(function (a, b) { return MEAL_TIMES.indexOf(a.mealTime) - MEAL_TIMES.indexOf(b.mealTime); });
}

// The places above a target, most specific first: [{ type, id, label }].
function careChain(targetType, targetId) {
  var chain = [];
  var self = { type: targetType, id: targetId, label: careLabel(targetType, targetId) };
  var cageCode = null, room = null, building = null, location = null;
  if (targetType === 'bird') {
    var bird = getBird(targetId);
    chain.push(self);
    cageCode = bird ? bird.cage : null;
    if (cageCode) chain.push({ type: 'cage', id: cageCode, label: careLabel('cage', cageCode) });
  } else {
    chain.push(self);
    if (targetType === 'cage') cageCode = targetId;
  }
  if (targetType === 'cage' || cageCode) {
    room = roomForCage(cageCode);
    building = buildingForCage(cageCode);
    location = room ? roomLocation(room) : buildingLocation(building);
  } else if (targetType === 'room') {
    room = getRoom(targetId); building = buildingForRoom(room); location = roomLocation(room);
  } else if (targetType === 'building') {
    building = getBuilding(targetId); location = buildingLocation(building);
  } else if (targetType === 'location') {
    location = getLocation(targetId);
  }
  if (room && targetType !== 'room') chain.push({ type: 'room', id: room.id, label: room.name });
  if (building && targetType !== 'building') chain.push({ type: 'building', id: building.code, label: 'Building ' + building.nickname });
  if (location && targetType !== 'location') chain.push({ type: 'location', id: location.id, label: location.name });
  if (targetType !== 'aviary') chain.push({ type: 'aviary', id: 'main', label: AVIARY.name });
  return chain;
}

function careLabel(type, id) {
  if (type === 'bird') { var b = getBird(id); return b ? (b.name || b.band || 'bird') : 'bird'; }
  if (type === 'cage') return 'Cage ' + id;
  if (type === 'room') { var r = getRoom(id); return r ? r.name : 'room'; }
  if (type === 'building') { var bl = getBuilding(id); return bl ? 'Building ' + bl.nickname : 'building'; }
  if (type === 'location') { var l = getLocation(id); return l ? l.name : 'location'; }
  return AVIARY.name;
}

// The plan that applies to a target: its own if it has one, else the nearest one above it.
// -> { items, from: { type, id, label } | null, own: boolean }
function effectiveCare(targetType, targetId) {
  var chain = careChain(targetType, targetId);
  for (var i = 0; i < chain.length; i++) {
    var items = careItems(chain[i].type, chain[i].id);
    if (items.length) return { items: items, from: chain[i], own: i === 0 };
  }
  return { items: [], from: null, own: false };
}

// Where a supply is used: the lines (in any plan) that point at it.
function supplyUsage(supplyId) {
  return CARE_SAMPLE.filter(function (c) { return c.supplyId === supplyId; });
}

function careTargetHash(type, id) {
  if (type === 'bird') return '#/mybirds/birds/' + id;
  if (type === 'cage') return '#/aviary/caging/' + id;
  if (type === 'aviary') return '#/aviary/caging/aviary';
  return '#/aviary/caging/' + type + '~' + id;
}

// A line as words: "Pellets — ¼ cup, Morning".
function careLineText(c) {
  var sup = c.supplyId ? getSupply(c.supplyId) : null;
  return (sup ? sup.name : c.label || 'Care') + (c.amount ? ' — ' + c.amount : '');
}
