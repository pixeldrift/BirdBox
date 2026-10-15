// Small shared helpers for list/detail screens (Birds, Contacts, Accounting, ...).
// Kept intentionally minimal — screen-specific row/card markup stays in each screen module.

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
  wrap.appendChild(document.createTextNode(bird.band + ' · '));
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
  var doc = files.filter(function (f) { return (f.kind === 'receipt' || f.kind === 'waybill') && isImage(f); })[0];
  if (doc) return { src: doc.url };
  var photo = files.filter(function (f) { return f.kind === 'photo'; })[0];
  if (photo) return { src: photo.url };
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
