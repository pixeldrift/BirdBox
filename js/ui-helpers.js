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
  var d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// A label/value pair used in a .fact-grid.
function factRow(label, value) {
  var item = document.createElement('div');
  item.className = 'fact';
  var l = document.createElement('span');
  l.className = 'fact-label';
  l.textContent = label;
  var v = document.createElement('span');
  v.className = 'fact-value';
  v.textContent = value;
  item.appendChild(l);
  item.appendChild(v);
  return item;
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
