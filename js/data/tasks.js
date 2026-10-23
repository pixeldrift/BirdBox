// Tasks: one-off and repeating jobs (sql/024_tasks.sql) and the days they've been ticked off. A repeating task is
// one record; each day it comes up is worked out here from its schedule (taskOccursOn). Ticking a day off adds a
// task_done row. A feeding task reads the care plans (js/data/care.js), and one that covers several cages is a
// checklist with each cage ticked separately.
var TASKS_SAMPLE = [];
var TASK_DONE_SAMPLE = [];

var TASK_KINDS = ['Feeding', 'Cleaning', 'Health', 'Maintenance', 'General'];
var TASK_TIMES = ['Morning', 'Midday', 'Evening', 'Night', 'Anytime'];
var WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function loadTaskList(type, target) {
  return fetch('/api/records?type=' + type)
    .then(function (res) { if (!res.ok) throw new Error('Failed to load ' + type); return res.json(); })
    .then(function (list) { target.length = 0; Array.prototype.push.apply(target, list); })
    .catch(function (err) { console.error('Could not load ' + type + ' from the server:', err); });
}
var tasksLoaded = Promise.all([loadTaskList('tasks', TASKS_SAMPLE), loadTaskList('taskdone', TASK_DONE_SAMPLE)]);

function getTask(id) {
  return TASKS_SAMPLE.filter(function (t) { return t.id === id; })[0] || null;
}

// ---- dates (all local, 'YYYY-MM-DD') ----
function isoOf(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}
function dateOf(iso) { return new Date(String(iso).slice(0, 10) + 'T00:00:00'); }
function todayISO() { return isoOf(new Date()); }
function addDaysISO(iso, n) { var d = dateOf(iso); d.setDate(d.getDate() + n); return isoOf(d); }
function daysBetweenISO(a, b) { return Math.round((dateOf(b) - dateOf(a)) / 86400000); }
function daysInMonthOf(iso) { var d = dateOf(iso); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }

function taskWeekdays(t) {
  var list = String(t.weekdays || '').split(',').filter(function (x) { return x !== ''; }).map(Number);
  return list.length ? list : [dateOf(t.startDate).getDay()];
}

// Does this task come up on that day?
function taskOccursOn(t, iso) {
  var start = String(t.startDate).slice(0, 10);
  if (iso < start) return false;
  if (t.endDate && iso > String(t.endDate).slice(0, 10)) return false;
  if (t.repeat === 'Daily') return true;
  if (t.repeat === 'Weekly') return taskWeekdays(t).indexOf(dateOf(iso).getDay()) !== -1;
  if (t.repeat === 'Monthly') return dateOf(iso).getDate() === Math.min(dateOf(start).getDate(), daysInMonthOf(iso));
  if (t.repeat === 'Custom') return daysBetweenISO(start, iso) % Math.max(1, Number(t.every) || 1) === 0;
  return iso === start;
}

// "Every day", "Mon, Wed, Fri", "Every 3 days", "Once"…
function taskScheduleText(t) {
  var s;
  if (t.repeat === 'Daily') s = 'Every day';
  else if (t.repeat === 'Weekly') s = taskWeekdays(t).map(function (d) { return WEEKDAY_NAMES[d]; }).join(', ');
  else if (t.repeat === 'Monthly') s = 'Monthly on the ' + ordinal(dateOf(t.startDate).getDate());
  else if (t.repeat === 'Custom') s = 'Every ' + (Number(t.every) || 1) + (Number(t.every) === 1 ? ' day' : ' days');
  else s = 'Once, ' + formatDate(t.startDate);
  return s + (t.timeOfDay && t.timeOfDay !== 'Anytime' ? ' · ' + t.timeOfDay : '');
}
function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

// ---- ticking off ----
function taskDoneRow(taskId, iso, sub) {
  return TASK_DONE_SAMPLE.filter(function (d) { return d.taskId === taskId && String(d.onDate).slice(0, 10) === iso && (d.subKey || '') === (sub || ''); })[0] || null;
}

// The cages a feeding round covers: those under its place (or all cages), each with the plan that applies.
function taskSubitems(t) {
  if (t.kind !== 'Feeding') return [];
  var scope = ['aviary', 'location', 'building', 'room'];
  if (t.targetType && scope.indexOf(t.targetType) === -1) return [];
  return allCages().filter(function (c) {
    if (!t.targetType || t.targetType === 'aviary') return true;
    return careChain('cage', c.code).some(function (x) { return x.type === t.targetType && x.id === t.targetId; });
  }).map(function (c) { return { key: c.code, label: 'Cage ' + c.code, plan: effectiveCare('cage', c.code) }; })
    .filter(function (s) { return s.plan.items.length; });
}

// { done, total } for one day: a checklist counts its cages, a plain task is 0 or 1.
function taskProgress(t, iso) {
  var subs = taskSubitems(t);
  if (!subs.length) { var d = taskDoneRow(t.id, iso, ''); return { done: d ? 1 : 0, total: 1 }; }
  return { done: subs.filter(function (s) { return taskDoneRow(t.id, iso, s.key); }).length, total: subs.length };
}

function setTaskDone(t, iso, sub, done) {
  var row = taskDoneRow(t.id, iso, sub);
  if (done && !row) return createRecord('taskdone', { taskId: t.id, onDate: iso, subKey: sub || '', doneBy: t.assignedTo || '' });
  if (!done && row) return deleteRecord('taskdone', row.id);
  return Promise.resolve();
}

// Every occurrence of every task in a date range: [{ task, date }] (oldest first).
function taskOccurrences(fromISO, toISO, filter) {
  var out = [];
  for (var d = fromISO; d <= toISO; d = addDaysISO(d, 1)) {
    TASKS_SAMPLE.forEach(function (t) { if ((!filter || filter(t)) && taskOccursOn(t, d)) out.push({ task: t, date: d }); });
  }
  return out;
}

// What a task is about, in words and as a link target.
function taskTargetLabel(t) {
  return t.targetType ? careLabel(t.targetType, t.targetId) : '';
}
