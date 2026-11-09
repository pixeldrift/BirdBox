// Small shared helpers for list/detail screens (Birds, Contacts, Accounting, ...).
// Kept intentionally minimal — screen-specific row/card markup stays in each screen module.

// Phone numbers are shown and saved as xxx-xxx-xxxx (the server does the same, so it never depends on this).
function formatPhone(input) {
  var raw = String(input == null ? '' : input).trim();
  if (!raw) return '';
  var digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
  if (digits.length === 10 && !/[a-z]/i.test(raw) && !/^\+(?!1)/.test(raw)) return digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
  return raw;
}

function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function formatMoney(n) {
  if (n === null || n === undefined) return '—';
  var sign = n < 0 ? '-$' : '$';
  return sign + Math.abs(n).toLocaleString();
}

function formatDate(iso) {
  if (!iso) return '—';
  // Dates arrive as 'YYYY-MM-DD' or, from Postgres date columns, as a full timestamp string —
  // only the calendar day matters.
  var d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// A label/value pair used in a .fact-grid.
function factRow(label, value, valueClass) {
  var item = document.createElement('div');
  item.className = 'fact';
  var l = document.createElement('span');
  l.className = 'fact-label';
  l.textContent = label;
  var v = document.createElement('span');
  v.className = 'fact-value' + (valueClass ? ' ' + valueClass : '');
  v.textContent = value;
  item.appendChild(l);
  item.appendChild(v);
  return item;
}

// Species rows for a bird's facts: the US common name leads; the scientific name is secondary
// (small, italic) and only shown when the bird is linked to a species. Subspecies means a true
// subspecies/form. Birds not yet linked fall back to their old free-text species.
function speciesFacts(bird) {
  if (bird.speciesName) {
    var rows = [['Species', bird.speciesName]];
    if (bird.scientificName) rows.push(['Scientific name', bird.scientificName, 'sci-name']);
    if (bird.subspecies) rows.push(['Subspecies / form', bird.subspecies]);
    return rows;
  }
  return [['Species', bird.species || '—'], ['Subspecies', bird.subspecies || '—']];
}

// Small off-site link to the species' Birds of the World page (opens in a new tab).
function appendSpeciesLink(grid, bird) {
  if (!bird.birdsOfTheWorldUrl) return;
  var item = document.createElement('div');
  item.className = 'fact fact-wide';
  var link = document.createElement('a');
  link.className = 'ext-link';
  link.href = bird.birdsOfTheWorldUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'More about this species on Birds of the World ↗';
  item.appendChild(link);
  grid.appendChild(item);
}

// A tappable (or disabled) chip used in a .chip-row, optionally with a small label above the value.
// A link chip. opts (optional): { thumb: element shown at the left, sub: second line of text
// (string or element) }. Chips with a thumbnail lay out as a row.
function makeChip(labelText, valueText, onClick, opts) {
  opts = opts || {};
  var chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip' + (onClick ? '' : ' disabled') + (opts.thumb ? ' has-thumb' : '');
  if (opts.thumb) chip.appendChild(opts.thumb);
  var text = document.createElement('span');
  text.className = 'chip-text';
  if (labelText) {
    var l = document.createElement('span');
    l.className = 'chip-label';
    l.textContent = labelText;
    text.appendChild(l);
  }
  var v = document.createElement('span');
  v.className = 'chip-value';
  v.textContent = valueText;
  text.appendChild(v);
  if (opts.sub) {
    var sub = document.createElement('span');
    sub.className = 'chip-sub';
    if (typeof opts.sub === 'string') sub.textContent = opts.sub; else sub.appendChild(opts.sub);
    text.appendChild(sub);
  }
  chip.appendChild(text);
  if (onClick) {
    chip.addEventListener('click', onClick);
  } else {
    chip.disabled = true;
  }
  return chip;
}

// A small square thumbnail: a picture when there is one (cover-fit), else an icon, else short
// text such as "PDF". spec: { src, icon, text }.
function makeThumb(spec) {
  var t = document.createElement('span');
  t.className = 'chip-thumb';
  fillThumb(t, spec);
  return t;
}

function fillThumb(container, spec) {
  clearEl(container);
  if (spec.src) {
    var pic = document.createElement('img');
    pic.src = spec.src;
    pic.alt = '';
    pic.className = 'thumb-photo';
    container.appendChild(pic);
  } else if (spec.text) {
    var label = document.createElement('span');
    label.className = 'thumb-text';
    label.textContent = spec.text;
    container.appendChild(label);
  } else {
    var icon = document.createElement('img');
    icon.src = spec.icon;
    icon.alt = '';
    container.appendChild(icon);
  }
}

// Band number and sex, with the sex word tinted — what tells two "Sun Conure"s apart.
function birdSubLine(bird) {
  var wrap = document.createElement('span');
  wrap.appendChild(document.createTextNode(birdBandLabel(bird) + ' · '));
  var sex = document.createElement('span');
  sex.className = sexTextClass(bird.sex);
  sex.textContent = bird.sex;
  wrap.appendChild(sex);
  return wrap;
}

// Link to a bird: its photo or species icon (blue / pink / gray by sex), name and species, and
// the band number + sex underneath.
function birdChip(bird, onClick, labelText) {
  var thumb = document.createElement('span');
  thumb.className = 'chip-thumb';
  fillBirdAvatar(thumb, bird);
  return makeChip(labelText || null, birdShortLabel(bird), onClick, { thumb: thumb, sub: birdSubLine(bird) });
}

// Link to a person: their photo if they have one, else the person icon.
function contactChip(contact, onClick, labelText) {
  var spec = contact.photoUrl ? { src: contact.photoUrl } : { icon: 'icons/tinted/business/Contacts.png' };
  return makeChip(labelText || null, contact.name, onClick, { thumb: makeThumb(spec), sub: contact.type || contact.company || '' });
}

// The left side of a pick-list row (search results): thumbnail + two lines of text.
function pickLead(thumb, title, sub) {
  var lead = document.createElement('span');
  lead.className = 'pick-lead';
  lead.appendChild(thumb);
  var text = document.createElement('span');
  text.className = 'pick-text';
  var t = document.createElement('span');
  t.textContent = title;
  text.appendChild(t);
  if (sub) {
    var st = document.createElement('small');
    if (typeof sub === 'string') st.textContent = sub; else st.appendChild(sub);
    text.appendChild(st);
  }
  lead.appendChild(text);
  return lead;
}

function birdPickLead(bird) {
  var thumb = document.createElement('span');
  thumb.className = 'chip-thumb';
  fillBirdAvatar(thumb, bird);
  return pickLead(thumb, birdShortLabel(bird), birdSubLine(bird));
}

function contactPickLead(contact) {
  var spec = contact.photoUrl ? { src: contact.photoUrl } : { icon: 'icons/tinted/business/Contacts.png' };
  return pickLead(makeThumb(spec), contact.name, [contact.city, contact.state].filter(Boolean).join(', '));
}

// What to show for a health record: the first attached image (e.g. the DNA certificate), a PDF
// marker if that's all there is, else the health icon.
function healthThumbSpec(record) {
  var atts = record.attachments || [];
  var img = atts.filter(function (a) { return a.kind === 'image'; })[0];
  if (img) return { src: img.url };
  if (atts.length) return { text: 'PDF' };
  return { icon: 'icons/tinted/mybirds/Health.png' };
}

function healthChip(record, onClick) {
  return makeChip(record.type, formatDate(record.date), onClick, { thumb: makeThumb(healthThumbSpec(record)) });
}

// What to show for a shipment: the receipt or waybill picture if there is one, else a photo of
// the shipment, a PDF marker, else the shipping icon.
function waybillThumbSpec(wb) {
  var files = wb.files || [];
  function isImage(f) { return /^image\//.test(f.contentType); }
  var photos = files.filter(function (f) { return f.kind === 'photo'; });
  var photo = photos.filter(function (f) { return f.isPrimary; })[0] || photos[0]; // the main photo, if you've chosen one
  if (photo) return { src: photo.url };
  var doc = files.filter(function (f) { return (f.kind === 'receipt' || f.kind === 'waybill' || f.kind === 'invoice') && isImage(f); })[0];
  if (doc) return { src: doc.url };
  if (files.some(function (f) { return f.kind === 'receipt' || f.kind === 'waybill'; })) return { text: 'PDF' };
  return { icon: 'icons/tinted/business/Shipping.png' };
}

// A labeled on/off switch. onChange receives the new boolean value; the caller owns
// persisting it (mutate the underlying record) and re-rendering if needed.
function makeToggle(checked, labelText, onChange) {
  var row = document.createElement('label');
  row.className = 'toggle-row';

  var input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = !!checked;
  input.className = 'toggle-input';

  var track = document.createElement('span');
  track.className = 'toggle-track';

  var label = document.createElement('span');
  label.className = 'toggle-label';
  label.textContent = labelText;

  input.addEventListener('change', function () { onChange(input.checked); });

  row.appendChild(input);
  row.appendChild(track);
  row.appendChild(label);
  return row;
}

// The CSS class that tints the word Male / Female (or leaves Unsexed neutral).
function sexTextClass(sex) {
  return sex === 'Male' ? 'sex-male' : sex === 'Female' ? 'sex-female' : 'sex-unsexed';
}

// Fills an avatar container (.list-row-avatar or .detail-avatar) with the bird's primary
// photo if it has one (full-bleed, object-fit: cover), else the taxonomy-resolved species
// icon (small, centered) on a sex-coloured tile — see js/data/icon-taxonomy.js. Depends on birdPrimaryPhoto()
// and resolveBirdIcon(), both defined in js/data/*.js, loaded before this is ever called.
function fillBirdAvatar(container, bird) {
  clearEl(container);
  // The tile behind the icon is blue for males, pink for females, light gray if unsexed.
  container.classList.remove('avatar-male', 'avatar-female', 'avatar-unsexed');
  container.classList.add(bird.sex === 'Male' ? 'avatar-male' : bird.sex === 'Female' ? 'avatar-female' : 'avatar-unsexed');
  container.classList.toggle('avatar-framed', !!birdPrimaryPhoto(bird)); // photos get a 2px frame in the same colour
  var photo = birdPrimaryPhoto(bird);
  var img = document.createElement('img');
  img.alt = '';
  if (photo) {
    img.src = photo.url;
    img.className = 'avatar-photo';
  } else {
    img.src = resolveBirdIcon(bird);
  }
  container.appendChild(img);
}

// The little pencil in a record's header that opens its edit form.
function makeEditButton(onClick) {
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'edit-btn';
  b.setAttribute('aria-label', 'Edit');
  b.title = 'Edit';
  b.textContent = '✎';
  b.addEventListener('click', onClick);
  return b;
}

// ---- disease tests (health records of type 'Disease Test') ----

// "3 months ago", "just now"… for a past ISO date.
function timeAgoText(iso) {
  var d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  var days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days < 1) return 'today';
  if (days < 31) return days + (days === 1 ? ' day ago' : ' days ago');
  var months = Math.round(days / 30.4);
  if (months < 24) return months + (months === 1 ? ' month ago' : ' months ago');
  return Math.round(days / 365.25) + ' years ago';
}

// The latest result per disease as small badges: "Pullorum-Typhoid: Negative · Mar 2026". Tap one to open that test.
function testBadges(birdId) {
  var box = document.createElement('div');
  box.className = 'test-badges';
  latestTests(birdId).forEach(function (t) {
    var r = t.latest;
    var b = document.createElement('button');
    b.type = 'button';
    var st = testStatus(r);
    b.className = 'test-badge ' + testResultClass(r.result) + (st.state === 'overdue' ? ' due-overdue' : st.state === 'soon' ? ' due-soon' : '');
    b.textContent = t.disease + ': ' + (r.result || 'Pending') + ' · ' + new Date(String(r.date).slice(0, 10) + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) +
      (st.state === 'overdue' || st.state === 'soon' ? ' · ' + st.label : '');
    b.title = 'Last tested ' + timeAgoText(r.date) + (st.due ? ' · next due ' + formatDate(st.due) : '');
    b.addEventListener('click', function () { location.hash = '#/mybirds/health/' + r.id; });
    box.appendChild(b);
  });
  return box;
}

// A bird's tests grouped by disease: the latest result up top, earlier ones listed under it, newest first.
function testHistorySection(bird) {
  var section = document.createElement('div');
  section.className = 'detail-section';
  section.appendChild(Object.assign(document.createElement('h3'), { textContent: 'Disease Tests' }));
  var groups = latestTests(bird.id);
  if (!groups.length) section.appendChild(Object.assign(document.createElement('p'), { className: 'form-note', textContent: 'No tests logged yet. Record each test — the disease, the date and the result — and the latest shows up here and at the top of this page.' }));
  groups.forEach(function (g) {
    var head = document.createElement('div');
    head.className = 'test-group-head';
    head.appendChild(Object.assign(document.createElement('strong'), { textContent: g.disease }));
    head.appendChild(Object.assign(document.createElement('span'), { className: 'type-badge ' + testResultClass(g.latest.result), textContent: g.latest.result || 'Pending' }));
    section.appendChild(head);
    section.appendChild(Object.assign(document.createElement('p'), { className: 'form-note', textContent: 'Last tested ' + formatDate(g.latest.date) + ' (' + timeAgoText(g.latest.date) + ')' + (g.latest.provider ? ' · ' + g.latest.provider : '') }));
    var st = testStatus(g.latest);
    if (st.due) {
      section.appendChild(Object.assign(document.createElement('p'), { className: 'form-note test-due ' + (st.state === 'overdue' ? 'due-overdue-text' : st.state === 'soon' ? 'due-soon-text' : ''),
        textContent: 'Next test ' + formatDate(st.due) + (st.state === 'overdue' || st.state === 'soon' ? ' — ' + st.label : '') }));
    }
    g.history.forEach(function (r, i) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'test-history-row' + (i === 0 ? ' latest' : '');
      row.appendChild(Object.assign(document.createElement('span'), { textContent: formatDate(r.date) + (r.provider ? ' · ' + r.provider : '') }));
      row.appendChild(Object.assign(document.createElement('span'), { className: 'test-result-text ' + testResultClass(r.result) + '-text', textContent: r.result || 'Pending' }));
      row.addEventListener('click', function () { location.hash = '#/mybirds/health/' + r.id; });
      section.appendChild(row);
    });
  });
  var add = document.createElement('button');
  add.type = 'button';
  add.className = 'btn-positive';
  add.textContent = '+ Add Test';
  add.addEventListener('click', function () { HealthScreen.pendingBirdId = bird.id; HealthScreen.pendingType = 'Disease Test'; location.hash = '#/mybirds/health/new'; });
  section.appendChild(add);
  return section;
}

