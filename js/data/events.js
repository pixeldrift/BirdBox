// Calendar events (sql/025_events.sql) and the one list the Calendar reads from: calendarItems() gathers events,
// task occurrences, shipments and health visits for a date range into one shape so a month, a week and a day can all
// draw them the same way.
var EVENTS_SAMPLE = [];
var EVENT_LINKS_SAMPLE = [];

var EVENT_KINDS = ['Appointment', 'Vet appointment', 'Show', 'Meetup', 'Tour', 'Call', 'Other'];

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
    else if (l.targetType === 'cage') info = { label: T('Cage ') + l.targetId, hash: careTargetHash('cage', l.targetId) };
    else if (l.targetType === 'task') { var t = getTask(l.targetId); info = t ? { label: t.title, hash: '#/aviary/tasks/' + l.targetId } : null; }
    return info ? { link: l, type: l.targetType, id: l.targetId, label: info.label, hash: info.hash } : null;
  }).filter(Boolean);
}

// Every day an event covers: ['2026-11-07', '2026-11-08'].
function eventDayList(e) {
  var out = [], start = String(e.startDate).slice(0, 10), end = e.endDate ? String(e.endDate).slice(0, 10) : start;
  for (var d = start; d <= end && out.length < 60; d = addDaysISO(d, 1)) out.push(d);
  return out;
}

// A link to a grouped calendar page (one show, one vet visit, one retest day): #/aviary/calendar/g~<type>~<date>~<key>.
function calendarGroupHash(type, date, key) {
  return '#/aviary/calendar/g~' + type + '~' + date + '~' + encodeURIComponent(key).replace(/~/g, '%7E');
}

// The Show-kind event (if any) that a show's results belong to: same name, and the show day falls within it.
function showEventFor(name, dateISO) {
  var key = normShow(name);
  return EVENTS_SAMPLE.filter(function (e) { return e.kind === 'Show' && normShow(e.title) === key && eventOnDay(e, dateISO); })[0] || null;
}

// Everything on the calendar between two days (inclusive): [{ kind, date, title, sub, time, done, hash, ref }].
// layers: { events, tasks, shipments, health, awards, due } (omitted = all on).
function calendarItems(fromISO, toISO, layers) {
  var on = layers || { events: true, tasks: true, shipments: true, health: true, awards: true, due: true };
  var out = [];
  if (on.events) {
    EVENTS_SAMPLE.forEach(function (e) {
      for (var d = fromISO; d <= toISO; d = addDaysISO(d, 1)) {
        if (!eventOnDay(e, d)) continue;
        var c = e.contactId ? getContact(e.contactId) : null;
        var won = e.kind === 'Show' ? awardsAtShow(e.title, d).filter(isAwardWon).length : 0;
        out.push({ kind: 'event', date: d, title: e.title, trophy: won > 0, sub: [e.kind, eventTimeText(e), c ? c.name : '', e.place].filter(Boolean).join(' · '),
          time: e.allDay ? '00:00' : e.startTime || '99:99', hash: '#/aviary/calendar/' + e.id, ref: e });
      }
    });
  }
  if (on.tasks) {
    taskOccurrences(fromISO, toISO).forEach(function (o) {
      var p = taskProgress(o.task, o.date);
      var slot = { Morning: '08:00', Midday: '12:00', Evening: '18:00', Night: '21:00', Anytime: '23:00' }[o.task.timeOfDay] || '23:00';
      out.push({ kind: 'task', date: o.date, title: o.task.title, sub: [o.task.kind, o.task.timeOfDay !== 'Anytime' ? o.task.timeOfDay : '', taskTargetLabel(o.task)].filter(Boolean).join(' · '),
        time: slot, done: p.done === p.total, hash: o.task.fromPlan ? careTargetHash(o.task.targetType, o.task.targetId) : '#/aviary/tasks/' + o.task.id, ref: o.task });
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
  if (on.health) { // one item per clinic per day; open it to see which birds and what was done
    var visits = {};
    HEALTH_RECORDS_SAMPLE.forEach(function (r) {
      var d = r.date ? String(r.date).slice(0, 10) : '';
      if (!d || d < fromISO || d > toISO) return;
      var who = (r.provider || '').trim();
      var key = d + '|' + who.toLowerCase();
      (visits[key] = visits[key] || { date: d, provider: who, records: [] }).records.push(r);
    });
    Object.keys(visits).forEach(function (k) {
      var v = visits[k];
      var birds = {};
      v.records.forEach(function (r) { birds[r.birdId] = true; });
      var did = [];
      v.records.forEach(function (r) {
        var what = r.type === 'Disease Test' ? (r.disease || 'Disease') + ' test' : r.type === 'Immunization' ? 'Vaccination' : r.type;
        if (did.indexOf(what) === -1) did.push(what);
      });
      var n = Object.keys(birds).length;
      out.push({ kind: 'health', date: v.date, title: v.provider || 'Health records', sub: n + (n === 1 ? ' bird' : ' birds') + ' · ' + did.join(', '), time: '11:00',
        hash: calendarGroupHash('visit', v.date, v.provider.toLowerCase()), ref: v });
    });
  }
  if (on.awards) { // one item per show; a trophy if anything was won
    var shows = {};
    AWARDS_SAMPLE.forEach(function (a) {
      var d = a.date ? String(a.date).slice(0, 10) : '';
      if (!d || d < fromISO || d > toISO) return;
      if (on.events && showEventFor(a.event, d)) return; // already on the calendar as that Show event
      var key = d + '|' + normShow(a.event);
      (shows[key] = shows[key] || { date: d, name: a.event, awards: [] }).awards.push(a);
    });
    Object.keys(shows).forEach(function (k) {
      var g = shows[k];
      var won = g.awards.filter(isAwardWon).length;
      var birds = {};
      g.awards.forEach(function (a) { birds[a.birdId] = true; });
      var n = Object.keys(birds).length;
      out.push({ kind: 'award', date: g.date, title: g.name, trophy: won > 0, sub: n + (n === 1 ? ' bird' : ' birds') + ' entered' + (won ? ' · ' + won + (won === 1 ? ' award' : ' awards') : ''), time: '12:00',
        hash: calendarGroupHash('show', g.date, normShow(g.name)), ref: g });
    });
  }
  if (on.due) { // when each disease test comes round again — one item per disease per day
    var dues = {};
    BIRDS_SAMPLE.forEach(function (bird) {
      if (birdIsArchived(bird)) return;
      latestTests(bird.id).forEach(function (g) {
        var st = testStatus(g.latest);
        if (!st.due || st.due < fromISO || st.due > toISO) return;
        var key = st.due + '|' + g.disease;
        (dues[key] = dues[key] || { date: st.due, disease: g.disease, birds: [] }).birds.push({ bird: bird, test: g.latest });
      });
    });
    Object.keys(dues).forEach(function (k) {
      var g = dues[k];
      out.push({ kind: 'due', date: g.date, title: 'Retest due: ' + g.disease, sub: g.birds.length + (g.birds.length === 1 ? ' bird' : ' birds') + ' · ' + g.birds.slice(0, 3).map(function (x) { return x.bird.name || x.bird.band || 'bird'; }).join(', ') + (g.birds.length > 3 ? '…' : ''),
        time: '09:00', hash: calendarGroupHash('due', g.date, g.disease), ref: g });
    });
  }
  out.sort(function (a, b) { return a.date.localeCompare(b.date) || a.time.localeCompare(b.time); });
  return out;
}
