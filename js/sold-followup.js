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

  function render(container, bird, onDone, opts) {
    clearEl(container);
    var buyerId = (opts && opts.buyerId) || '';
    var box = el('div', 'detail-section ownership-prompt');
    box.appendChild(el('h3', '', opts && opts.title ? opts.title : 'Marked as Sold — what happens next?'));

    // Who bought it (optional, but it pre-fills everything below).
    var buyerField = el('div', 'form-field');
    buyerField.appendChild(el('span', 'form-label', 'Who bought it?'));
    var actions = el('div');
    var message = el('div');
    if (!buyerId) buyerField.appendChild(Picker.contacts({ placeholder: 'Search contacts…', allowClear: true, onChange: function (id) { buyerId = id; drawActions(); } }).el);

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

    if (!buyerId) box.appendChild(buyerField);
    box.appendChild(actions);
    box.appendChild(message);
    container.appendChild(box);
    drawActions();
  }

  return { render: render };
})();
