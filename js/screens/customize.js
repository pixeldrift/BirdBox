// Account → Customize: the same drag-and-drop menu editor as the faded ✎ on the home screen.
const CustomizeScreen = (function () {
  function renderList(main) {
    clearEl(main);
    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';
    var card = document.createElement('div');
    card.className = 'detail-section';
    var h = document.createElement('h3');
    h.textContent = 'Make BirdBox yours';
    card.appendChild(h);
    var body = document.createElement('div');
    card.appendChild(body);
    wrap.appendChild(card);
    main.appendChild(wrap);
    NavEditor.build(body);
  }
  return { renderList: renderList, renderDetail: function (main) { renderList(main); } };
})();
