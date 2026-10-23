// Calendar events (sql/025_events.sql) and the one list the Calendar reads from: calendarItems() gathers events,
// task occurrences, shipments and health visits for a date range into one shape so a month, a week and a day can all
// draw them the same way.
var EVENTS_SAMPLE = [];
var EVENT_LINKS_SAMPLE = [];

var EVENT_KINDS = ['Appointment', 'Meetup', 'Tour', 'Call', 'Other'];

var eventsLoaded = Promise.all([loadTaskList('events', EVENTS_SAMPLE), loadTaskList('eventlinks', EVENT_LINKS_SAMPLE)]);

function getEvent(id) {
  return EVENTS_SAMPLE.filter(function (e) { return e.id === id; })[0] || null;
}

function eventLinks(eventId) {
  return EVENT_LINKS_SAMPLE.filter(function (l) { return l.eventId === eventId; });
}

// "9:30 AM – 10:30 AM", "All day", or "".
function eventTimeText(e) {
  if (e.allDay) return 'All day';
  if (!e.startTime) return '';
  return AppTime.pretty(e.startTime) + (e.endTime ? ' – ' + AppTime.pretty(e.endTime) : '');
}

// Does this event cover that day? (An event can span several days.)
function eventOnDay(e, iso) {
  var start = String(e.startDate).slice(0, 10);
  var end = e.endDate ? String(e.endDate).slice(0, 10) : start;
  return iso >= start && iso <= end;
}

// The links as records you can open: [{ type, id, label, hash }].
function eventLinkTargets(eventId) {
  return eventLinks(eventId).map(function (l) {
    var info = null;
    if (l.targetType === 'bird') { var b = getBird(l.targetId); info = b ? { label: birdShortLabel(b), hash: '#/mybirds/birds/' + l.targetId } : null; }
    else if (l.targetType === 'contact') { var c = getContact(l.targetId); info = c ? { label: c.name, hash: '#/business/contacts/' + l.targetId } : null; }
    else if (l.targetType === 'waybill') { var m = mediaTargetInfo({ targetType: 'waybill', targetId: l.targetId }); info = m ? { label: m.text, hash: m.hash } : null; }
    else if (l.targetType === 'cage') info = { label: 'Cage ' + l.targetId, hash: careTargetHash('cage', l.targetId) };
    else if (l.targetType === 'task') { var t = getTask(l.targetId); info = t ? { label: t.title, hash: '#/aviary/tasks/' + l.targetId } : null; }
    return info ? { link: l, type: l.targetType, id: l.targetId, label: info.label, hash: info.hash } : null;
  }).filter(Boolean);
}

// Everything on the calendar between two days (inclusive): [{ kind, date, title, sub, time, done, hash, ref }].
// layers: { events, tasks, shipments, health } (omitted = all on).
function calendarItems(fromISO, toISO, layers) {
  var on = layers || { events: true, tasks: true, shipments: true, health: true };
  var out = [];
  if (on.events) {
    EVENTS_SAMPLE.forEach(function (e) {
      for (var d = fromISO; d <= toISO; d = addDaysISO(d, 1)) {
        if (!eventOnDay(e, d)) continue;
        var c = e.contactId ? getContact(e.contactId) : null;
        out.push({ kind: 'event', date: d, title: e.title, sub: [e.kind, eventTimeText(e), c ? c.name : '', e.place].filter(Boolean).join(' · '),
          time: e.allDay ? '00:00' : e.startTime || '99:99', hash: '#/aviary/calendar/' + e.id, ref: e });
      }
    });
  }
  if (on.tasks) {
    taskOccurrences(fromISO, toISO).forEach(function (o) {
      var p = taskProgress(o.task, o.date);
      var slot = { Morning: '08:00', Midday: '12:00', Evening: '18:00', Night: '21:00', Anytime: '23:00' }[o.task.timeOfDay] || '23:00';
      out.push({ kind: 'task', date: o.date, title: o.task.title, sub: [o.task.kind, o.task.timeOfDay !== 'Anytime' ? o.task.timeOfDay : '', taskTargetLabel(o.task)].filter(Boolean).join(' · '),
        time: slot, done: p.done === p.total, hash: '#/aviary/tasks/' + o.task.id, ref: o.task });
    });
  }
  if (on.shipments) {
    WAYBILLS_SAMPLE.forEach(function (w) {
      var d = w.date ? String(w.date).slice(0, 10) : '';
      if (!d || d < fromISO || d > toISO) return;
      var cl = w.clientId ? getContact(w.clientId) : null;
      var route = [w.departingAirport, w.arrivingAirport].filter(Boolean).join(' → ');
      out.push({ kind: 'shipment', date: d, title: (w.direction === 'Incoming' ? 'Receiving' : 'Shipping') + ' · ' + (cl ? cl.name : route || 'shipment'), sub: [waybillStateLabel(w), cl ? route : ''].filter(Boolean).join(' · '),
        time: '10:00', hash: '#/business/shipping/' + w.id, ref: w });
    });
  }
  if (on.health) {
    HEALTH_RECORDS_SAMPLE.forEach(function (r) {
      var d = r.date ? String(r.date).slice(0, 10) : '';
      if (!d || d < fromISO || d > toISO) return;
      var b = getBird(r.birdId);
      out.push({ kind: 'health', date: d, title: r.type + (b ? ' · ' + (b.name || b.band || 'bird') : ''), sub: r.provider || '', time: '11:00', hash: '#/mybirds/health/' + r.id, ref: r });
    });
  }
  out.sort(function (a, b) { return a.date.localeCompare(b.date) || a.time.localeCompare(b.time); });
  return out;
}
