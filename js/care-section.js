// The "Care & feeding" and "Cleaning" boxes on a bird's or place's page. Feeding: what it's fed and given, how much and
// when, each food linked to its Supplies page. Cleaning: recurring jobs — what to do, how often, who does it and which
// supplies it uses (so a low disinfectant shows up). A target with no plan of its own follows the nearest one above it.
//   CareSection.render({ targetType, targetId, name, refresh, plan: 'feeding' | 'cleaning' }) -> element
const CareSection = (function () {
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

  // One line of a plan: the food (tap for its page), the amount, and the time of day.
  function line(c, extra) {
    if (c.plan === 'cleaning') return cleaningLine(c, extra);
    var row = el('div', 'care-line');
    var sup = c.supplyId ? getSupply(c.supplyId) : null;
    var lead = el(sup ? 'button' : 'span', 'care-food');
    if (sup) { lead.type = 'button'; lead.addEventListener('click', function () { location.hash = '#/aviary/supplies/' + sup.id; }); }
    var url = sup ? supplyThumbUrl(sup) : '';
    var thumb = makeThumb(url ? { src: url } : { icon: 'icons/tinted/aviary/FeedWater.png' });
    thumb.classList.add('care-thumb');
    lead.appendChild(thumb);
    var text = el('span', 'care-text');
    text.appendChild(el('strong', '', sup ? sup.name : c.label || 'Care'));
    text.appendChild(el('small', '', [c.amount, c.mealTime].filter(Boolean).join(' · ') + (sup && supplyIsLow(sup) ? ' · running low' : '')));
    if (c.notes) text.appendChild(el('small', 'care-notes', c.notes));
    lead.appendChild(text);
    row.appendChild(lead);
    if (extra) row.appendChild(extra);
    return row;
  }

  // One cleaning job: what to do, when and who, and the supplies it needs (flagged when they're running low).
  function cleaningLine(c, extra) {
    var row = el('div', 'care-line cleaning-line');
    var lead = el('span', 'care-food');
    var thumb = makeThumb({ icon: 'icons/tinted/aviary/Cleaning.png' });
    thumb.classList.add('care-thumb');
    lead.appendChild(thumb);
    var job = cleaningJobTask(c);
    var who = c.assignedTo ? getUser(c.assignedTo) : null;
    var text = el('span', 'care-text');
    text.appendChild(el('strong', '', job.title));
    text.appendChild(el('small', '', [taskScheduleText(job), who ? userFullName(who) : ''].filter(Boolean).join(' · ')));
    var sups = careSupplies(c);
    if (sups.length || c.amount) {
      var need = el('small', 'care-needs');
      need.appendChild(document.createTextNode('Uses '));
      sups.forEach(function (s, i) {
        if (i) need.appendChild(document.createTextNode(', '));
        var a = el('a', 'ext-link' + (supplyIsLow(s) ? ' low' : ''), s.name + (supplyIsLow(s) ? ' (running low)' : ''));
        a.href = '#/aviary/supplies/' + s.id;
        need.appendChild(a);
      });
      if (c.amount) need.appendChild(document.createTextNode((sups.length ? ' — ' : '') + c.amount));
      text.appendChild(need);
    }
    if (c.notes) text.appendChild(el('small', 'care-notes', c.notes));
    lead.appendChild(text);
    row.appendChild(lead);
    if (extra) row.appendChild(extra);
    return row;
  }

  function cleaningEditor(o, existing, done) {
    Modal.open({
      title: existing ? 'Edit cleaning job' : 'Add cleaning job',
      build: function (body, close) {
        var message = el('div');
        function field(label, control, hint) {
          var f = el('div', 'form-field');
          f.appendChild(el('span', 'form-label', label));
          f.appendChild(control);
          if (hint) f.appendChild(el('p', 'form-note', hint));
          body.appendChild(f);
          return f;
        }
        var job = el('input', 'form-input');
        job.placeholder = 'e.g. Scrub perches, Change the paper';
        job.value = existing ? existing.label || '' : '';
        field('What needs doing', job);

        var supplyIds = existing ? careSupplyIds(existing) : [];
        var supplyBox = el('div');
        function drawSupplies() {
          clearEl(supplyBox);
          var chosen = el('div', 'pick-selected');
          supplyIds.forEach(function (id) {
            var s = getSupply(id);
            chosen.appendChild(btn('loc-chip', (s ? s.name : id) + '  ✕', function () { supplyIds = supplyIds.filter(function (x) { return x !== id; }); drawSupplies(); }));
          });
          if (supplyIds.length) supplyBox.appendChild(chosen);
          supplyBox.appendChild(Picker.create({
            value: '', placeholder: SUPPLIES_SAMPLE.length ? 'Add a supply — e.g. disinfectant, gloves…' : 'No supplies yet — add them under Supplies',
            items: function () { return Picker.listItems('supplies').filter(function (i) { return supplyIds.indexOf(i.id) === -1; }); },
            onChange: function (id) { if (id && supplyIds.indexOf(id) === -1) supplyIds.push(id); drawSupplies(); },
          }).el);
        }
        drawSupplies();
        field('Supplies it uses', supplyBox, 'So you can see when you’re running low.');

        var amount = el('input', 'form-input');
        amount.placeholder = 'e.g. 1 capful per gallon, 1 bag';
        amount.value = existing ? existing.amount || '' : '';
        field('How much', amount);

        var repeat = el('select', 'form-input');
        repeat.setAttribute('aria-label', 'How often');
        [['Daily', 'Every day'], ['Weekly', 'Certain days of the week'], ['Monthly', 'Every month'], ['Custom', 'Every few days']].forEach(function (r) { var op = el('option', '', r[1]); op.value = r[0]; repeat.appendChild(op); });
        repeat.value = existing && existing.repeat ? existing.repeat : 'Weekly';
        field('How often', repeat);

        var days = existing && existing.weekdays ? String(existing.weekdays).split(',').filter(Boolean).map(Number) : [];
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
        every.value = existing && existing.every ? existing.every : 3;
        var everyField = field('Every how many days', every);
        function syncRepeat() {
          weekField.style.display = repeat.value === 'Weekly' ? '' : 'none';
          everyField.style.display = repeat.value === 'Custom' ? '' : 'none';
        }
        repeat.addEventListener('change', syncRepeat);
        syncRepeat();

        var when = el('select', 'form-input');
        when.setAttribute('aria-label', 'Time of day');
        MEAL_TIMES.forEach(function (m) { var op = el('option', '', m); op.value = m; when.appendChild(op); });
        when.value = existing ? existing.mealTime : 'Morning';
        field('Time of day', when);

        var start = el('input', 'form-input');
        start.type = 'date';
        start.value = existing && existing.startDate ? String(existing.startDate).slice(0, 10) : todayISO();
        field('Starting', start, 'The first day it comes up — the schedule counts from here.');

        var assignee = Picker.users({ value: existing ? existing.assignedTo || '' : '', allowClear: true, placeholder: USERS_SAMPLE.length ? 'Anyone — or pick a team member…' : 'Add team members under Account → My Team' });
        field('Assigned to', assignee.el);

        var notes = el('input', 'form-input');
        notes.placeholder = 'Optional';
        notes.value = existing ? existing.notes || '' : '';
        field('Notes', notes);

        var save = btn('save-btn', existing ? 'Save' : 'Add Job');
        body.appendChild(message);
        body.appendChild(save);
        save.addEventListener('click', function () {
          clearEl(message);
          if (!job.value.trim() && !supplyIds.length) { message.appendChild(el('p', 'form-message error', 'Say what needs doing.')); return; }
          save.disabled = true;
          var data = {
            plan: 'cleaning', targetType: o.targetType, targetId: o.targetId, label: job.value.trim(), supplyId: '', supplyIds: supplyIds.join(','),
            amount: amount.value.trim(), repeat: repeat.value, weekdays: repeat.value === 'Weekly' ? days.join(',') : '', every: repeat.value === 'Custom' ? Number(every.value) || 1 : '',
            mealTime: when.value, startDate: start.value || todayISO(), assignedTo: assignee.get() || '', notes: notes.value.trim(),
          };
          (existing ? updateRecord('care', existing.id, data) : createRecord('care', data)).then(function () { close(); done(); }).catch(function (err) {
            save.disabled = false;
            message.appendChild(el('p', 'form-message error', err.message));
          });
        });
      },
    });
  }

  function editor(o, existing, done) {
    if (o.plan === 'cleaning') return cleaningEditor(o, existing, done);
    Modal.open({
      title: existing ? 'Edit' : 'Add food or care',
      build: function (body, close) {
        var supplyId = existing ? existing.supplyId || '' : '';
        var message = el('div');
        var f1 = el('div', 'form-field');
        f1.appendChild(el('span', 'form-label', 'Food or supply'));
        var picker = Picker.create({
          value: supplyId, allowClear: true, placeholder: SUPPLIES_SAMPLE.length ? 'Search your supplies…' : 'No supplies yet — type a name below instead',
          items: function () { return Picker.listItems('supplies'); }, onChange: function (id) { supplyId = id; },
        });
        f1.appendChild(picker.el);
        var f2 = el('label', 'form-field');
        f2.appendChild(el('span', 'form-label', 'Or just a name'));
        var label = el('input', 'form-input');
        label.placeholder = 'e.g. Fresh water, Chop';
        label.value = existing ? existing.label || '' : '';
        f2.appendChild(label);
        var f3 = el('label', 'form-field');
        f3.appendChild(el('span', 'form-label', 'How much'));
        var amount = el('input', 'form-input');
        amount.placeholder = 'e.g. ¼ cup, 2 tbsp, 1 scoop';
        amount.value = existing ? existing.amount || '' : '';
        f3.appendChild(amount);
        var f4 = el('label', 'form-field');
        f4.appendChild(el('span', 'form-label', 'When'));
        var when = el('select', 'form-input');
        when.setAttribute('aria-label', 'When');
        MEAL_TIMES.forEach(function (m) { var op = el('option', '', m); op.value = m; when.appendChild(op); });
        when.value = existing ? existing.mealTime : 'Morning';
        f4.appendChild(when);
        var f5 = el('label', 'form-field');
        f5.appendChild(el('span', 'form-label', 'Notes'));
        var notes = el('input', 'form-input');
        notes.placeholder = 'Optional — e.g. soak overnight';
        notes.value = existing ? existing.notes || '' : '';
        f5.appendChild(notes);
        var save = btn('save-btn', existing ? 'Save' : 'Add');
        [f1, f2, f3, f4, f5, message, save].forEach(function (e) { body.appendChild(e); });
        save.addEventListener('click', function () {
          clearEl(message);
          if (!supplyId && !label.value.trim()) { message.appendChild(el('p', 'form-message error', 'Choose a supply or type a name.')); return; }
          save.disabled = true;
          var data = { plan: 'feeding', targetType: o.targetType, targetId: o.targetId, supplyId: supplyId || '', label: supplyId ? '' : label.value.trim(), amount: amount.value.trim(), mealTime: when.value, notes: notes.value.trim() };
          (existing ? updateRecord('care', existing.id, data) : createRecord('care', data)).then(function () { close(); done(); }).catch(function (err) {
            save.disabled = false;
            message.appendChild(el('p', 'form-message error', err.message));
          });
        });
      },
    });
  }

  function render(o) {
    var cleaning = o.plan === 'cleaning';
    var section = el('div', 'detail-section');
    section.appendChild(el('h3', '', cleaning ? 'Cleaning' : 'Care & feeding'));
    var eff = effectiveCare(o.targetType, o.targetId, o.plan);
    if (!eff.items.length) {
      section.appendChild(el('p', 'form-note', cleaning ? 'No cleaning plan yet.' : 'No feeding or care plan yet.'));
    } else if (!eff.own) {
      section.appendChild(el('p', 'form-note', 'Following the plan for ' + eff.from.label + '. Add something here to give ' + (o.name || 'this') + ' its own ' + (cleaning ? 'cleaning ' : '') + 'plan instead.'));
      var go = btn('pick-link', 'Open ' + eff.from.label + ' ›', function () { location.hash = careTargetHash(eff.from.type, eff.from.id); });
      section.appendChild(go);
    }
    eff.items.forEach(function (c) {
      var extra = null;
      if (eff.own) {
        extra = el('span', 'care-actions');
        extra.appendChild(btn('pick-link', 'Edit', function () { editor(o, c, o.refresh); }));
        extra.appendChild(btn('pick-link relation-remove', 'Remove', function () {
          Modal.confirm({
            title: 'Remove from the plan?', message: 'Remove “' + careLineText(c) + '” from this plan? The supply itself isn’t deleted.', confirmLabel: 'Remove',
            onConfirm: function () { deleteRecord('care', c.id).then(o.refresh).catch(function () {}); },
          });
        }));
      }
      section.appendChild(line(c, extra));
    });
    section.addItem = function () { editor(o, null, o.refresh); };
    if (!o.noAdd) section.appendChild(btn('btn-positive care-add', cleaning ? '+ Add Cleaning Job' : '+ Add Food or Care', section.addItem));
    return section;
  }

  return { render: render, line: line };
})();
