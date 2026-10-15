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
function makeChip(labelText, valueText, onClick) {
  var chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip' + (onClick ? '' : ' disabled');
  if (labelText) {
    var l = document.createElement('span');
    l.className = 'chip-label';
    l.textContent = labelText;
    chip.appendChild(l);
  }
  var v = document.createElement('span');
  v.className = 'chip-value';
  v.textContent = valueText;
  chip.appendChild(v);
  if (onClick) {
    chip.addEventListener('click', onClick);
  } else {
    chip.disabled = true;
  }
  return chip;
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

// Fills an avatar container (.list-row-avatar or .detail-avatar) with the bird's primary
// photo if it has one (full-bleed, object-fit: cover), else the taxonomy-resolved species
// icon (small, centered) on a sex-coloured tile — see js/data/icon-taxonomy.js. Depends on birdPrimaryPhoto()
// and resolveBirdIcon(), both defined in js/data/*.js, loaded before this is ever called.
function fillBirdAvatar(container, bird) {
  clearEl(container);
  // The tile behind the icon is blue for males, pink for females, light gray if unsexed.
  container.classList.remove('avatar-male', 'avatar-female', 'avatar-unsexed');
  container.classList.add(bird.sex === 'Male' ? 'avatar-male' : bird.sex === 'Female' ? 'avatar-female' : 'avatar-unsexed');
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
