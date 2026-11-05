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

// A plan's own lines for one target, in time-of-day order. plan: 'feeding' (the default) or 'cleaning'.
function careItems(targetType, targetId, plan) {
  plan = plan || 'feeding';
  return CARE_SAMPLE.filter(function (c) { return (c.plan || 'feeding') === plan && c.targetType === targetType && c.targetId === targetId; })
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
  if (type === 'cage') return T('Cage ') + id;
  if (type === 'room') { var r = getRoom(id); return r ? r.name : 'room'; }
  if (type === 'building') { var bl = getBuilding(id); return bl ? 'Building ' + bl.nickname : 'building'; }
  if (type === 'location') { var l = getLocation(id); return l ? l.name : 'location'; }
  return AVIARY.name;
}

// The plan that applies to a target: its own if it has one, else the nearest one above it.
// -> { items, from: { type, id, label } | null, own: boolean }
function effectiveCare(targetType, targetId, plan) {
  var chain = careChain(targetType, targetId);
  for (var i = 0; i < chain.length; i++) {
    var items = careItems(chain[i].type, chain[i].id, plan);
    if (items.length) return { items: items, from: chain[i], own: i === 0 };
  }
  return { items: [], from: null, own: false };
}

// Every supply a line uses: a feeding line's one food, or a cleaning job's list (comma-separated ids).
function careSupplyIds(c) {
  var ids = c.supplyId ? [c.supplyId] : [];
  String(c.supplyIds || '').split(',').forEach(function (id) { id = id.trim(); if (id && ids.indexOf(id) === -1) ids.push(id); });
  return ids;
}
function careSupplies(c) {
  return careSupplyIds(c).map(getSupply).filter(Boolean);
}

// Where a supply is used: the lines (in any plan) that point at it.
function supplyUsage(supplyId) {
  return CARE_SAMPLE.filter(function (c) { return careSupplyIds(c).indexOf(supplyId) !== -1; });
}

// ---- cleaning plans: each line is a recurring job ----
// A line's schedule as a task-shaped record, so Tasks and the Calendar can treat it like any other task.
function cleaningJobTask(c) {
  var sups = careSupplies(c);
  return {
    id: c.id, fromPlan: true, plan: 'cleaning', kind: 'Cleaning',
    title: c.label || (sups[0] ? 'Clean with ' + sups[0].name : 'Cleaning job'),
    notes: c.notes || '', startDate: c.startDate || todayISO(), timeOfDay: c.mealTime || 'Anytime',
    repeat: c.repeat || 'Weekly', every: c.every, weekdays: c.weekdays || '', endDate: '',
    assignedTo: c.assignedTo || '', targetType: c.targetType, targetId: c.targetId, supplyIds: careSupplyIds(c), amount: c.amount || '',
  };
}
function cleaningJobTasks() {
  return CARE_SAMPLE.filter(function (c) { return c.plan === 'cleaning'; }).map(cleaningJobTask);
}

function careTargetHash(type, id) {
  if (type === 'bird') return '#/mybirds/birds/' + id;
  if (type === 'cage') return '#/aviary/caging/' + id;
  if (type === 'aviary') return '#/aviary/caging/aviary';
  return '#/aviary/caging/' + type + '~' + id;
}

// A line as words: "Pellets — ¼ cup, Morning".
function careLineText(c) {
  if (c.plan === 'cleaning') return c.label || (careSupplies(c)[0] ? 'Clean with ' + careSupplies(c)[0].name : 'Cleaning job');
  var sup = c.supplyId ? getSupply(c.supplyId) : null;
  return (sup ? sup.name : c.label || 'Care') + (c.amount ? ' — ' + c.amount : '');
}