// ---- awards and results ----

// A small "★ Best of Breed · Ohio National 2026" badge for each of a bird's top placements (the newest few).
function awardBadges(bird, limit) {
  var box = document.createElement('div');
  box.className = 'test-badges award-badges';
  var all = awardsForBird(bird.id);
  var top = all.filter(isTopPlacement);
  top.slice(0, limit || 2).forEach(function (a) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'test-badge award-badge';
    b.textContent = '★ ' + awardLabel(a);
    b.addEventListener('click', function () { location.hash = '#/mybirds/birds/award~' + a.id; });
    box.appendChild(b);
  });
  if (all.length > Math.min(top.length, limit || 2)) {
    var more = document.createElement('span');
    more.className = 'award-more';
    more.textContent = all.length + (all.length === 1 ? ' result' : ' results') + ' in all';
    box.appendChild(more);
  }
  return box;
}

// noEvent: on a show's own page the show name is already the heading, so lead with the class instead.
function awardRow(a, noEvent) {
  var row = document.createElement('button');
  row.type = 'button';
  row.className = 'test-history-row award-row' + (isTopPlacement(a) ? ' latest' : '');
  var left = document.createElement('span');
  left.className = 'award-left';
  left.appendChild(Object.assign(document.createElement('strong'), { textContent: noEvent ? (a.category || 'Entered') : a.event }));
  left.appendChild(Object.assign(document.createElement('small'), { textContent: [a.kind !== 'Show' ? a.kind : '', noEvent ? '' : (a.date ? formatDate(a.date) : ''), noEvent ? '' : a.category, a.entries ? 'of ' + a.entries : '', noEvent ? '' : a.location, mediaPhotos('award', a.id).length ? '📷 ' + mediaPhotos('award', a.id).length : ''].filter(Boolean).join(' · ') }));
  row.appendChild(left);
  row.appendChild(Object.assign(document.createElement('span'), { className: 'award-place' + (isTopPlacement(a) ? ' top' : ''), textContent: a.placement || 'Entered' }));
  row.addEventListener('click', function () { location.hash = '#/mybirds/birds/award~' + a.id; });
  return row;
}

