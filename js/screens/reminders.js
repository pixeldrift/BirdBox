// My Birds → Reminders (hidden for now; show it from Settings → Make BirdBox yours): how often each disease should be tested again.
// It belongs with Health, and it moved out of Settings. The starting values are common practice, not rules — change any of them.
const RemindersScreen = (function () {
  function sectionEl(title) {
    var section = document.createElement('div');
    section.className = 'detail-section';
    var h = document.createElement('h3');
    h.textContent = title;
    section.appendChild(h);
    return section;
  }
  function noteEl(text) {
    var p = document.createElement('p');
    p.className = 'form-note';
    p.textContent = text;
    return p;
  }

  // How often each disease should be re-tested. The starting values are common practice, not rules — change any of them.
  function card(main) {
    var section = sectionEl('Test reminders');
    section.appendChild(noteEl('How often each disease should be tested again. BirdBox flags a test as due soon (within ' + DUE_SOON_DAYS + ' days) or overdue. The starting values are common practice — they vary by disease, program and state, so check with your vet and change them to suit you.'));
    var OPTIONS = [[0, 'No reminder'], [3, 'Every 3 months'], [6, 'Every 6 months'], [12, 'Every year'], [24, 'Every 2 years'], [36, 'Every 3 years']];
    knownDiseases().forEach(function (disease) {
      var current = testIntervalMonths(disease);
      var row = document.createElement('div');
      row.className = 'reminder-row';
      var label = document.createElement('span');
      label.className = 'reminder-label';
      label.textContent = disease;
      row.appendChild(label);
      var sel = document.createElement('select');
      sel.className = 'form-input reminder-select';
      sel.setAttribute('aria-label', disease + ' retest interval');
      var opts = OPTIONS.slice();
      if (!opts.some(function (o) { return o[0] === current; })) opts.push([current, 'Every ' + current + ' months']);
      opts.forEach(function (o) { var op = document.createElement('option'); op.value = String(o[0]); op.textContent = o[1]; sel.appendChild(op); });
      sel.value = String(current);
      sel.addEventListener('change', function () {
        setTestInterval(disease, Number(sel.value)).then(function () { renderList(main); }).catch(function (err) { Modal.alert(err.message || 'That didn’t save — try again.', 'Couldn’t save that'); });
      });
      row.appendChild(sel);
      section.appendChild(row);
    });
    return section;
  }


  function renderList(main) {
    clearEl(main);
    var wrap = document.createElement('div');
    wrap.className = 'list-screen';
    wrap.appendChild(card(main));
    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: function (main) { renderList(main); } };
})();
