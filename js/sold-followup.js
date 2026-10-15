// When a bird is marked Sold, ask what happens next instead of leaving it half-done:
// ship it, hand it over in person, or just update who owns it. Everything is optional and
// nothing changes ownership unless the person chooses it.
//
//   SoldFollowUp.render(container, bird, onDone)
const SoldFollowUp = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function render(container, bird, onDone) {
    clearEl(container);
    var buyerId = '';
    var box = el('div', 'detail-section ownership-prompt');
    box.appendChild(el('h3', '', 'Marked as Sold — what happens next?'));

    // Who bought it (optional, but it pre-fills everything below).
    var buyerField = el('div', 'form-field');
    buyerField.appendChild(el('span', 'form-label', 'Who bought it?'));
    var search = el('input', 'form-input');
    search.type = 'search';
    search.placeholder = 'Search contacts…';
    var results = el('div', 'pick-results');
    buyerField.appendChild(search);
    buyerField.appendChild(results);
    var actions = el('div');
    var message = el('div');

    function drawBuyer() {
      clearEl(results);
      var buyer = buyerId ? getContact(buyerId) : null;
      if (buyer) {
        search.hidden = true;
        var row = el('div', 'pick-selected');
        row.style.alignItems = 'center';
        row.appendChild(el('strong', '', buyer.name));
        var change = el('button', 'pick-link', 'Change');
        change.type = 'button';
        change.addEventListener('click', function () { buyerId = ''; search.value = ''; drawBuyer(); drawActions(); });
        row.appendChild(change);
        results.appendChild(row);
        return;
      }
      search.hidden = false;
      var q = search.value.trim().toLowerCase();
      if (!q) return;
      var found = CONTACTS_SAMPLE.filter(function (c) {
        return [c.name, c.company, c.city].filter(Boolean).join(' ').toLowerCase().indexOf(q) !== -1;
      }).slice(0, 6);
      if (!found.length) results.appendChild(el('p', 'pick-empty', 'No contacts match that.'));
      found.forEach(function (c) {
        var o = el('button', 'pick-option');
        o.type = 'button';
        o.appendChild(contactPickLead(c));
        o.addEventListener('click', function () { buyerId = c.id; drawBuyer(); drawActions(); });
        results.appendChild(o);
      });
    }
    search.addEventListener('input', drawBuyer);

    function button(label, primary, onClick) {
      var b = el('button', primary ? 'save-btn' : 'add-record-btn', label);
      b.type = 'button';
      b.addEventListener('click', onClick);
      return b;
    }

    function drawActions() {
      clearEl(actions);
      actions.appendChild(button('Set up shipping', true, function () {
        ShippingAddScreen.prefill({ birdIds: [bird.id], clientId: buyerId, direction: 'Outgoing' });
        location.hash = '#/business/shipping/new';
      }));
      actions.appendChild(button('Hand it over in person', false, function () { TransferScreen.start(bird.id, buyerId); }));
      if (buyerId) {
        actions.appendChild(button('Just update ownership', false, function () {
          setBirdsOwner([bird.id], buyerId).then(function () { onDone(); }).catch(function (err) {
            clearEl(message);
            message.appendChild(el('p', 'form-message error', err.message));
          });
        }));
      }
      actions.appendChild(button('Not now', false, function () { onDone(); }));
    }

    box.appendChild(buyerField);
    box.appendChild(actions);
    box.appendChild(message);
    container.appendChild(box);
    drawBuyer();
    drawActions();
  }

  return { render: render };
})();