// A bird's results, newest first, plus the awards of its parents and grandparents as pedigree credentials.
function awardsSection(bird) {
  var section = document.createElement('div');
  section.className = 'detail-section';
  var own = awardsForBird(bird.id);
  section.appendChild(Object.assign(document.createElement('h3'), { textContent: 'Awards & Results' + (own.length ? ' (' + own.length + ')' : '') }));
  if (!own.length) section.appendChild(Object.assign(document.createElement('p'), { className: 'form-note', textContent: 'No shows or races recorded for this bird yet.' }));
  own.forEach(function (a) { section.appendChild(awardRow(a)); });
  var add = document.createElement('button');
  add.type = 'button';
  add.className = 'btn-positive';
  add.textContent = '+ Add Result';
  add.addEventListener('click', function () { location.hash = '#/mybirds/birds/award~new~' + bird.id; });
  section.appendChild(add);

  var ped = pedigreeAwards(bird);
  if (ped.length) {
    section.appendChild(Object.assign(document.createElement('p'), { className: 'subsection-label', textContent: 'In the pedigree' }));
    ped.forEach(function (p) {
      var head = document.createElement('button');
      head.type = 'button';
      head.className = 'pick-link';
      head.textContent = p.relation + ': ' + birdShortLabel(p.bird) + (p.bird.band ? ' (' + p.bird.band + ')' : '') + ' ›';
      head.addEventListener('click', function () { location.hash = '#/mybirds/birds/' + p.bird.id; });
      section.appendChild(head);
      p.awards.slice(0, 4).forEach(function (a) { section.appendChild(awardRow(a)); });
      if (p.awards.length > 4) section.appendChild(Object.assign(document.createElement('p'), { className: 'form-note', textContent: '+ ' + (p.awards.length - 4) + ' more on their page' }));
    });
  }
  return section;
}

// A plain line-art trophy (no emoji), for shows where something was won.
function trophyIcon() {
  var ns = 'http://www.w3.org/2000/svg';
  var s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('class', 'trophy-icon');
  s.setAttribute('aria-label', 'Won an award');
  var p = document.createElementNS(ns, 'path');
  p.setAttribute('d', 'M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M9 20h6M10 17h4');
  s.appendChild(p);
  return s;
}
