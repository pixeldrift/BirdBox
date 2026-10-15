// Account -> Credits: the sources, artists and partners behind BirdBox, with a short description
// of each and a link out. Data lives in js/data/credits.js.
const CreditsScreen = (function () {
  var TAGS = {
    partner: 'Partner',
    affiliate: 'Affiliate link',
  };

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text) e.textContent = text;
    return e;
  }

  function renderItem(item) {
    var card = el('div', 'credit-item');

    var head = el('div', 'credit-head');
    head.appendChild(el('h4', 'credit-name', item.name));
    if (TAGS[item.relationship]) head.appendChild(el('span', 'credit-tag', TAGS[item.relationship]));
    card.appendChild(head);

    if (item.by) card.appendChild(el('p', 'credit-by', item.by));
    card.appendChild(el('p', 'credit-description', item.description));
    if (item.used) card.appendChild(el('p', 'credit-used', item.used));
    if (item.disclosure) card.appendChild(el('p', 'credit-disclosure', item.disclosure));

    var link = el('a', 'ext-link', 'Visit ' + item.name + ' ↗');
    link.href = item.url;
    link.target = '_blank';
    link.rel = item.relationship === 'affiliate' ? 'sponsored noopener noreferrer' : 'noopener noreferrer';
    card.appendChild(link);
    return card;
  }

  function renderList(main) {
    clearEl(main);

    var wrap = el('div', 'list-screen');

    var intro = el('div', 'detail-section');
    intro.appendChild(el('h3', '', 'Standing on good shoulders'));
    intro.appendChild(el('p', 'notes-text',
      'BirdBox builds on the work of others. These are the sources and artists behind the species information and artwork in the app, ' +
      'plus a few places we recommend for learning more. We link to them as a courtesy — they open in a new tab.'));
    wrap.appendChild(intro);

    CREDITS.forEach(function (group) {
      var section = el('div', 'detail-section');
      section.appendChild(el('h3', '', group.title));
      if (group.blurb) section.appendChild(el('p', 'form-note credit-blurb', group.blurb));
      group.items.forEach(function (item) { section.appendChild(renderItem(item)); });
      wrap.appendChild(section);
    });

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderList };
})();
