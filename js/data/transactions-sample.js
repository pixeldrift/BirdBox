// Sample financial ledger, shaped after the Transactions table in docs/data-model.md.
// Negative amount = expense/purchase, positive = income (sale/deposit).
// clientId / birdId reference js/data/contacts-sample.js and js/data/birds-sample.js.
const TRANSACTIONS_SAMPLE = [
  {
    id: 'tx-001', item: 'Payment to Steve — Invoice 22-2086', amount: -540,
    date: '2022-01-04', category: 'Purchase', funding: 'PayPal',
    clientId: 'c-001', birdId: null, notes: '',
  },
  {
    id: 'tx-002', item: 'Payment to Steve on balance', amount: -600,
    date: '2021-02-07', category: 'Purchase', funding: 'PayPal',
    clientId: 'c-001', birdId: null, notes: '',
  },
  {
    id: 'tx-003', item: 'Payment to Steve for African Grey', amount: -1000,
    date: '2021-03-13', category: 'Purchase', funding: 'PayPal',
    clientId: 'c-001', birdId: 'AR15002CA', notes: '',
  },
  {
    id: 'tx-004', item: 'DNA Sexing — Invoice ABI 322119', amount: -45,
    date: '2021-05-10', category: 'Expense', funding: 'Bank of America',
    clientId: 'c-008', birdId: null, notes: '',
  },
  {
    id: 'tx-005', item: 'Cage order', amount: -320,
    date: '2021-06-01', category: 'Expense', funding: 'Check',
    clientId: 'c-007', birdId: null, notes: '',
  },
  {
    id: 'tx-006', item: 'Deposit on Red Factor Sun Conure', amount: 300,
    date: '2022-04-10', category: 'Deposit', funding: 'Venmo',
    clientId: 'c-004', birdId: 'AR11103CA', notes: '',
  },
  {
    id: 'tx-007', item: 'Final payment on Sun Conure', amount: 600,
    date: '2021-08-20', category: 'Sale', funding: 'Cash',
    clientId: 'c-002', birdId: 'AR11101CA', notes: '',
  },
  {
    id: 'tx-008', item: 'Payment for IRN Parakeet', amount: 450,
    date: '2021-09-05', category: 'Sale', funding: 'PayPal',
    clientId: 'c-003', birdId: 'AR13002CA', notes: '',
  },
  {
    id: 'tx-009', item: 'Deposit on Green-Cheeked Conure', amount: 200,
    date: '2022-02-01', category: 'Deposit', funding: 'Venmo',
    clientId: 'c-010', birdId: 'AR12002CA', notes: '',
  },
  {
    id: 'tx-010', item: 'Feed & supplies run', amount: -180,
    date: '2022-03-02', category: 'Expense', funding: 'Cash',
    clientId: null, birdId: null, notes: '',
  },
  {
    id: 'tx-011', item: 'Payment to Steve — Invoice 22-2105', amount: -2000,
    date: '2022-04-25', category: 'Purchase', funding: 'PayPal',
    clientId: 'c-001', birdId: null, notes: '',
  },
  {
    id: 'tx-012', item: 'Deposit on Rio', amount: 1000,
    date: '2022-03-15', category: 'Deposit', funding: 'Zelle',
    clientId: null, birdId: 'AR14002CA', notes: 'Buyer TBD — phone inquiry.',
  },
];

function txClient(tx) {
  return tx.clientId ? getContact(tx.clientId) : null;
}

function txBird(tx) {
  return tx.birdId ? getBird(tx.birdId) : null;
}

function transactionsTotal(list, predicate) {
  return list.filter(predicate).reduce(function (sum, tx) { return sum + tx.amount; }, 0);
}
