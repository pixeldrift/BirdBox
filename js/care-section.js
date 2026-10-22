// The "Care & feeding" box on a bird's or place's page: what it's fed and given, how much and when, with each
// food linked to its Supplies page. A target with no plan of its own follows the nearest one above it.
//   CareSection.render({ targetType, targetId, name, refresh }) -> element
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
    var row = el('div', 'care-line');
    var sup = c.supplyId ? getSupply(c.supplyId) : null;
    var lead = el(sup ? 'button' : 'span', 'care-food');
    if (sup) { lead.type = 'button'; lead.addEventListener('click', function () { location.hash = '#/aviary/supplies/' + sup.id; }); }
    var url = sup ? mediaMainPhotoUrl('supply', sup.id) : '';
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

  function editor(o, existing, done) {
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
          var data = { targetType: o.targetType, targetId: o.targetId, supplyId: supplyId || '', label: supplyId ? '' : label.value.trim(), amount: amount.value.trim(), mealTime: when.value, notes: notes.value.trim() };
          (existing ? updateRecord('care', existing.id, data) : createRecord('care', data)).then(function () { close(); done(); }).catch(function (err) {
            save.disabled = false;
            message.appendChild(el('p', 'form-message error', err.message));
          });
        });
      },
    });
  }

  function render(o) {
    var section = el('div', 'detail-section');
    section.appendChild(el('h3', '', 'Care & feeding'));
    var eff = effectiveCare(o.targetType, o.targetId);
    if (!eff.items.length) {
      section.appendChild(el('p', 'form-note', 'No feeding or care plan yet.'));
    } else if (!eff.own) {
      section.appendChild(el('p', 'form-note', 'Following the plan for ' + eff.from.label + '. Add something here to give ' + (o.name || 'this') + ' its own plan instead.'));
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
    section.appendChild(btn('add-record-btn care-add', '+ Add food or care', function () { editor(o, null, o.refresh); }));
    return section;
  }

  return { render: render, line: line };
})();
