// Adding birds: a single-bird form (#/mybirds/birds/new) and a CSV batch import
// (#/mybirds/birds/import). Both end up in addBirds() (js/data/birds-sample.js), which
// POSTs to /api/birds — the server re-validates everything, so this file's checks are
// for fast, friendly feedback, not the only line of defense.
const BirdsAddScreen = (function () {
  var SEXES = ['Male', 'Female', 'Unsexed'];
  var STATUSES = ['Available', 'Reserved', 'Sold', 'Deceased'];

  var TEMPLATE_HEADERS = ['band', 'name', 'sex', 'species', 'subspecies', 'mutation', 'hatch_date',
    'status', 'cage', 'mother_band', 'father_band', 'paired_band', 'cost', 'price', 'registry_public', 'notes'];
  var TEMPLATE_EXAMPLES = [
    ['AR 20001 CA', 'Pepper', 'Female', 'Conure', 'Green-Cheeked', 'Cinnamon', '2024-03-15', 'Available', 'F2-004', '', '', '', '250', '650', 'no', 'Example row — replace or delete me'],
    ['AR 20002 CA', '', 'Male', 'Cockatiel', '', 'Lutino', '3/2/2024', 'Reserved', '', '', '', 'AR 20001 CA', '', '120', 'yes', ''],
  ];
  var REQUIRED_COLUMNS = ['band', 'sex', 'species'];

  function distinct(values) {
    var seen = {};
    return values.filter(function (v) {
      if (!v || seen[v]) return false;
      seen[v] = true;
      return true;
    }).sort();
  }

  function isRealDate(y, m, d) {
    var dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }

  function normalizeDate(v) {
    v = (v || '').trim();
    if (!v) return { value: '' };
    var bad = { error: 'Hatch date "' + v + '" isn’t a real date — use YYYY-MM-DD or M/D/YYYY' };
    var iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return isRealDate(+iso[1], +iso[2], +iso[3]) ? { value: v } : bad;
    var us = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (us && isRealDate(+us[3], +us[1], +us[2])) {
      return { value: us[3] + '-' + ('0' + us[1]).slice(-2) + '-' + ('0' + us[2]).slice(-2) };
    }
    return bad;
  }

  function matchOption(v, options) {
    var lower = (v || '').trim().toLowerCase();
    return options.filter(function (o) { return o.toLowerCase() === lower; })[0] || null;
  }

  function parseBool(v) {
    return /^(yes|y|true|1)$/i.test((v || '').trim());
  }

  // Friendly validation shared by the form and the CSV preview. `raw` uses the same keys
  // as the API; parent fields are bird ids (already resolved by the caller).
  function check(raw, extraIds) {
    var band = (raw.band || '').trim().replace(/\s+/g, ' ');
    if (!band) return { error: 'Band number is required' };
    if (!(raw.species || '').trim()) return { error: 'Species is required' };
    var sex = matchOption(raw.sex, SEXES);
    if (!sex) return { error: 'Sex must be Male, Female, or Unsexed' };
    var status = raw.status ? matchOption(raw.status, STATUSES) : 'Available';
    if (!status) return { error: 'Status must be one of ' + STATUSES.join(', ') };
    var date = normalizeDate(raw.hatchDate);
    if (date.error) return { error: date.error };
    var cost = (raw.cost || '').toString().replace(/[$,\s]/g, '');
    var price = (raw.price || '').toString().replace(/[$,\s]/g, '');
    if ((cost && isNaN(Number(cost))) || (price && isNaN(Number(price)))) return { error: 'Cost and price must be numbers' };
    var id = birdIdFromBand(band);
    if (getBird(id)) return { error: 'A bird with band ' + band + ' already exists' };
    var bird = {
      band: band, name: (raw.name || '').trim(), sex: sex, species: raw.species.trim(),
      subspecies: (raw.subspecies || '').trim(), mutation: (raw.mutation || '').trim(),
      hatchDate: date.value, status: status, cage: (raw.cage || '').trim(),
      motherId: raw.motherId || '', fatherId: raw.fatherId || '', pairedId: raw.pairedId || '',
      cost: cost, price: price, registryPublic: !!raw.registryPublic, notes: (raw.notes || '').trim(),
    };
    return { bird: bird, id: id };
  }

  function field(labelText, control, hint) {
    var label = document.createElement('label');
    label.className = 'form-field';
    var span = document.createElement('span');
    span.className = 'form-label';
    span.textContent = labelText;
    label.appendChild(span);
    label.appendChild(control);
    if (hint) {
      var note = document.createElement('p');
      note.className = 'form-note';
      note.textContent = hint;
      label.appendChild(note);
    }
    return label;
  }

  function input(type, extra) {
    var el = document.createElement('input');
    el.type = type;
    el.className = 'form-input';
    Object.keys(extra || {}).forEach(function (k) { el[k] = extra[k]; });
    return el;
  }

  function select(options, blankLabel) {
    var el = document.createElement('select');
    el.className = 'form-input';
    if (blankLabel !== undefined) {
      var blank = document.createElement('option');
      blank.value = '';
      blank.textContent = blankLabel;
      el.appendChild(blank);
    }
    options.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      el.appendChild(opt);
    });
    return el;
  }

  function datalist(id, values) {
    var dl = document.createElement('datalist');
    dl.id = id;
    values.forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v;
      dl.appendChild(opt);
    });
    return dl;
  }

  function birdOptions() {
    return BIRDS_SAMPLE.map(function (b) { return { value: b.id, label: birdShortLabel(b) + ' (' + b.band + ')' }; });
  }

  function message(kind, text) {
    var p = document.createElement('p');
    p.className = 'form-message ' + kind;
    p.textContent = text;
    return p;
  }

  function renderForm(main, navigate, setTitle) {
    clearEl(main);
    setTitle('Add Bird');

    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';
    var form = document.createElement('form');
    form.className = 'detail-section record-form';

    var band = input('text', { placeholder: 'e.g. AR 20001 CA', required: true });
    var name = input('text', { placeholder: 'Optional' });
    var sex = select(SEXES.map(function (s) { return { value: s, label: s }; }));
    sex.value = 'Unsexed';
    var species = input('text', { placeholder: 'Start typing…', required: true });
    species.setAttribute('list', 'dl-species');
    var subspecies = input('text', { placeholder: 'Start typing…' });
    subspecies.setAttribute('list', 'dl-subspecies');
    var mutation = input('text', { placeholder: 'Optional' });
    var hatch = input('date');
    var status = select(STATUSES.map(function (s) { return { value: s, label: s }; }));
    var cage = input('text', { placeholder: 'e.g. F2-001' });
    cage.setAttribute('list', 'dl-cages');
    var mother = select(birdOptions(), 'Unknown');
    var father = select(birdOptions(), 'Unknown');
    var paired = select(birdOptions(), 'Not paired');
    var cost = input('number', { min: '0', step: '0.01', placeholder: '0.00' });
    var price = input('number', { min: '0', step: '0.01', placeholder: '0.00' });
    var notes = document.createElement('textarea');
    notes.className = 'form-input';
    notes.rows = 3;

    // Light typeahead from what's already in the flock; a proper species lookup
    // (see docs/roadmap.md) will replace this.
    var speciesNames = distinct(Object.keys(SPECIES_NODE).concat(BIRDS_SAMPLE.map(function (b) { return b.species; })));
    var dlSpecies = datalist('dl-species', speciesNames);
    var dlSub = datalist('dl-subspecies', []);
    var dlCages = datalist('dl-cages', distinct(BIRDS_SAMPLE.map(function (b) { return b.cage; })));
    species.addEventListener('input', function () {
      var wanted = species.value.trim().toLowerCase();
      clearEl(dlSub);
      distinct(BIRDS_SAMPLE.filter(function (b) { return b.species.toLowerCase() === wanted; })
        .map(function (b) { return b.subspecies; })).forEach(function (v) {
        var opt = document.createElement('option');
        opt.value = v;
        dlSub.appendChild(opt);
      });
    });

    var errorBox = document.createElement('div');
    var saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'save-btn';
    saveBtn.textContent = 'Add Bird';

    [field('Band number', band), field('Name', name), field('Sex', sex), field('Species', species),
      field('Subspecies', subspecies), field('Mutation', mutation), field('Hatch date', hatch),
      field('Status', status), field('Cage', cage), field('Mother', mother), field('Father', father),
      field('Paired with', paired), field('Cost', cost), field('Asking price', price), field('Notes', notes),
      dlSpecies, dlSub, dlCages, errorBox, saveBtn].forEach(function (el) { form.appendChild(el); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearEl(errorBox);
      var result = check({
        band: band.value, name: name.value, sex: sex.value, species: species.value,
        subspecies: subspecies.value, mutation: mutation.value, hatchDate: hatch.value,
        status: status.value, cage: cage.value, motherId: mother.value, fatherId: father.value,
        pairedId: paired.value, cost: cost.value, price: price.value, notes: notes.value,
      });
      if (result.error) {
        errorBox.appendChild(message('error', result.error));
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      addBirds([result.bird]).then(function (data) {
        if (data.created.length) {
          navigate(data.created[0].id);
        } else {
          throw new Error(data.rejected.length ? data.rejected[0].error : 'Could not save this bird');
        }
      }).catch(function (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Add Bird';
        errorBox.appendChild(message('error', err.message));
      });
    });

    wrap.appendChild(form);
    main.appendChild(wrap);
  }

  function downloadTemplate() {
    Csv.download('birdbox-birds-template.csv', Csv.stringify([TEMPLATE_HEADERS].concat(TEMPLATE_EXAMPLES)));
  }

  function headerKey(h) {
    return h.trim().toLowerCase().replace(/[\s-]+/g, '_');
  }

  // Turns parsed CSV rows into { ready: [{ line, bird }], problems: [{ line, error }] }.
  function analyze(rows) {
    var headers = rows[0].map(headerKey);
    var missing = REQUIRED_COLUMNS.filter(function (c) { return headers.indexOf(c) === -1; });
    if (missing.length) return { fatal: 'Missing required column' + (missing.length > 1 ? 's' : '') + ': ' + missing.join(', ') + '. Download the template to see the expected headers.' };

    var fileIds = {};
    rows.slice(1).forEach(function (r) {
      var b = r[headers.indexOf('band')];
      if (b && b.trim()) fileIds[birdIdFromBand(b)] = true;
    });

    function cell(r, name) {
      var i = headers.indexOf(name);
      return i === -1 ? '' : (r[i] || '');
    }
    function parent(r, name) {
      var v = cell(r, name).trim();
      if (!v) return { id: '' };
      var id = birdIdFromBand(v);
      if (getBird(id) || fileIds[id]) return { id: id };
      return { error: name.replace('_band', '') + ' band ' + v + ' isn’t in your flock or in this file' };
    }

    var ready = [], problems = [], seen = {};
    rows.slice(1).forEach(function (r, i) {
      var line = i + 2;
      var mother = parent(r, 'mother_band'), father = parent(r, 'father_band'), paired = parent(r, 'paired_band');
      var parentError = mother.error || father.error || paired.error;
      var result = check({
        band: cell(r, 'band'), name: cell(r, 'name'), sex: cell(r, 'sex'), species: cell(r, 'species'),
        subspecies: cell(r, 'subspecies'), mutation: cell(r, 'mutation'), hatchDate: cell(r, 'hatch_date'),
        status: cell(r, 'status'), cage: cell(r, 'cage'), motherId: mother.id, fatherId: father.id,
        pairedId: paired.id, cost: cell(r, 'cost'), price: cell(r, 'price'),
        registryPublic: parseBool(cell(r, 'registry_public')), notes: cell(r, 'notes'),
      });
      if (result.error) problems.push({ line: line, error: result.error });
      else if (parentError) problems.push({ line: line, error: parentError });
      else if (seen[result.id]) problems.push({ line: line, error: 'Band ' + result.bird.band + ' appears more than once in this file' });
      else { seen[result.id] = true; ready.push({ line: line, bird: result.bird }); }
    });
    return { ready: ready, problems: problems };
  }

  function renderImport(main, navigate, setTitle) {
    clearEl(main);
    setTitle('Import Birds');

    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';

    var intro = document.createElement('div');
    intro.className = 'detail-section';
    var h = document.createElement('h3');
    h.textContent = 'Import from a spreadsheet';
    var steps = document.createElement('p');
    steps.className = 'notes-text';
    steps.textContent = 'Download the template, fill in one row per bird, save it as a CSV, then upload it here. ' +
      'Only band, sex, and species are required. You’ll see a preview before anything is added.';
    var tplBtn = document.createElement('button');
    tplBtn.type = 'button';
    tplBtn.className = 'add-record-btn';
    tplBtn.textContent = 'Download CSV template';
    tplBtn.addEventListener('click', downloadTemplate);
    var fileInput = input('file', { accept: '.csv,text/csv' });
    intro.appendChild(h);
    intro.appendChild(steps);
    intro.appendChild(tplBtn);
    intro.appendChild(field('Choose your CSV file', fileInput,
      'Dates can be YYYY-MM-DD or M/D/YYYY. Parents and pairs are entered by band number.'));

    var output = document.createElement('div');

    fileInput.addEventListener('change', function () {
      clearEl(output);
      var file = fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var rows = Csv.parse(String(reader.result));
        if (rows.length < 2) {
          output.appendChild(message('error', 'That file doesn’t have any bird rows in it.'));
          return;
        }
        var analysis = analyze(rows);
        if (analysis.fatal) {
          output.appendChild(message('error', analysis.fatal));
          return;
        }
        renderPreview(output, analysis, navigate);
      };
      reader.readAsText(file);
    });

    wrap.appendChild(intro);
    wrap.appendChild(output);
    main.appendChild(wrap);
  }

  function renderPreview(output, analysis, navigate) {
    var section = document.createElement('div');
    section.className = 'detail-section';
    var h = document.createElement('h3');
    h.textContent = analysis.ready.length + (analysis.ready.length === 1 ? ' bird is' : ' birds are') + ' ready to import';
    section.appendChild(h);

    analysis.ready.slice(0, 8).forEach(function (r) {
      var p = document.createElement('p');
      p.className = 'notes-text';
      p.textContent = r.bird.band + ' · ' + r.bird.sex + ' · ' + (r.bird.subspecies ? r.bird.subspecies + ' ' : '') + r.bird.species;
      section.appendChild(p);
    });
    if (analysis.ready.length > 8) {
      var more = document.createElement('p');
      more.className = 'form-note';
      more.textContent = '…and ' + (analysis.ready.length - 8) + ' more';
      section.appendChild(more);
    }

    if (analysis.problems.length) {
      var ph = document.createElement('h3');
      ph.textContent = analysis.problems.length + (analysis.problems.length === 1 ? ' row needs' : ' rows need') + ' attention (will be skipped)';
      section.appendChild(ph);
      analysis.problems.forEach(function (p) {
        section.appendChild(message('error', 'Row ' + p.line + ': ' + p.error));
      });
    }

    var resultBox = document.createElement('div');
    if (analysis.ready.length) {
      var go = document.createElement('button');
      go.type = 'button';
      go.className = 'save-btn';
      go.textContent = 'Import ' + analysis.ready.length + (analysis.ready.length === 1 ? ' bird' : ' birds');
      go.addEventListener('click', function () {
        go.disabled = true;
        go.textContent = 'Importing…';
        addBirds(analysis.ready.map(function (r) { return r.bird; })).then(function (data) {
          clearEl(section);
          var done = document.createElement('h3');
          done.textContent = data.created.length + (data.created.length === 1 ? ' bird' : ' birds') + ' added';
          section.appendChild(done);
          data.rejected.forEach(function (r) {
            section.appendChild(message('error', 'Row ' + analysis.ready[r.index].line + ': ' + r.error));
          });
          var view = document.createElement('button');
          view.type = 'button';
          view.className = 'save-btn';
          view.textContent = 'View my birds';
          view.addEventListener('click', function () { location.hash = '#/mybirds/birds'; });
          section.appendChild(view);
        }).catch(function (err) {
          go.disabled = false;
          go.textContent = 'Try again';
          resultBox.appendChild(message('error', err.message));
        });
      });
      section.appendChild(go);
    }
    section.appendChild(resultBox);
    output.appendChild(section);
  }

  return { renderForm: renderForm, renderImport: renderImport, analyze: analyze, check: check };
})();
