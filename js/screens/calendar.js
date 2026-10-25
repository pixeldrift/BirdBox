// Aviary → Calendar: one calendar for everything with a date — your events (client appointments, meetups, aviary
// tours, calls), task occurrences, scheduled shipments and health visits. Month, week and day views; tap a day to
// see its agenda. Events link to the records they're about (birds, shipments, contacts, cages); a shipment expands
// to show its client and birds. Routes: <eventId> · new · edit~<eventId>
const CalendarScreen = (function () {
  var state = { view: 'month', day: todayISO(), layers: { events: true, tasks: true, shipments: true, health: true }, prefillDate: '' };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var LAYER_LABELS = { events: 'Events', tasks: 'Tasks', shipments: 'Shipments', health: 'Health' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function btn(cls, text, onClick) {
    var b = el('button', cls, text);
    b.type = 'button';
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  function monthStart(iso) { return iso.slice(0, 8) + '01'; }
  function weekStart(iso) { return addDaysISO(iso, -dateOf(iso).getDay()); }
  function monthLabel(iso) { var d = dateOf(iso); return MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function dayLabel(iso) { return dateOf(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }); }
  function shiftMonth(iso, n) { var d = dateOf(monthStart(iso)); d.setMonth(d.getMonth() + n); return isoOf(d); }

  // ---- an item on a day ----
  function agendaItem(it, navigate, redraw) {
    var card = el('div', 'cal-item cal-' + it.kind + (it.done ? ' done' : ''));
    var head = el('button', 'cal-item-head');
    head.type = 'button';
    head.appendChild(el('span', 'cal-bar'));
    var text = el('span', 'cal-item-text');
    text.appendChild(el('strong', '', it.title));
    if (it.sub) text.appendChild(el('small', '', it.sub));
    head.appendChild(text);
    var detail = el('div', 'cal-detail');
    detail.style.display = 'none';
    var expandable = it.kind === 'shipment';
    var chev = el('span', 'loc-chev', expandable ? '›' : '›');
    head.appendChild(chev);
    card.appendChild(head);
    card.appendChild(detail);
    var open = false;
    head.addEventListener('click', function () {
      if (!expandable) { location.hash = it.hash; return; }
      open = !open;
      detail.style.display = open ? 'block' : 'none';
      chev.textContent = open ? '⌄' : '›';
      if (open) drawShipment(detail, it.ref);
    });
    return card;
  }

  // A shipment on the calendar: where it's going, who it's for, which birds — each tappable.
  function drawShipment(box, w) {
    clearEl(box);
    var route = [w.departingAirport, w.arrivingAirport].filter(Boolean).join(' → ');
    var facts = [w.method, w.carrier, route, w.waybillNumber ? 'Waybill ' + w.waybillNumber : ''].filter(Boolean).join(' · ');
    if (facts) box.appendChild(el('p', 'form-note', facts));
    var client = w.clientId ? getContact(w.clientId) : null;
    if (client) box.appendChild(contactChip(client, function () { location.hash = '#/business/contacts/' + client.id; }, 'Client'));
    (w.birdIds || []).map(getBird).filter(Boolean).slice(0, 8).forEach(function (b) { box.appendChild(birdChip(b, function () { location.hash = '#/mybirds/birds/' + b.id; })); });
    box.appendChild(btn('pick-link', 'Open shipment ›', function () { location.hash = '#/business/shipping/' + w.id; }));
  }

  function agenda(iso, navigate, redraw, title) {
    var box = el('div', 'cal-agenda');
    if (title !== false) box.appendChild(el('p', 'loc-level', title || dayLabel(iso)));
    var items = calendarItems(iso, iso, state.layers);
    items.forEach(function (it) { box.appendChild(agendaItem(it, navigate, redraw)); });
    if (!items.length) box.appendChild(el('p', 'form-note', 'Nothing on this day.'));
    return box;
  }

  // ---- the screen ----
  function renderList(main, navigate) {
    var wrap = el('div', 'list-screen cal-screen');
    main.appendChild(wrap);

    function add() {
      var d = state.day;
      Modal.open({
        title: 'Add to ' + dateOf(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        build: function (body, close) {
          body.appendChild(btn('btn-positive loc-add-row', '+ Add Event — appointment, meetup, tour…', function () { close(); state.prefillDate = d; navigate('new'); }));
          body.appendChild(btn('btn-positive loc-add-row', '+ Add Task — feeding, cleaning…', function () { close(); TasksScreen.setPrefill({ startDate: d }); location.hash = '#/aviary/tasks/new'; }));
        },
      });
    }

    function draw() {
      clearEl(wrap);
      var bar = el('div', 'cal-bar-top');
      var step = state.view === 'month' ? function (n) { state.day = shiftMonth(state.day, n); } : state.view === 'week' ? function (n) { state.day = addDaysISO(state.day, 7 * n); } : function (n) { state.day = addDaysISO(state.day, n); };
      bar.appendChild(btn('cal-nav', '‹', function () { step(-1); draw(); }));
      bar.appendChild(btn('cal-title', state.view === 'month' ? monthLabel(state.day) : state.view === 'week' ? 'Week of ' + dateOf(weekStart(state.day)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : dayLabel(state.day), function () { state.day = todayISO(); draw(); }));
      bar.appendChild(btn('cal-nav', '›', function () { step(1); draw(); }));
      wrap.appendChild(bar);

      var row = el('div', 'cal-controls');
      var seg = el('div', 'loc-seg');
      [['month', 'Month'], ['week', 'Week'], ['day', 'Day']].forEach(function (v) { seg.appendChild(btn('loc-seg-btn' + (state.view === v[0] ? ' active' : ''), v[1], function () { state.view = v[0]; draw(); })); });
      row.appendChild(seg);
      row.appendChild(btn('loc-add', '+ Add Event or Task', add));
      wrap.appendChild(row);

      var layers = el('div', 'gen-toggles cal-layers');
      Object.keys(LAYER_LABELS).forEach(function (k) {
        layers.appendChild(btn('gen-toggle cal-layer-' + k + (state.layers[k] ? ' on' : ''), (state.layers[k] ? '✓ ' : '') + LAYER_LABELS[k], function () { state.layers[k] = !state.layers[k]; draw(); }));
      });
      wrap.appendChild(layers);

      if (state.view === 'month') drawMonth();
      else if (state.view === 'week') drawWeek();
      else wrap.appendChild(agenda(state.day, navigate, draw, false));
    }

    function drawMonth() {
      var first = monthStart(state.day);
      var gridStart = weekStart(first);
      var last = addDaysISO(first, daysInMonthOf(first) - 1);
      var gridEnd = addDaysISO(weekStart(last), 6);
      var items = calendarItems(gridStart, gridEnd, state.layers);
      var byDay = {};
      items.forEach(function (it) { (byDay[it.date] = byDay[it.date] || []).push(it); });
      var grid = el('div', 'cal-month');
      ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(function (d) { grid.appendChild(el('span', 'cal-dow', d)); });
      for (var d = gridStart; d <= gridEnd; d = addDaysISO(d, 1)) {
        (function (day) {
          var inMonth = day.slice(0, 7) === first.slice(0, 7);
          var cell = el('button', 'cal-cell' + (inMonth ? '' : ' out') + (day === todayISO() ? ' today' : '') + (day === state.day ? ' selected' : ''));
          cell.type = 'button';
          cell.appendChild(el('span', 'cal-num', String(dateOf(day).getDate())));
          var dots = el('span', 'cal-dots');
          var seen = {};
          (byDay[day] || []).forEach(function (it) { if (!seen[it.kind]) { seen[it.kind] = true; dots.appendChild(el('i', 'cal-dot cal-dot-' + it.kind)); } });
          cell.appendChild(dots);
          cell.addEventListener('click', function () { state.day = day; draw(); });
          grid.appendChild(cell);
        })(d);
      }
      wrap.appendChild(grid);
      wrap.appendChild(agenda(state.day, navigate, draw));
    }

    function drawWeek() {
      var start = weekStart(state.day);
      for (var i = 0; i < 7; i++) {
        var d = addDaysISO(start, i);
        var head = btn('cal-weekday' + (d === todayISO() ? ' today' : ''), dateOf(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }), (function (day) { return function () { state.day = day; state.view = 'day'; draw(); }; })(d));
        wrap.appendChild(head);
        wrap.appendChild(agenda(d, navigate, draw, false));
      }
    }

    draw();
  }

  // ---- event form ----
  function renderForm(main, id, navigate, setTitle) {
    var editing = id ? getEvent(id) : null;
    if (id && !editing) { main.appendChild(el('p', '', 'Event not found.')); return; }
    setTitle(editing ? 'Edit event' : 'New event');
    var base = editing || { kind: 'Appointment', startDate: state.prefillDate || state.day, allDay: false, startTime: '10:00', endTime: '11:00' };
    state.prefillDate = '';
    var wrap = el('div', 'detail-screen');
    var form = el('form', 'detail-section record-form');
    wrap.appendChild(form);
    main.appendChild(wrap);

    function field(label, control, hint) {
      var f = el('div', 'form-field');
      f.appendChild(el('span', 'form-label', label));
      f.appendChild(control);
      if (hint) f.appendChild(el('span', 'form-hint', hint));
      form.appendChild(f);
      return f;
    }
    var title = el('input', 'form-input');
    title.value = base.title || '';
    title.placeholder = 'e.g. Visit with the Hutchinsons';
    field('What', title);
    var kind = el('select', 'form-input');
    kind.setAttribute('aria-label', 'Kind');
    EVENT_KINDS.forEach(function (k) { var o = el('option', '', k); o.value = k; kind.appendChild(o); });
    kind.value = base.kind;
    field('Kind', kind);
    var date = el('input', 'form-input');
    date.type = 'date';
    date.value = String(base.startDate).slice(0, 10);
    field('Date', date);
    var allDay = !!base.allDay;
    var allDayBtn = btn('gen-toggle' + (allDay ? ' on' : ''), (allDay ? '✓ ' : '') + 'All day', function () { allDay = !allDay; allDayBtn.className = 'gen-toggle' + (allDay ? ' on' : ''); allDayBtn.textContent = (allDay ? '✓ ' : '') + 'All day'; syncTimes(); });
    var allDayRow = el('div', 'gen-toggles');
    allDayRow.appendChild(allDayBtn);
    form.appendChild(allDayRow);
    var start = el('input', 'form-input'); start.type = 'time'; start.value = base.startTime || '';
    var end = el('input', 'form-input'); end.type = 'time'; end.value = base.endTime || '';
    var startField = field('Starts at', start);
    var endField = field('Ends at', end);
    var endDate = el('input', 'form-input'); endDate.type = 'date'; endDate.placeholder = 'None'; endDate.value = base.endDate ? String(base.endDate).slice(0, 10) : '';
    field('Last day', endDate, 'Only for something that runs over several days.');
    function syncTimes() { startField.style.display = endField.style.display = allDay ? 'none' : ''; }
    syncTimes();
    var place = el('input', 'form-input');
    place.value = base.place || '';
    place.placeholder = 'Where — optional';
    field('Where', place);
    var client = Picker.contacts({ value: base.contactId || '', allowClear: true, placeholder: 'Client or contact — optional' });
    field('Who with', client.el);
    var assignee = Picker.users({ value: base.assignedTo || '', allowClear: true, placeholder: 'Team member — optional' });
    field('Handled by', assignee.el);
    var notes = el('textarea', 'form-input'); notes.rows = 3; notes.value = base.notes || '';
    field('Notes', notes);
    var message = el('div');
    var save = btn('save-btn', editing ? 'Save Changes' : 'Add Event');
    save.type = 'submit';
    form.appendChild(message);
    form.appendChild(save);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearEl(message);
      var data = { title: title.value.trim(), kind: kind.value, notes: notes.value.trim(), place: place.value.trim(), startDate: date.value, endDate: endDate.value || '', allDay: allDay,
        startTime: allDay ? '' : start.value, endTime: allDay ? '' : end.value, contactId: client.get() || '', assignedTo: assignee.get() || '' };
      if (!allDay && data.startTime && data.endTime && data.endTime < data.startTime) { message.appendChild(el('p', 'form-message error', 'It can’t end before it starts.')); return; }
      save.disabled = true;
      (editing ? updateRecord('events', editing.id, data) : createRecord('events', data)).then(function (rec) { state.day = data.startDate; navigate(rec.id || editing.id); }).catch(function (err) {
        save.disabled = false;
        message.appendChild(el('p', 'form-message error', err.message));
      });
    });
    if (editing) {
      var danger = el('div', 'detail-section');
      var del = btn('add-record-btn danger-btn', 'Delete this event');
      del.addEventListener('click', function () {
        Modal.confirm({
          title: 'Delete event?', message: 'Delete “' + editing.title + '”? The birds, shipments and contacts linked to it aren’t affected.', confirmLabel: 'Delete', danger: true,
          onConfirm: function () { deleteRecord('events', editing.id).then(function () { location.hash = '#/aviary/calendar'; }).catch(function (err) { clearEl(message); message.appendChild(el('p', 'form-message error', err.message)); }); },
        });
      });
      danger.appendChild(del);
      wrap.appendChild(danger);
    }
  }

  // ---- one event ----
  var LINK_KINDS = [['bird', 'Bird', 'birds'], ['contact', 'Contact', 'contacts'], ['waybill', 'Shipment', 'waybills'], ['cage', 'Cage', 'cages']];

  function linkPopup(e, done) {
    var kind = 'bird';
    Modal.open({
      title: 'Link a record',
      build: function (body, close) {
        var seg = el('div', 'loc-seg loc-modes');
        var pick = el('div');
        body.appendChild(seg);
        body.appendChild(pick);
        function drawPick() {
          clearEl(seg); clearEl(pick);
          LINK_KINDS.forEach(function (k) { seg.appendChild(btn('loc-seg-btn' + (kind === k[0] ? ' active' : ''), k[1], function () { kind = k[0]; drawPick(); })); });
          var listKind = LINK_KINDS.filter(function (k) { return k[0] === kind; })[0][2];
          pick.appendChild(Picker.create({
            items: function () { return Picker.listItems(listKind, function (r) { return !eventLinks(e.id).some(function (l) { return l.targetType === kind && l.targetId === (r.id || r.code); }); }); },
            placeholder: 'Search…',
            onChange: function (id) { if (!id) return; createRecord('eventlinks', { eventId: e.id, targetType: kind, targetId: id }).then(function () { close(); done(); }).catch(function () {}); },
          }).el);
        }
        drawPick();
      },
    });
  }

  function renderEvent(main, id, navigate, setTitle) {
    var e = getEvent(id);
    if (!e) { main.appendChild(el('p', '', 'Event not found.')); return; }
    setTitle(e.title);
    var again = function () { clearEl(main); renderEvent(main, id, navigate, setTitle); };
    var wrap = el('div', 'detail-screen');
    var header = el('div', 'detail-header');
    var tt = el('div', 'detail-title');
    tt.appendChild(el('h2', '', e.title));
    tt.appendChild(el('span', 'type-badge type-breeder', e.kind));
    header.appendChild(tt);
    header.appendChild(makeEditButton(function () { navigate('edit~' + e.id); }));
    wrap.appendChild(header);

    var facts = el('div', 'fact-grid');
    facts.appendChild(factRow('When', formatDate(e.startDate) + (e.endDate && e.endDate !== e.startDate ? ' – ' + formatDate(e.endDate) : '') + (eventTimeText(e) ? ' · ' + eventTimeText(e) : '')));
    if (e.place) facts.appendChild(factRow('Where', e.place));
    var u = e.assignedTo ? getUser(e.assignedTo) : null;
    if (u) facts.appendChild(factRow('Handled by', userFullName(u)));
    wrap.appendChild(facts);

    var client = e.contactId ? getContact(e.contactId) : null;
    if (client) { var cs = el('div', 'detail-section'); cs.appendChild(el('h3', '', 'Who with')); cs.appendChild(contactChip(client, function () { location.hash = '#/business/contacts/' + client.id; })); wrap.appendChild(cs); }
    if (e.notes) { var n = el('div', 'detail-section'); n.appendChild(el('h3', '', 'Notes')); n.appendChild(el('p', 'notes-text', e.notes)); wrap.appendChild(n); }

    var links = eventLinkTargets(e.id);
    var sec = el('div', 'detail-section');
    sec.appendChild(el('h3', '', 'Linked records (' + links.length + ')'));
    if (!links.length) sec.appendChild(el('p', 'form-note', 'Link the birds, shipment or contacts this is about, so they’re one tap away.'));
    links.forEach(function (t) {
      var row = el('div', 'relation-row');
      var holder = el('div', 'relation-body');
      var b = el('button', 'list-row');
      b.type = 'button';
      var info = el('span', 'list-row-info');
      info.appendChild(el('span', 'list-row-title', t.label));
      info.appendChild(el('span', 'list-row-sub', { bird: 'Bird', contact: 'Contact', waybill: 'Shipment', cage: 'Cage', task: 'Task' }[t.type]));
      b.appendChild(info);
      b.addEventListener('click', function () { location.hash = t.hash; });
      holder.appendChild(b);
      row.appendChild(holder);
      row.appendChild(btn('pick-link relation-remove', 'Remove', function () {
        Modal.confirm({ title: 'Remove link?', message: 'Remove “' + t.label + '” from this event? It isn’t deleted.', confirmLabel: 'Remove', onConfirm: function () { deleteRecord('eventlinks', t.link.id).then(again).catch(function () {}); } });
      }));
      sec.appendChild(row);
    });
    sec.appendChild(btn('btn-positive care-add', '+ Link a Record', function () { linkPopup(e, again); }));
    wrap.appendChild(sec);
    main.appendChild(wrap);
  }

  function renderDetail(main, id, navigate, setTitle) {
    clearEl(main);
    if (id === 'new') return renderForm(main, null, navigate, setTitle);
    if (id.indexOf('edit~') === 0) return renderForm(main, id.slice(5), navigate, setTitle);
    return renderEvent(main, id, navigate, setTitle);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();
