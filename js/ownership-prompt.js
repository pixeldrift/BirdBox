// "Possession has moved — does ownership change too?" Never decided automatically: a bird
// can be boarding or out on a breeder loan with someone who doesn't own it.
//
//   OwnershipPrompt.render(container, { birdIds, contact, direction: 'Out' | 'In', onDone })
//
// direction Out = the birds went to `contact`; In = they came from `contact`.
const OwnershipPrompt = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function birdsPhrase(birdIds) {
    var birds = birdIds.map(getBird).filter(Boolean);
    if (birds.length === 1) return birdShortLabel(birds[0]);
    return birds.length + ' birds';
  }

  function render(container, opts) {
    clearEl(container);
    var contact = opts.contact;
    var out = opts.direction === 'Out';
    var box = el('div', 'detail-section ownership-prompt');
    box.appendChild(el('h3', '', 'Does ownership change too?'));
    box.appendChild(el('p', 'notes-text', out
      ? birdsPhrase(opts.birdIds) + ' is now with ' + contact.name + '. Do they own ' + (opts.birdIds.length === 1 ? 'it' : 'them') + ' now?'
      : birdsPhrase(opts.birdIds) + ' is now with you. Do you own ' + (opts.birdIds.length === 1 ? 'it' : 'them') + ' now, instead of ' + contact.name + '?'));
    box.appendChild(el('p', 'form-note', 'Choose “No” for boarding, a breeder loan, or anything where the bird is with someone who doesn’t own it.'));

    var message = el('div');
    var yes = el('button', 'save-btn', out ? 'Yes — ' + contact.name + ' owns ' + (opts.birdIds.length === 1 ? 'it' : 'them') : 'Yes — I own ' + (opts.birdIds.length === 1 ? 'it' : 'them'));
    yes.type = 'button';
    var no = el('button', 'add-record-btn', 'No — leave ownership as it is');
    no.type = 'button';
    yes.addEventListener('click', function () {
      yes.disabled = true;
      no.disabled = true;
      yes.textContent = 'Saving…';
      setBirdsOwner(opts.birdIds, out ? contact.id : null).then(function () { opts.onDone(true); }).catch(function (err) {
        yes.disabled = false;
        no.disabled = false;
        yes.textContent = 'Try again';
        clearEl(message);
        message.appendChild(el('p', 'form-message error', err.message));
      });
    });
    no.addEventListener('click', function () { opts.onDone(false); });
    box.appendChild(yes);
    box.appendChild(no);
    box.appendChild(message);
    container.appendChild(box);
  }

  return { render: render };
})();
