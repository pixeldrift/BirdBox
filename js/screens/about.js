// Account -> About: who made BirdBox and who it's for, what it does today, and a plain-language
// look at what's coming. Copy lives in js/data/about.js.
const AboutScreen = (function () {
  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text) e.textContent = text;
    return e;
  }

  function renderList(main) {
    clearEl(main);
    var wrap = el('div', 'list-screen');

    var hero = el('div', 'detail-section about-hero');
    hero.appendChild(el('h3', 'about-name', 'BirdBox'));
    hero.appendChild(el('p', 'about-tagline', ABOUT.tagline));
    hero.appendChild(el('p', 'notes-text', ABOUT.intro));
    hero.appendChild(el('p', 'about-byline', 'Created by ' + ABOUT.creator));
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

    var year = new Date().getFullYear();
    var years = year > ABOUT.copyrightStartYear ? ABOUT.copyrightStartYear + '–' + year : String(year);
    var foot = el('div', 'about-footer');
    foot.appendChild(el('p', '', '© ' + years + ' ' + ABOUT.creator + '. All rights reserved.'));
    var credits = el('p', '');
    credits.appendChild(document.createTextNode('Species information and illustrations belong to their creators. '));
    var link = el('a', 'ext-link', 'See Credits');
    link.href = '#/account/credits';
    credits.appendChild(link);
    foot.appendChild(credits);
    wrap.appendChild(foot);

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderList };
})();
