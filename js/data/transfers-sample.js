// Hand-overs recorded on a bird (local pick up, local meet, delivery, shipped), loaded from
// /api/transfers — see sql/011_transfers.sql. Possession moving is not the same as ownership
// changing (boarding, breeder loans…), so ownership is only updated when the person says so.
var TRANSFERS_SAMPLE = [];

var transfersLoaded = fetch('/api/transfers')
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load transfers');
    return res.json();
  })
  .then(function (list) {
    TRANSFERS_SAMPLE.length = 0;
    Array.prototype.push.apply(TRANSFERS_SAMPLE, list);
  })
  .catch(function (err) {
    console.error('Could not load transfers from the server:', err);
  });

var TRANSFER_METHODS = ['Local pick up', 'Local meet', 'Delivery', 'Shipped'];

function transfersForBird(birdId) {
  return TRANSFERS_SAMPLE.filter(function (t) { return t.birdId === birdId; });
}

function addTransfer(data) {
  return fetch('/api/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(function (res) {
    return res.json().then(function (body) {
      if (!res.ok) throw new Error(body.error || 'Save failed');
      TRANSFERS_SAMPLE.push(body);
      return body;
    });
  });
}

// Who owns a bird: the contact that lists it as owned, or null when it's yours.
function birdOwner(birdId) {
  return CONTACTS_SAMPLE.filter(function (c) { return (c.birdsOwned || []).indexOf(birdId) !== -1; })[0] || null;
}

// ownerId = a contact id (they own the birds now) or null (you own them).
function setBirdsOwner(birdIds, ownerId) {
  return fetch('/api/ownership', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ birdIds: birdIds, ownerId: ownerId || null }),
  }).then(function (res) {
    return res.json().then(function (body) {
      if (!res.ok) throw new Error(body.error || 'Could not update ownership');
      CONTACTS_SAMPLE.forEach(function (c) {
        c.birdsOwned = (c.birdsOwned || []).filter(function (id) { return birdIds.indexOf(id) === -1; });
        if (c.id === ownerId) {
          c.birdsOwned = c.birdsOwned.concat(birdIds);
          c.birdsPurchasing = (c.birdsPurchasing || []).filter(function (id) { return birdIds.indexOf(id) === -1; });
        }
      });
    });
  });
}
