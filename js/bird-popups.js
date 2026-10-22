// The little dialogs on a bird's page: where it is, and who owns it.
const BirdPopups = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // What to show for a bird's location: its cage, the person it's with, or a free-text place.
  function locationLabel(bird) {
    if (bird.cage) return bird.cage;
    if (bird.locationContactId) {
      var c = getContact(bird.locationContactId);
      return c ? 'With ' + c.name : 'With someone';
    }
    return bird.locationText || '';
  }

  // The location chooser as a form control. Location is one of three things, never more than one: a
  // cage you keep (browse Location › Building › Cage), with a person (a breeder loan, boarding, a
  // foster home — ownership doesn't change), or somewhere else (an address or a name).
  // initial: { cage, contactId, text }. get() -> { cage, locationContactId, locationText } (two are always '').
  function locationField(initial) {
    var mode = initial.contactId ? 'person' : initial.text ? 'text' : 'cage';
    var picked = { cage: initial.cage || '', contactId: initial.contactId || '', text: initial.text || '' };
    var root = el('div');
    var tabs = el('div', 'filter-chips');
    var panel = el('div');
    root.appendChild(tabs);
    root.appendChild(panel);

    function drawTabs() {
      clearEl(tabs);
      [['cage', 'In a cage'], ['person', 'With a person'], ['text', 'Somewhere else']].forEach(function (t) {
        var chip = el('button', 'filter-chip' + (mode === t[0] ? ' active' : ''), t[1]);
        chip.type = 'button';
        chip.addEventListener('click', function () { mode = t[0]; drawTabs(); drawPanel(); });
        tabs.appendChild(chip);
      });
    }

    function drawPanel() {
      clearEl(panel);
      if (mode === 'cage') {
        panel.appendChild(el('p', 'form-note', 'Browse your locations, buildings and cages — or search for a cage number.'));
        panel.appendChild(Picker.cages({
          value: picked.cage, allowClear: true, onChange: function (code) { picked.cage = code; },
          // A cage that doesn't exist yet can be added right here, filed under the building its number starts with.
          addNew: {
            needsText: true,
            label: function (typed) { return typed ? '+ Add cage “' + typed.toUpperCase() + '”' : '+ New cage — type its number above'; },
            onClick: function (typed, done) {
              var code = typed.toUpperCase().replace(/[^A-Z0-9-]/g, '');
              if (!code) return;
              if (getCage(code)) { done(code); return; }
              var guess = buildingForCage(code);
              createRecord('cages', { code: code, buildingCode: guess ? guess.code : '' }).then(function () { done(code); })
                .catch(function (err) { Modal.alert(err.message); });
            },
          },
        }).el);
      } else if (mode === 'person') {
        panel.appendChild(el('p', 'form-note', 'For a breeder loan, boarding, or a foster home. Where a bird is doesn’t change who owns it.'));
        panel.appendChild(Picker.contacts({ value: picked.contactId, allowClear: true, onChange: function (id) { picked.contactId = id; } }).el);
      } else {
        panel.appendChild(el('p', 'form-note', 'An address, a place, or a name — whatever tells you where it is.'));
        var input = el('input', 'form-input');
        input.type = 'text';
        input.placeholder = 'e.g. Rental barn, 12 Oak Rd';
        input.value = picked.text;
        input.addEventListener('input', function () { picked.text = input.value; });
        panel.appendChild(input);
      }
    }
    drawTabs();
    drawPanel();
    return {
      el: root,
      get: function () {
        return {
          cage: mode === 'cage' ? picked.cage : '',
          locationContactId: mode === 'person' ? picked.contactId : '',
          locationText: mode === 'text' ? picked.text.trim() : '',
        };
      },
    };
  }

  function openLocation(bird, onDone) {
    Modal.open({
      title: 'Where is ' + (bird.name || 'this bird') + '?',
      build: function (body, close) {
        var field = locationField({ cage: bird.cage, contactId: bird.locationContactId, text: bird.locationText });
        var message = el('div');
        var save = el('button', 'save-btn', 'Save location');
        save.type = 'button';
        var clear = el('button', 'add-record-btn', 'Clear location');
        clear.type = 'button';
        [field.el, message, save, clear].forEach(function (e) { body.appendChild(e); });

        function write(values) {
          save.disabled = true;
          clear.disabled = true;
          editBird(bird.id, values).then(function () { close(); if (onDone) onDone(); }).catch(function (err) {
            save.disabled = false;
            clear.disabled = false;
            clearEl(message);
            message.appendChild(el('p', 'form-message error', err.message));
          });
        }
        save.addEventListener('click', function () { write(field.get()); });
        clear.addEventListener('click', function () { write({ cage: '', locationContactId: '', locationText: '' }); });
      },
    });
  }

  // Owner: you, or one of your contacts (e.g. a buyer who owns it while you still have it).
  function openOwner(bird, onDone) {
    Modal.open({
      title: 'Who owns ' + (bird.name || 'this bird') + '?',
      build: function (body, close) {
        var owner = birdOwner(bird.id);
        var message = el('div');
        var mine = el('button', 'filter-chip' + (!owner ? ' active' : ''), 'I do');
        mine.type = 'button';
        var other = el('div');
        var picker = Picker.contacts({ value: owner ? owner.id : '', allowClear: true, placeholder: 'Or someone else — search contacts…' });
        other.appendChild(picker.el);
        var save = el('button', 'save-btn', 'Save owner');
        save.type = 'button';
        var chips = el('div', 'filter-chips');
        chips.appendChild(mine);
        [chips, other, message, save].forEach(function (e) { body.appendChild(e); });
        mine.addEventListener('click', function () { picker.set(''); mine.classList.add('active'); });
        save.addEventListener('click', function () {
          save.disabled = true;
          setBirdsOwner([bird.id], picker.get() || null).then(function () { close(); if (onDone) onDone(); }).catch(function (err) {
            save.disabled = false;
            clearEl(message);
            message.appendChild(el('p', 'form-message error', err.message));
          });
        });
      },
    });
  }

  return { locationField: locationField, openLocation: openLocation, openOwner: openOwner, locationLabel: locationLabel };
})();
