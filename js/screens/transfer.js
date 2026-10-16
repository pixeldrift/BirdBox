// Record that a bird changed hands without a shipment — a local pick up, a local meet or a
// delivery (or a shipped bird you only want to note on the bird itself). Reached from a bird's
// page (#/mybirds/birds/transfer). After saving, asks whether ownership changes too.
const TransferScreen = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function field(labelText, control, hint) {
    var label = el('label', 'form-field');
    label.appendChild(el('span', 'form-label', labelText));
    label.appendChild(control);
    if (hint) label.appendChild(el('p', 'form-note', hint));
    return label;
  }

  function start(birdId, contactId) {
    TransferScreen.pendingBirdId = birdId;
    TransferScreen.pendingContactId = contactId || '';
    location.hash = '#/mybirds/birds/transfer';
  }

  function renderForm(main, navigate, setTitle) {
    clearEl(main);
    var bird = getBird(TransferScreen.pendingBirdId);
    if (!bird) {
      main.appendChild(el('p', '', 'Open a bird first, then choose Record Transfer.'));
      return;
    }
    setTitle('Record Transfer');

    var state = { direction: 'Out', contactId: TransferScreen.pendingContactId || '' };
    TransferScreen.pendingContactId = '';
    var wrap = el('div', 'detail-screen');
    var form = el('form', 'detail-section record-form');
    var birdRow = el('div', 'pick-selected');
    birdRow.appendChild(birdChip(bird, null));
    form.appendChild(field('Bird', birdRow));

    var dirWrap = el('div', 'toggle-chips');
    var label = el('span', 'form-label', 'What happened?');
    function drawDir() {
      clearEl(dirWrap);
      [['Out', 'Went to someone'], ['In', 'Came from someone']].forEach(function (o) {
        var chip = el('button', 'filter-chip' + (state.direction === o[0] ? ' active' : ''), o[1]);
        chip.type = 'button';
        chip.addEventListener('click', function () { state.direction = o[0]; drawDir(); drawContactLabel(); });
        dirWrap.appendChild(chip);
      });
    }
    var dirField = el('div', 'form-field');
    dirField.appendChild(label);
    dirField.appendChild(dirWrap);

    var contactLabel = el('span', 'form-label');
    var contactPicker = Picker.contacts({ value: state.contactId, onChange: function (id) { state.contactId = id; } });
    var contactField = el('div', 'form-field');
    contactField.appendChild(contactLabel);
    contactField.appendChild(contactPicker.el);
    function drawContactLabel() { contactLabel.textContent = state.direction === 'Out' ? 'Who has it now?' : 'Who did it come from?'; }

    var method = el('select', 'form-input');
    TRANSFER_METHODS.forEach(function (m) {
      var opt = el('option', '', m);
      opt.value = m;
      method.appendChild(opt);
    });
    var date = el('input', 'form-input');
    date.type = 'date';
    var notes = el('textarea', 'form-input');
    notes.rows = 3;
    var errorBox = el('div');
    var saveBtn = el('button', 'save-btn', 'Save Transfer');
    saveBtn.type = 'submit';

    [dirField, contactField, field('How was it handed over?', method), field('Date', date, 'Leave blank if you don’t remember.'),
      field('Notes', notes), errorBox, saveBtn].forEach(function (e) { form.appendChild(e); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearEl(errorBox);
      if (!state.contactId) { errorBox.appendChild(el('p', 'form-message error', 'Choose who it ' + (state.direction === 'Out' ? 'went to' : 'came from'))); return; }
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      addTransfer({ birdId: bird.id, contactId: state.contactId, direction: state.direction, method: method.value, date: date.value || null, notes: notes.value })
        .then(function (t) { afterSave(t); })
        .catch(function (err) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Transfer';
          errorBox.appendChild(el('p', 'form-message error', err.message));
        });
    });

    // Saved: ask about ownership (never assumed), then go back to the bird.
    function afterSave(t) {
      clearEl(main);
      var contact = getContact(t.contactId);
      var done = el('div', 'detail-screen');
      done.appendChild(el('p', 'form-message info', 'Transfer saved.'));
      var promptBox = el('div');
      done.appendChild(promptBox);
      var after = el('div');
      done.appendChild(after);
      main.appendChild(done);

      function finish(changed) {
        clearEl(promptBox);
        if (changed !== null) done.insertBefore(el('p', 'form-message info', changed ? 'Ownership updated.' : 'Ownership left as it was.'), promptBox);
        if (t.method === 'Shipped') {
          var ship = el('button', 'add-record-btn', 'Add shipping details');
          ship.type = 'button';
          ship.addEventListener('click', function () {
            ShippingAddScreen.prefill({ birdIds: [bird.id], clientId: t.contactId, direction: t.direction === 'Out' ? 'Outgoing' : 'Incoming', date: t.date || '' });
            location.hash = '#/business/shipping/new';
          });
          after.appendChild(ship);
        }
        var back = el('button', 'save-btn', 'Back to ' + birdShortLabel(bird));
        back.type = 'button';
        back.addEventListener('click', function () { navigate(bird.id); });
        after.appendChild(back);
      }
      OwnershipPrompt.render(promptBox, { birdIds: [bird.id], contact: contact, direction: t.direction, onDone: finish });
    }

    drawDir();
    drawContactLabel();
    wrap.appendChild(form);
    main.appendChild(wrap);
  }

  return { start: start, renderForm: renderForm, pendingBirdId: null, pendingContactId: '' };
})();
