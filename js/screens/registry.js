// Registry: Registry -> Search (public band-number lookup) and Registry -> Register
// (manage which of your own birds are included). Both read straight off BIRDS_SAMPLE's
// registryPublic flag — there's no separate registry entity, so toggling a bird "is"
// registering it, per the user's linked-data/modular philosophy (see docs/roadmap.md).
// Shared row/fact/chip helpers come from js/ui-helpers.js.

const RegistrySearchScreen = (function () {
  // Public record only shows these fields, plus lineage to OTHER public birds — owner,
  // notes, cost/price never appear here even though this screen can see the full object.
  function publicFacts(bird) {
    return [
      ['Band #', bird.band],
      ['Species', bird.species],
      ['Subspecies', bird.subspecies],
      ['Mutation', bird.mutation || '—'],
      ['Sex', bird.sex],
      ['Hatch Date', formatDate(bird.hatchDate)],
    ];
  }

  function publicRelChip(label, relBird, navigate) {
    if (!relBird) return makeChip(label, 'Not on file', null);
    if (!relBird.registryPublic) return makeChip(label, 'Private record', null);
    return makeChip(label, birdShortLabel(relBird), function () { navigate(relBird.id); });
  }

  function renderResult(container, bird, navigate) {
    clearEl(container);

    var card = document.createElement('div');
    card.className = 'detail-section';

    var header = document.createElement('div');
    header.className = 'detail-header';
    var avatar = document.createElement('div');
    avatar.className = 'detail-avatar';
    fillBirdAvatar(avatar, bird);
    var titleWrap = document.createElement('div');
    titleWrap.className = 'detail-title';
    var h2 = document.createElement('h2');
    h2.textContent = birdShortLabel(bird);
    var badge = document.createElement('span');
    badge.className = 'type-badge type-breeder';
    badge.textContent = 'Registered';
    titleWrap.appendChild(h2);
    titleWrap.appendChild(badge);
    header.appendChild(avatar);
    header.appendChild(titleWrap);
    card.appendChild(header);

    var factsGrid = document.createElement('div');
    factsGrid.className = 'fact-grid';
    publicFacts(bird).forEach(function (f) { factsGrid.appendChild(factRow(f[0], f[1])); });
    card.appendChild(factsGrid);

    var lineage = document.createElement('div');
    lineage.className = 'detail-section';
    var lineageTitle = document.createElement('h3');
    lineageTitle.textContent = 'Public Lineage';
    lineage.appendChild(lineageTitle);
    var lineageRow = document.createElement('div');
    lineageRow.className = 'chip-row';
    lineageRow.appendChild(publicRelChip('Mother', bird.motherId ? getBird(bird.motherId) : null, navigate));
    lineageRow.appendChild(publicRelChip('Father', bird.fatherId ? getBird(bird.fatherId) : null, navigate));
    lineage.appendChild(lineageRow);

    var publicKids = birdChildren(bird.id).filter(function (k) { return k.registryPublic; });
    if (publicKids.length) {
      var kidsLabel = document.createElement('p');
      kidsLabel.className = 'subsection-label';
      kidsLabel.textContent = 'Public Offspring (' + publicKids.length + ')';
      lineage.appendChild(kidsLabel);
      var kidsRow = document.createElement('div');
      kidsRow.className = 'chip-row';
      publicKids.forEach(function (k) {
        kidsRow.appendChild(makeChip(null, birdShortLabel(k), function () { navigate(k.id); }));
      });
      lineage.appendChild(kidsRow);
    }

    var privacyNote = document.createElement('p');
    privacyNote.className = 'form-note';
    privacyNote.textContent = 'Owner contact, notes, and sale details are private and not shown here.';

    container.appendChild(card);
    container.appendChild(lineage);
    container.appendChild(privacyNote);
  }

  function renderNotFound(container, query) {
    clearEl(container);
    var card = document.createElement('div');
    card.className = 'detail-section';
    var h3 = document.createElement('h3');
    h3.textContent = 'Band not found';
    var p = document.createElement('p');
    p.className = 'notes-text';
    p.textContent = 'Band number "' + query + '" isn’t in the public registry — it may not exist, or its owner hasn’t made it public.';
    card.appendChild(h3);
    card.appendChild(p);
    container.appendChild(card);
  }

  function findPublicByBand(query) {
    var q = query.trim().toLowerCase();
    if (!q) return null;
    return BIRDS_SAMPLE.filter(function (b) {
      return b.registryPublic && b.band.toLowerCase().replace(/\s+/g, '') === q.replace(/\s+/g, '');
    })[0] || null;
  }

  function renderList(main, navigate) {
    var wrap = document.createElement('div');
    wrap.className = 'list-screen';

    var intro = document.createElement('p');
    intro.className = 'form-note';
    intro.textContent = 'Search the public registry by exact band number.';

    var searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'e.g. AR 10001 CA';
    searchInput.className = 'search-input';
    searchInput.setAttribute('aria-label', 'Search band number');

    var resultWrap = document.createElement('div');

    searchInput.addEventListener('input', function (e) {
      var q = e.target.value;
      if (!q.trim()) {
        clearEl(resultWrap);
        return;
      }
      var found = findPublicByBand(q);
      if (found) {
        renderResult(resultWrap, found, navigate);
      } else {
        renderNotFound(resultWrap, q.trim());
      }
    });

    wrap.appendChild(intro);
    wrap.appendChild(searchInput);
    wrap.appendChild(resultWrap);
    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderList };
})();

const RegistryManageScreen = (function () {
  function renderList(main, navigate) {
    var wrap = document.createElement('div');
    wrap.className = 'list-screen';

    var intro = document.createElement('p');
    intro.className = 'form-note';
    intro.textContent = 'Turn a bird on to add it to the public registry automatically — there’s nothing else to fill in, its record is generated from what’s already on the bird’s page.';
    wrap.appendChild(intro);

    var listWrap = document.createElement('div');
    listWrap.className = 'list-rows';

    function draw() {
      clearEl(listWrap);
      BIRDS_SAMPLE.forEach(function (bird) { listWrap.appendChild(renderRow(bird)); });
    }

    function renderRow(bird) {
      var row = document.createElement('div');
      row.className = 'list-row';

      var avatar = document.createElement('span');
      avatar.className = 'list-row-avatar';
      var img = document.createElement('img');
      img.src = 'icons/tinted/mybirds/Birds.png';
      img.alt = '';
      avatar.appendChild(img);

      var info = document.createElement('span');
      info.className = 'list-row-info';
      var title = document.createElement('span');
      title.className = 'list-row-title';
      title.textContent = birdShortLabel(bird);
      var sub = document.createElement('span');
      sub.className = 'list-row-sub';
      sub.textContent = bird.band;
      info.appendChild(title);
      info.appendChild(sub);

      info.style.cursor = 'pointer';
      info.addEventListener('click', function () { location.hash = '#/mybirds/birds/' + bird.id; });

      var toggle = makeToggle(bird.registryPublic, '', function (checked) {
        updateBird(bird.id, { registryPublic: checked }).catch(function () {});
      });

      row.appendChild(avatar);
      row.appendChild(info);
      row.appendChild(toggle);
      return row;
    }

    draw();
    wrap.appendChild(listWrap);
    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderList };
})();
