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
    sheet.className = 'modal-sheet';
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

  return { open: open };
})();
