// A popup sheet: slides up from the bottom on a phone, centred on a larger screen. Used for the
// photo chooser, location and owner choosers, and the taxonomy navigator.
//
//   var m = Modal.open({ title: 'Location', build: function (body, close) { … }, onClose: function () {} });
//   m.close();
const Modal = (function () {
  var openCount = 0;

  function open(opts) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    var sheet = document.createElement('div');
    sheet.className = 'modal-sheet' + (opts.fixedHeight ? ' modal-fixed' : '');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', opts.title || 'Dialog');

    var head = document.createElement('div');
    head.className = 'modal-head';
    var title = document.createElement('h2');
    title.textContent = opts.title || '';
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'modal-close';
    x.setAttribute('aria-label', 'Close');
    x.textContent = '✕';
    head.appendChild(title);
    head.appendChild(x);

    var body = document.createElement('div');
    body.className = 'modal-body';
    sheet.appendChild(head);
    sheet.appendChild(body);
    overlay.appendChild(sheet);

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      openCount -= 1;
      if (openCount <= 0) { openCount = 0; document.body.classList.remove('modal-open'); }
      if (opts.onClose) opts.onClose();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    x.addEventListener('click', close);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    openCount += 1;
    document.body.classList.add('modal-open');
    document.body.appendChild(overlay);
    opts.build(body, close);
    return { close: close, body: body };
  }

  // An app-styled replacement for the browser's confirm() / alert() boxes.
  //   Modal.confirm({ title, message, confirmLabel, cancelLabel, danger, onConfirm })
  //   Modal.alert(message, title)
  function confirm(o) {
    return open({
      title: o.title || 'Are you sure?',
      build: function (body, close) {
        var p = document.createElement('p');
        p.className = 'confirm-text';
        p.textContent = o.message || '';
        var yes = document.createElement('button');
        yes.type = 'button';
        yes.className = 'save-btn' + (o.danger ? ' danger' : '');
        yes.textContent = o.confirmLabel || 'Yes';
        yes.addEventListener('click', function () { close(); if (o.onConfirm) o.onConfirm(); });
        var no = document.createElement('button');
        no.type = 'button';
        no.className = 'add-record-btn';
        no.textContent = o.cancelLabel || 'Cancel';
        no.addEventListener('click', close);
        body.appendChild(p);
        body.appendChild(yes);
        body.appendChild(no);
      },
    });
  }

  function alertBox(message, title) {
    return open({
      title: title || 'Heads up',
      build: function (body, close) {
        var p = document.createElement('p');
        p.className = 'confirm-text';
        p.textContent = message;
        var ok = document.createElement('button');
        ok.type = 'button';
        ok.className = 'save-btn';
        ok.textContent = 'OK';
        ok.addEventListener('click', close);
        body.appendChild(p);
        body.appendChild(ok);
      },
    });
  }

  return { open: open, confirm: confirm, alert: alertBox };
})();
