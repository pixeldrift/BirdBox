// Aviary → Tasks (and Cleaning, the same list limited to cleaning jobs): to-do lists for you and your team.
// Today shows what's due now, grouped by time of day, with a tick for each; Upcoming looks a week ahead; All lists
// every task. Tasks can repeat (every day, chosen weekdays, monthly, every N days) and be assigned to a team
// member and tied to a place or bird. A feeding task shows the care plan and, if it covers several cages, a
// checklist with each cage ticked separately. Routes: <id> · new · edit~<id>
const TasksScreen = (function () {
  var state = { view: 'today', who: '', kind: 'All', query: '' };
  var prefill = {};

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

  function who(t) {
    var u = t.assignedTo ? getUser(t.assignedTo) : null;
    return u ? userFullName(u) : '';
  }

  function dayName(iso) {
    var t = todayISO();
    if (iso === t) return 'Today';
    if (iso === addDaysISO(t, 1)) return 'Tomorrow';
    if (iso === addDaysISO(t, -1)) return 'Yesterday';
    return dateOf(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }

  // ---- one thing to do on one day ----
  function tick(done, onClick) {
    var b = btn('task-tick' + (done ? ' done' : ''), done ? '✓' : '');
    b.setAttribute('aria-label', done ? 'Done — tap to undo' : 'Mark done');
    b.addEventListener('click', function (e) { e.stopPropagation(); onClick(); });
    return b;
  }

  function planLines(plan) {
    var box = el('div', 'task-plan');
    plan.items.forEach(function (c) { box.appendChild(CareSection.line(c)); });
    return box;
  }

  function occurrence(occ, refresh, navigate) {
    var t = occ.task, iso = occ.date;
    var canTick = iso <= todayISO();
    var subs = taskSubitems(t);
    var prog = taskProgress(t, iso);
    var finished = prog.done === prog.total;
    var card = el('div', 'task-card' + (finished ? ' finished' : ''));
    var head = el('div', 'task-head');
    var open = false;
    var detail = el('div', 'task-detail');
    detail.style.display = 'none';

    var plain = !subs.length;
    if (canTick && plain) head.appendChild(tick(finished, function () { setTaskDone(t, iso, '', !finished).then(refresh); }));
    else head.appendChild(el('span', 'task-count', canTick ? prog.done + '/' + prog.total : ''));
    var text = el('button', 'task-text');
    text.type = 'button';
    text.appendChild(el('strong', '', t.title));
    text.appendChild(el('small', '', [t.kind, t.timeOfDay !== 'Anytime' ? t.timeOfDay : '', taskTargetLabel(t), who(t)].filter(Boolean).join(' · ')));
    head.appendChild(text);
    var chev = el('span', 'loc-chev', '›');
    head.appendChild(chev);
    card.appendChild(head);
    card.appendChild(detail);

    function drawDetail() {
      clearEl(detail);
      if (t.notes) detail.appendChild(el('p', 'form-note', t.notes));
      if (subs.length) {
        subs.forEach(function (s) {
          var done = !!taskDoneRow(t.id, iso, s.key);
          var row = el('div', 'task-sub');
          if (canTick) row.appendChild(tick(done, function () { setTaskDone(t, iso, s.key, !done).then(refresh); }));
          var info = el('div', 'task-sub-info');
          info.appendChild(el('strong', '', s.label));
          s.plan.items.forEach(function (c) { info.appendChild(el('small', '', careLineText(c) + (c.mealTime && c.mealTime !== 'Anytime' ? ' · ' + c.mealTime : ''))); });
          row.appendChild(info);
          detail.appendChild(row);
        });
      } else if (t.kind === 'Feeding' && t.targetType) {
        var plan = effectiveCare(t.targetType, t.targetId);
        if (plan.items.length) detail.appendChild(planLines(plan)); else detail.appendChild(el('p', 'form-note', 'No care plan to show for this yet.'));
      }
      detail.appendChild(btn('pick-link', 'Open task ›', function () { navigate(t.id); }));
    }
    text.addEventListener('click', function () {
      open = !open;
      detail.style.display = open ? 'block' : 'none';
      chev.textContent = open ? '⌄' : '›';
      if (open) drawDetail();
    });
    return card;
  }

  // ---- the list ----
  function renderList(main, navigate, fixedKind) {
    var wrap = el('div', 'list-screen');
    var actions = el('div', 'list-actions');
    actions.appendChild(btn('add-record-btn', fixedKind ? '+ Add ' + fixedKind.toLowerCase() + ' task' : '+ Add task', function () { prefill = fixedKind ? { kind: fixedKind } : {}; navigate('new'); }));
    var seg = el('div', 'loc-seg loc-modes');
    var controls = el('div', 'loc-controls');
    var body = el('div');
    [actions, seg, controls, body].forEach(function (e) { wrap.appendChild(e); });
    main.appendChild(wrap);

    function relevant(t) {
      if (fixedKind && t.kind !== fixedKind) return false;
      if (!fixedKind && state.kind !== 'All' && t.kind !== state.kind) return false;
      if (state.who && t.assignedTo !== state.who) return false;
      return true;
    }

    function draw() {
      clearEl(seg); clearEl(controls); clearEl(body);
      [['today', 'Today'], ['upcoming', 'Upcoming'], ['all', 'All tasks']].forEach(function (v) {
        seg.appendChild(btn('loc-seg-btn' + (state.view === v[0] ? ' active' : ''), v[1], function () { state.view = v[0]; draw(); }));
      });
      if (USERS_SAMPLE.length) {
        var sel = el('select', 'loc-select');
        sel.setAttribute('aria-label', 'Assigned to');
        var all = el('option', '', 'Everyone'); all.value = ''; sel.appendChild(all);
        USERS_SAMPLE.forEach(function (u) { var o = el('option', '', userFullName(u)); o.value = u.id; sel.appendChild(o); });
        sel.value = state.who;
        sel.addEventListener('change', function () { state.who = sel.value; draw(); });
        controls.appendChild(sel);
      }
      if (!fixedKind && state.view === 'all') {
        var chips = el('div', 'filter-chips');
        ['All'].concat(TASK_KINDS).forEach(function (k) { chips.appendChild(btn('filter-chip' + (state.kind === k ? ' active' : ''), k, function () { state.kind = k; draw(); })); });
        body.appendChild(chips);
      }
      if (state.view === 'today') drawToday();
      else if (state.view === 'upcoming') drawUpcoming();
      else drawAll();
    }

    function group(title) {
      var h = el('p', 'loc-level', title);
      body.appendChild(h);
      var box = el('div', 'task-list');
      body.appendChild(box);
      return box;
    }

    function drawToday() {
      var today = todayISO();
      var occs = taskOccurrences(today, today, relevant);
      // one-off tasks from the last two weeks that never got done
      var overdue = taskOccurrences(addDaysISO(today, -14), addDaysISO(today, -1), function (t) { return t.repeat === 'None' && relevant(t); })
        .filter(function (o) { return taskProgress(o.task, o.date).done < taskProgress(o.task, o.date).total; });
      var open = occs.filter(function (o) { var p = taskProgress(o.task, o.date); return p.done < p.total; }).length;
      body.appendChild(el('p', 'task-today', dayName(today) + ' · ' + (occs.length ? open + ' to do' : 'nothing due')));
      if (overdue.length) {
        var box0 = group('Overdue');
        overdue.forEach(function (o) { box0.appendChild(occurrence(o, draw, navigate)); });
      }
      TASK_TIMES.forEach(function (slot) {
        var inSlot = occs.filter(function (o) { return o.task.timeOfDay === slot; });
        if (!inSlot.length) return;
        var box = group(slot);
        inSlot.forEach(function (o) { box.appendChild(occurrence(o, draw, navigate)); });
      });
      if (!occs.length && !overdue.length) body.appendChild(el('p', 'list-empty', TASKS_SAMPLE.length ? 'Nothing due today.' : 'No tasks yet — tap “+ Add task” to set up feeding, cleaning and other jobs.'));
    }

    function drawUpcoming() {
      var today = todayISO();
      var any = false;
      for (var i = 1; i <= 7; i++) {
        var d = addDaysISO(today, i);
        var occs = taskOccurrences(d, d, relevant);
        if (!occs.length) continue;
        any = true;
        var box = group(dayName(d));
        occs.forEach(function (o) { box.appendChild(occurrence(o, draw, navigate)); });
      }
      if (!any) body.appendChild(el('p', 'list-empty', 'Nothing scheduled in the next week.'));
    }

    function drawAll() {
      var list = el('div', 'list-rows');
      var tasks = TASKS_SAMPLE.filter(relevant);
      tasks.forEach(function (t) {
        var b = el('button', 'list-row');
        b.type = 'button';
        var info = el('span', 'list-row-info');
        info.appendChild(el('span', 'list-row-title', t.title));
        info.appendChild(el('span', 'list-row-sub', [t.kind, taskScheduleText(t), taskTargetLabel(t), who(t)].filter(Boolean).join(' · ')));
        b.appendChild(info);
        b.addEventListener('click', function () { navigate(t.id); });
        list.appendChild(b);
      });
      if (!tasks.length) list.appendChild(el('p', 'list-empty', 'No tasks to show.'));
      body.appendChild(list);
    }

    draw();
  }

  // ---- add / edit ----
  function renderForm(main, id, navigate, setTitle, fixedKind) {
    var editing = id ? getTask(id) : null;
    if (id && !editing) { main.appendChild(el('p', '', 'Task not found.')); return; }
    setTitle(editing ? 'Edit task' : 'New task');
    var base = editing || Object.assign({ kind: fixedKind || 'General', timeOfDay: 'Morning', repeat: 'None', startDate: todayISO(), weekdays: '', every: 2 }, prefill);
    prefill = {};
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
    function selectOf(options, value, aria) {
      var s = el('select', 'form-input');
      s.setAttribute('aria-label', aria);
      options.forEach(function (o) { var op = el('option', '', o[1]); op.value = o[0]; s.appendChild(op); });
      s.value = value;
      return s;
    }

    var title = el('input', 'form-input');
    title.value = base.title || '';
    title.placeholder = 'e.g. Morning feeding';
    field('What needs doing', title);
    var kind = selectOf(TASK_KINDS.map(function (k) { return [k, k]; }), base.kind, 'Kind');
    field('Kind', kind);
    var date = el('input', 'form-input');
    date.type = 'date';
    date.value = String(base.startDate).slice(0, 10);
    field('Starts', date);
    var slot = selectOf(TASK_TIMES.map(function (k) { return [k, k]; }), base.timeOfDay, 'Time of day');
    field('Time of day', slot);

    var repeat = selectOf([['None', 'Doesn’t repeat'], ['Daily', 'Every day'], ['Weekly', 'Certain days of the week'], ['Monthly', 'Every month'], ['Custom', 'Every few days']], base.repeat, 'Repeats');
    field('Repeats', repeat);
    var days = base.weekdays ? String(base.weekdays).split(',').filter(Boolean).map(Number) : [];
    var weekRow = el('div', 'gen-toggles task-weekdays');
    function drawWeek() {
      clearEl(weekRow);
      [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
        var on = days.indexOf(d) !== -1;
        weekRow.appendChild(btn('gen-toggle' + (on ? ' on' : ''), WEEKDAY_NAMES[d], function () { var i = days.indexOf(d); if (i === -1) days.push(d); else days.splice(i, 1); drawWeek(); }));
      });
    }
    drawWeek();
    var weekField = field('On', weekRow);
    var every = el('input', 'form-input');
    every.type = 'number';
    every.min = '1';
    every.value = base.every || 2;
    var everyField = field('Every how many days', every);
    var until = el('input', 'form-input');
    until.type = 'date';
    until.value = base.endDate ? String(base.endDate).slice(0, 10) : '';
    var untilField = field('Repeat until', until, 'Optional — leave empty to keep going.');
    function syncRepeat() {
      weekField.style.display = repeat.value === 'Weekly' ? '' : 'none';
      everyField.style.display = repeat.value === 'Custom' ? '' : 'none';
      untilField.style.display = repeat.value === 'None' ? 'none' : '';
    }
    repeat.addEventListener('change', syncRepeat);
    syncRepeat();

    var assignee = Picker.users({ value: base.assignedTo || '', allowClear: true, placeholder: USERS_SAMPLE.length ? 'Anyone — or pick a team member…' : 'Add team members under Account → My Team' });
    field('Assigned to', assignee.el);

    // Related to: the whole aviary, a place, or a bird.
    var relOptions = [['', 'Nothing in particular'], ['aviary', 'The whole aviary'], ['location', 'A location'], ['building', 'A building'], ['room', 'A room'], ['cage', 'A cage'], ['bird', 'A bird']];
    var rel = selectOf(relOptions, base.targetType || '', 'Related to');
    field('For', rel);
    var relBox = el('div');
    form.appendChild(relBox);
    var relPicker = null, relValue = base.targetId || '';
    function drawRel() {
      clearEl(relBox);
      relPicker = null;
      var type = rel.value;
      if (!type || type === 'aviary') return;
      var make = { location: Picker.locations, building: Picker.buildings, room: Picker.rooms, cage: Picker.cages, bird: Picker.birds }[type];
      relPicker = make({ value: type === (base.targetType || '') ? relValue : '', allowClear: false });
      relBox.appendChild(relPicker.el);
    }
    rel.addEventListener('change', function () { relValue = ''; base = Object.assign({}, base, { targetType: rel.value }); drawRel(); });
    drawRel();

    var notes = el('textarea', 'form-input');
    notes.rows = 3;
    notes.value = base.notes || '';
    field('Notes', notes);

    var message = el('div');
    var save = btn('save-btn', editing ? 'Save Changes' : 'Add Task');
    save.type = 'submit';
    form.appendChild(message);
    form.appendChild(save);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearEl(message);
      var type = rel.value;
      var targetId = type === 'aviary' ? 'main' : relPicker ? relPicker.get() : '';
      if (type && type !== 'aviary' && !targetId) { message.appendChild(el('p', 'form-message error', 'Choose which ' + type + ' this is for.')); return; }
      if (repeat.value === 'Weekly' && !days.length) { message.appendChild(el('p', 'form-message error', 'Pick at least one day of the week.')); return; }
      var data = {
        title: title.value.trim(), kind: kind.value, notes: notes.value.trim(), startDate: date.value, timeOfDay: slot.value, repeat: repeat.value,
        every: repeat.value === 'Custom' ? Number(every.value) || 1 : null, weekdays: repeat.value === 'Weekly' ? days.slice().sort().join(',') : '',
        endDate: repeat.value !== 'None' && until.value ? until.value : '', assignedTo: assignee.get() || '', targetType: type, targetId: type ? targetId : '',
      };
      save.disabled = true;
      (editing ? updateRecord('tasks', editing.id, data) : createRecord('tasks', data)).then(function (rec) { navigate(rec.id || editing.id); }).catch(function (err) {
        save.disabled = false;
        message.appendChild(el('p', 'form-message error', err.message));
      });
    });

    if (editing) {
      var danger = el('div', 'detail-section');
      var del = btn('add-record-btn danger-btn', 'Delete this task');
      del.addEventListener('click', function () {
        Modal.confirm({
          title: 'Delete task?', message: 'Delete “' + editing.title + '” and its history? This can’t be undone.', confirmLabel: 'Delete', danger: true,
          onConfirm: function () { deleteRecord('tasks', editing.id).then(function () { location.hash = '#/aviary/' + (fixedKind === 'Cleaning' ? 'cleaning' : 'tasks'); }).catch(function (err) { clearEl(message); message.appendChild(el('p', 'form-message error', err.message)); }); },
        });
      });
      danger.appendChild(del);
      wrap.appendChild(danger);
    }
  }

  // ---- one task ----
  function renderTask(main, id, navigate, setTitle, fixedKind) {
    var t = getTask(id);
    if (!t) { main.appendChild(el('p', '', 'Task not found.')); return; }
    setTitle(t.title);
    var again = function () { clearEl(main); renderTask(main, id, navigate, setTitle, fixedKind); };
    var wrap = el('div', 'detail-screen');
    var header = el('div', 'detail-header');
    var tt = el('div', 'detail-title');
    tt.appendChild(el('h2', '', t.title));
    tt.appendChild(el('span', 'type-badge type-breeder', t.kind));
    header.appendChild(tt);
    header.appendChild(makeEditButton(function () { navigate('edit~' + t.id); }));
    wrap.appendChild(header);

    var facts = el('div', 'fact-grid');
    facts.appendChild(factRow('Schedule', taskScheduleText(t)));
    if (t.endDate) facts.appendChild(factRow('Until', formatDate(t.endDate)));
    facts.appendChild(factRow('Assigned to', who(t) || 'Anyone'));
    wrap.appendChild(facts);

    if (t.targetType) {
      var tgt = el('div', 'detail-section');
      tgt.appendChild(el('h3', '', 'For'));
      tgt.appendChild(btn('pick-link', taskTargetLabel(t) + ' ›', function () { location.hash = careTargetHash(t.targetType, t.targetId); }));
      wrap.appendChild(tgt);
    }
    if (t.notes) { var n = el('div', 'detail-section'); n.appendChild(el('h3', '', 'Notes')); n.appendChild(el('p', 'notes-text', t.notes)); wrap.appendChild(n); }

    // a feeding task shows what it covers
    var subs = taskSubitems(t);
    if (subs.length || (t.kind === 'Feeding' && t.targetType)) {
      var care = el('div', 'detail-section');
      care.appendChild(el('h3', '', 'Feeding plan'));
      if (subs.length) subs.forEach(function (s) { var row = el('div', 'task-sub'); var info = el('div', 'task-sub-info'); info.appendChild(el('strong', '', s.label)); s.plan.items.forEach(function (c) { info.appendChild(el('small', '', careLineText(c))); }); row.appendChild(info); care.appendChild(row); });
      else { var plan = effectiveCare(t.targetType, t.targetId); if (plan.items.length) care.appendChild(planLines(plan)); else care.appendChild(el('p', 'form-note', 'No care plan yet.')); }
      wrap.appendChild(care);
    }

    var hist = el('div', 'detail-section');
    var done = TASK_DONE_SAMPLE.filter(function (d) { return d.taskId === t.id; }).sort(function (a, b) { return String(b.onDate).localeCompare(String(a.onDate)); });
    hist.appendChild(el('h3', '', 'Recently done (' + done.length + ')'));
    if (!done.length) hist.appendChild(el('p', 'form-note', 'Not done yet.'));
    done.slice(0, 10).forEach(function (d) { var u = d.doneBy ? getUser(d.doneBy) : null; hist.appendChild(el('p', 'task-history', formatDate(d.onDate) + (d.subKey ? ' · Cage ' + d.subKey : '') + (u ? ' · ' + userFullName(u) : ''))); });
    wrap.appendChild(hist);
    main.appendChild(wrap);
  }

  function screen(fixedKind) {
    return {
      renderList: function (main, navigate) { renderList(main, navigate, fixedKind); },
      renderDetail: function (main, id, navigate, setTitle) {
        clearEl(main);
        if (id === 'new') return renderForm(main, null, navigate, setTitle, fixedKind);
        if (id.indexOf('edit~') === 0) return renderForm(main, id.slice(5), navigate, setTitle, fixedKind);
        return renderTask(main, id, navigate, setTitle, fixedKind);
      },
    };
  }

  return { tasks: screen(null), cleaning: screen('Cleaning'), setPrefill: function (p) { prefill = p || {}; } };
})();
