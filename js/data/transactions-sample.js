// Financial ledger, loaded from Postgres (via /api/transactions) instead of
// hardcoded here — see sql/003_transactions.sql for the schema and the seed
// data this replaced. Negative amount = expense/purchase, positive = income
// (sale/deposit). clientId / birdId reference contacts-sample.js / birds-sample.js.
var TRANSACTIONS_SAMPLE = [];

var transactionsLoaded = fetch('/api/transactions')
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load transactions');
    return res.json();
  })
  .then(function (transactions) {
    TRANSACTIONS_SAMPLE.length = 0;
    Array.prototype.push.apply(TRANSACTIONS_SAMPLE, transactions);
  })
  .catch(function (err) {
    console.error('Could not load transactions from the server:', err);
  });

function txClient(tx) {
  return tx.clientId ? getContact(tx.clientId) : null;
}

function txBird(tx) {
  return tx.birdId ? getBird(tx.birdId) : null;
}

function transactionsTotal(list, predicate) {
  return list.filter(predicate).reduce(function (sum, tx) { return sum + tx.amount; }, 0);
}
