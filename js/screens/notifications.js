// Account -> Notifications: what needs attention right now, worked out from your records — positive tests, tests that are
// overdue or coming due, and supplies that are running low. (Nothing is stored; when push notifications arrive they'll
// send these same alerts.)
const NotificationsScreen = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function row(title, sub, badge, badgeClass, onClick) {
    var b = el('button', 'list-row');
    b.type = 'button';
    var info = el('span', 'list-row-info');
    info.appendChild(el('span', 'list-row-title', title));
    info.appendChild(el('span', 'list-row-sub', sub));
    b.appendChild(info);
    b.appendChild(el('span', 'type-badge ' + badgeClass, badge));
    b.addEventListener('click', onClick);
    return b;
  }

  function renderList(main) {
    clearEl(main);
    var wrap = el('div', 'list-screen');
    var alerts = testAlerts();
    var low = SUPPLIES_SAMPLE.filter(supplyIsLow);

    var tests = el('div', 'detail-section');
    tests.appendChild(el('h3', '', 'Health tests (' + alerts.length + ')'));
    if (!alerts.length) tests.appendChild(el('p', 'form-note', 'Nothing due — no positive, overdue or upcoming tests.'));
    var list = el('div', 'list-rows');
    alerts.forEach(function (a) {
      var cls = a.status.state === 'positive' ? 'result-positive' : a.status.state === 'overdue' ? 'result-positive' : 'result-inconclusive';
      list.appendChild(row(birdShortLabel(a.bird) + (a.bird.band ? ' (' + a.bird.band + ')' : ''), a.test.disease + ' · last ' + formatDate(a.test.date) + ' · ' + (a.test.result || 'Pending'), a.status.label, cls,
        function () { location.hash = '#/mybirds/birds/' + a.bird.id; }));
    });
    tests.appendChild(list);
    wrap.appendChild(tests);

    var supplies = el('div', 'detail-section');
    supplies.appendChild(el('h3', '', 'Running low (' + low.length + ')'));
    if (!low.length) supplies.appendChild(el('p', 'form-note', 'Everything is stocked above its reorder level.'));
    var list2 = el('div', 'list-rows');
    low.forEach(function (s) { list2.appendChild(row(s.name, s.category, supplyAmount(s) + ' left', 'supply-low', function () { location.hash = '#/aviary/supplies/' + s.id; })); });
    supplies.appendChild(list2);
    wrap.appendChild(supplies);

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderList };
})();
