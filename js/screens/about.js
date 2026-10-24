// Account -> About: who made BirdBox and who it's for, what it does today, a plain-language
// look at what's coming, and the sources behind it (used first, then recommended reading). Copy lives in js/data/about.js.
const AboutScreen = (function () {
  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text) e.textContent = text;
    return e;
  }

  var TAGS = {
    partner: 'Partner',
    affiliate: 'Affiliate link',
  };

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

  function isRecommended(item) { return /^Recommended reading/.test(item.used || ''); }

  function sourcesSections(wrap) {
    var used = el('div', 'detail-section');
    used.appendChild(el('h3', '', 'Sources we use'));
    used.appendChild(el('p', 'form-note', 'BirdBox builds on the work of others. These are the sources and artists behind the species information and artwork in the app. Links open in a new tab.'));
    var more = el('div', 'detail-section');
    more.appendChild(el('h3', '', 'More to explore'));
    more.appendChild(el('p', 'form-note', 'Recommended reading — not used inside BirdBox, but worth a look.'));
    var hasMore = false;
    CREDITS.forEach(function (group) {
      var u = group.items.filter(function (i) { return !isRecommended(i); });
      if (u.length) {
        used.appendChild(el('p', 'subsection-label', group.title));
        u.forEach(function (i) { used.appendChild(renderItem(i)); });
      }
      group.items.filter(isRecommended).forEach(function (i) { hasMore = true; more.appendChild(renderItem(i)); });
    });
    wrap.appendChild(used);
    if (hasMore) wrap.appendChild(more);
  }

  function renderList(main) {
    clearEl(main);
    var wrap = el('div', 'list-screen');

    var hero = el('div', 'detail-section about-hero');
    hero.appendChild(el('h3', 'about-name', 'BirdBox'));
    hero.appendChild(el('p', 'about-tagline', ABOUT.tagline));
    hero.appendChild(el('p', 'notes-text', ABOUT.intro));
    var byline = el('p', 'about-byline', 'Created by ' + ABOUT.creator + '. Questions or ideas? ');
    var mail = el('a', 'ext-link', ABOUT.contactEmail);
    mail.href = 'mailto:' + ABOUT.contactEmail;
    byline.appendChild(mail);
    hero.appendChild(byline);
    wrap.appendChild(hero);

    var who = el('div', 'detail-section');
    who.appendChild(el('h3', '', 'Who it’s for'));
    who.appendChild(el('p', 'notes-text', ABOUT.audience));
    wrap.appendChild(who);

    var features = el('div', 'detail-section');
    features.appendChild(el('h3', '', 'What you can do today'));
    ABOUT.features.forEach(function (f) {
      var item = el('div', 'about-item');
      item.appendChild(el('h4', 'about-item-title', f.title));
      item.appendChild(el('p', 'about-item-text', f.text));
      features.appendChild(item);
    });
    wrap.appendChild(features);

    var road = el('div', 'detail-section');
    road.appendChild(el('h3', '', 'Where it’s headed'));
    ABOUT.roadmap.forEach(function (stage) {
      road.appendChild(el('p', 'subsection-label', stage.title));
      var ul = el('ul', 'about-list');
      stage.items.forEach(function (t) { ul.appendChild(el('li', '', t)); });
      road.appendChild(ul);
    });
    road.appendChild(el('p', 'form-note', ABOUT.roadmapNote));
    wrap.appendChild(road);

    sourcesSections(wrap);

    var year = new Date().getFullYear();
    var years = year > ABOUT.copyrightStartYear ? ABOUT.copyrightStartYear + '–' + year : String(year);
    var foot = el('div', 'about-footer');
    foot.appendChild(el('p', '', '© ' + years + ' ' + ABOUT.creator + '. All rights reserved.'));
    foot.appendChild(el('p', '', 'Species information and illustrations belong to their creators.'));
    wrap.appendChild(foot);

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderList };
})();
