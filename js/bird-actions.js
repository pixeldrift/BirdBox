// Shipping and selling a bird from wherever you are: the bird's own page, a client's page, and (later) others.
// Each one opens the normal flow pre-filled with what it already knows, so it's the same shipment or sale however
// you got there (see docs/principles.md).
//
//   BirdActions.row(bird, refresh)             "Ship this bird" · "Sell this bird" buttons for a bird's page
//   BirdActions.contactRow(contact, refresh)   "Ship to…" · "Sell a bird to…" · "Receive a shipment" for a client's page
//   BirdActions.ship(bird[, contactId]) · BirdActions.sell({ bird, buyerId, onDone })
const BirdActions = (function () {
  var PAID_WITH = ['Cash', 'Check', 'Zelle', 'PayPal', 'Venmo', 'Card', 'Other'];

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

  // Who a bird is most likely going to: someone buying it, else whoever owns it now.
  function likelyClient(bird) {
    var buyer = CONTACTS_SAMPLE.filter(function (c) { return (c.birdsPurchasing || []).indexOf(bird.id) !== -1; })[0];
    if (buyer) return buyer.id;
    var owner = birdOwner(bird.id);
    return owner ? owner.id : '';
  }

  function ship(bird, contactId) {
    ShippingAddScreen.prefill({ birdIds: [bird.id], clientId: contactId !== undefined ? contactId : likelyClient(bird), direction: 'Outgoing' });
    location.hash = '#/business/shipping/new';
  }

  // The sell sheet: who, how much, when and how paid. Marks the bird Sold and logs the sale in Accounting, then
  // asks what happens next (ship it, hand it over, or just update ownership).
  function sell(o) {
    var bird = o.bird || null;
    Modal.open({
      title: bird ? 'Sell ' + (bird.name || bird.band || 'this bird') : 'Sell a bird',
      build: function (body, close) {
        var buyerId = o.buyerId || '';
        var message = el('div');
        function field(label, control) { var f = el('div', 'form-field'); f.appendChild(el('span', 'form-label', label)); f.appendChild(control); body.appendChild(f); return f; }

        var birdPicker = null;
        if (!bird) {
          birdPicker = Picker.birds({ allowClear: false, placeholder: 'Which bird? Search…', onChange: function (id) { var b = getBird(id); if (b && b.price != null) price.value = b.price; } });
          field('Bird', birdPicker.el);
        }
        var buyer = Picker.contacts({
          value: buyerId, allowClear: true, placeholder: 'Who bought it? Search contacts…', onChange: function (id) { buyerId = id; },
          addNew: {
            needsText: true,
            label: function (typed) { return typed ? '+ Add “' + typed + '” as a new contact' : '+ New contact — type their name above'; },
            onClick: function (typed, done) {
              if (!typed.trim()) return;
              createRecord('contacts', { name: typed.trim(), type: 'Pet Owner' }).then(function (c) { done(c.id); }).catch(function (err) { clearEl(message); message.appendChild(el('p', 'form-message error', err.message)); });
            },
          },
        });
        field('Sold to', buyer.el);
        var price = el('input', 'form-input');
        price.type = 'number'; price.min = '0'; price.step = '0.01'; price.placeholder = '0.00';
        if (bird && bird.price != null) price.value = bird.price;
        field('Price', price);
        var date = el('input', 'form-input');
        date.type = 'date';
        date.value = todayISO();
        field('Date', date);
        var paid = el('select', 'form-input');
        paid.setAttribute('aria-label', 'Paid with');
        PAID_WITH.forEach(function (p) { var op = el('option', '', p); op.value = p; paid.appendChild(op); });
        field('Paid with', paid);
        var save = btn('save-btn', 'Record sale');
        body.appendChild(message);
        body.appendChild(save);

        save.addEventListener('click', function () {
          clearEl(message);
          var target = bird || (birdPicker && getBird(birdPicker.get()));
          if (!target) { message.appendChild(el('p', 'form-message error', 'Choose the bird being sold.')); return; }
          var amount = Number(price.value);
          if (price.value === '' || !isFinite(amount) || amount < 0) { message.appendChild(el('p', 'form-message error', 'Enter the price.')); return; }
          save.disabled = true;
          var label = target.name || target.band || birdShortLabel(target);
          var steps = target.status === 'Sold' ? Promise.resolve() : updateBird(target.id, { status: 'Sold' });
          steps.then(function () {
            return createRecord('transactions', { item: 'Sold: ' + label, amount: amount, date: date.value || todayISO(), category: 'Sale', funding: paid.value, clientId: buyerId || '', birdId: target.id, notes: '' });
          }).then(function () {
            clearEl(body);
            body.appendChild(el('p', 'confirm-text', label + ' is marked Sold and ' + formatMoney(amount) + ' is logged in Accounting' + (buyerId && getContact(buyerId) ? ' for ' + getContact(buyerId).name : '') + '.'));
            var next = el('div');
            body.appendChild(next);
            SoldFollowUp.render(next, target, function () { close(); if (o.onDone) o.onDone(); }, { buyerId: buyerId, title: 'What happens next?' });
          }).catch(function (err) {
            save.disabled = false;
            message.appendChild(el('p', 'form-message error', err.message));
          });
        });
      },
      onClose: function () { if (o.onDone) o.onDone(); },
    });
  }

  function row(bird, refresh) {
    var box = el('div', 'action-row');
    box.appendChild(btn('btn-positive', 'Ship this bird', function () { ship(bird); }));
    box.appendChild(btn('btn-positive', 'Sell this bird', function () { sell({ bird: bird, buyerId: likelyClient(bird), onDone: refresh }); }));
    return box;
  }

  function contactRow(contact, refresh) {
    var first = String(contact.name || 'them').split(/\s+/)[0];
    var box = el('div', 'action-row');
    box.appendChild(btn('btn-positive', 'Ship to ' + first, function () { ShippingAddScreen.prefill({ clientId: contact.id, direction: 'Outgoing' }); location.hash = '#/business/shipping/new'; }));
    box.appendChild(btn('btn-positive', 'Sell a bird to ' + first, function () { sell({ buyerId: contact.id, onDone: refresh }); }));
    box.appendChild(btn('btn-positive', 'Receive a shipment', function () { ShippingAddScreen.prefill({ clientId: contact.id, direction: 'Incoming' }); location.hash = '#/business/shipping/new'; }));
    return box;
  }

  return { row: row, contactRow: contactRow, ship: ship, sell: sell };
})();
