// Business reports: income vs expense over time, category breakdown, KPIs.
// Built per the dataviz skill: form chosen by job (diverging bar for above/below-
// baseline income vs expense; horizontal bar for category magnitude+identity),
// color assigned after form, validated with scripts/validate_palette.js against
// this app's own warm palette (not the skill's generic blue/orange default) since
// BirdBox already has a brand. Every value show here is also in Business ->
// Accounting's ledger, which is this chart's table-view fallback.
//
// Diverging pair reuses the same income/expense colors already used in Accounting
// (.amount-income / .amount-expense) for consistency across screens.
// Category palette (4 slots) validated 2026-09 against surface #FFFDF9:
//   node scripts/validate_palette.js "#A6432A,#C08A00,#4C7A3D,#7A4A8C" --mode light --surface "#FFFDF9"
//   -> ALL CHECKS PASS (worst adjacent CVD dE 10.4, normal-vision dE 18.3)
// No dark-mode variant yet: the app has no dark theme at all currently (see
// docs/roadmap.md) so charts stay light-only until that's built app-wide.
const ReportsScreen = (function () {
  var INCOME_COLOR = '#4C6B45';
  var EXPENSE_COLOR = '#A6543D';
  var CATEGORY_COLORS = {
    Purchase: '#A6432A',
    Sale: '#C08A00',
    Deposit: '#4C7A3D',
    Expense: '#7A4A8C',
  };
  var CATEGORY_ORDER = ['Purchase', 'Sale', 'Deposit', 'Expense'];

  var SVG_NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function monthlyData() {
    var byMonth = {};
    TRANSACTIONS_SAMPLE.forEach(function (t) {
      var month = t.date.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { income: 0, expense: 0 };
      if (t.amount > 0) byMonth[month].income += t.amount;
      else byMonth[month].expense += Math.abs(t.amount);
    });
    return Object.keys(byMonth).sort().map(function (m) {
      var d = new Date(m + '-01T00:00:00');
      return {
        month: m,
        label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
        income: byMonth[m].income,
        expense: byMonth[m].expense,
      };
    });
  }

  function categoryData() {
    var byCat = {};
    TRANSACTIONS_SAMPLE.forEach(function (t) {
      byCat[t.category] = (byCat[t.category] || 0) + Math.abs(t.amount);
    });
    return CATEGORY_ORDER.filter(function (c) { return byCat[c]; }).map(function (c) {
      return { category: c, total: byCat[c], color: CATEGORY_COLORS[c] };
    });
  }

  // Vertical bar, rounded at the data end, square at the baseline.
  function vBarPath(x, yBase, width, height, radius, direction) {
    if (height <= 0) return '';
    var r = Math.min(radius, width / 2, height);
    if (direction === 'up') {
      var top = yBase - height;
      return ['M', x, yBase, 'L', x, top + r, 'Q', x, top, x + r, top,
        'L', x + width - r, top, 'Q', x + width, top, x + width, top + r,
        'L', x + width, yBase, 'Z'].join(' ');
    }
    var bottom = yBase + height;
    return ['M', x, yBase, 'L', x, bottom - r, 'Q', x, bottom, x + r, bottom,
      'L', x + width - r, bottom, 'Q', x + width, bottom, x + width, bottom - r,
      'L', x + width, yBase, 'Z'].join(' ');
  }

  // Horizontal bar, rounded at the tip (data end), square at the baseline (x0).
  function hBarPath(x0, y, width, height, radius) {
    if (width <= 0) return '';
    var r = Math.min(radius, height / 2, width);
    return ['M', x0, y, 'L', x0 + width - r, y, 'Q', x0 + width, y, x0 + width, y + r,
      'L', x0 + width, y + height - r, 'Q', x0 + width, y + height, x0 + width - r, y + height,
      'L', x0, y + height, 'Z'].join(' ');
  }

  function makeTooltip(card) {
    var tip = document.createElement('div');
    tip.className = 'chart-tooltip';
    tip.hidden = true;
    card.appendChild(tip);
    document.addEventListener('click', function () { tip.hidden = true; });
    return {
      show: function (targetEl, text) {
        tip.textContent = text;
        tip.hidden = false;
        var cardRect = card.getBoundingClientRect();
        var targetRect = targetEl.getBoundingClientRect();
        var halfTip = tip.offsetWidth / 2;
        var left = targetRect.left - cardRect.left + targetRect.width / 2;
        var top = targetRect.top - cardRect.top;
        tip.style.left = Math.max(halfTip + 4, Math.min(left, cardRect.width - halfTip - 4)) + 'px';
        tip.style.top = Math.max(0, top - 10) + 'px';
      },
    };
  }

  function renderDivergingChart(months) {
    var card = document.createElement('div');
    card.className = 'detail-section chart-card';

    var title = document.createElement('h3');
    title.textContent = 'Income vs Expense by Month';
    card.appendChild(title);

    var legend = document.createElement('div');
    legend.className = 'chart-legend';
    [['Income', INCOME_COLOR], ['Expense', EXPENSE_COLOR]].forEach(function (s) {
      var item = document.createElement('span');
      item.className = 'chart-legend-item';
      var swatch = document.createElement('span');
      swatch.className = 'chart-legend-swatch';
      swatch.style.background = s[1];
      var label = document.createElement('span');
      label.textContent = s[0];
      item.appendChild(swatch);
      item.appendChild(label);
      legend.appendChild(item);
    });
    card.appendChild(legend);

    if (months.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'notes-text';
      empty.textContent = 'No transactions yet.';
      card.appendChild(empty);
      return card;
    }

    var W = 400, H = 220, padTop = 16, padBottom = 46, padSide = 8;
    var baseline = padTop + (H - padTop - padBottom) / 2;
    var halfHeight = (H - padTop - padBottom) / 2;
    var maxAbs = Math.max.apply(null, months.map(function (m) { return Math.max(m.income, m.expense); }).concat([1]));

    var slotWidth = (W - padSide * 2) / months.length;
    var barWidth = Math.min(24, slotWidth * 0.6);

    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart-svg', role: 'img', 'aria-label': 'Income versus expense by month' });

    svg.appendChild(svgEl('line', { x1: padSide, y1: baseline, x2: W - padSide, y2: baseline, class: 'chart-baseline' }));

    var tooltip = makeTooltip(card);

    months.forEach(function (m, i) {
      var slotX = padSide + i * slotWidth;
      var barX = slotX + (slotWidth - barWidth) / 2;

      var label = svgEl('text', { x: slotX + slotWidth / 2, y: baseline + 14, class: 'chart-axis-label', 'text-anchor': 'end', transform: 'rotate(-40 ' + (slotX + slotWidth / 2) + ' ' + (baseline + 14) + ')' });
      label.textContent = m.label;
      svg.appendChild(label);

      if (m.income > 0) {
        var incHeight = (m.income / maxAbs) * (halfHeight - 6);
        var incPath = svgEl('path', { d: vBarPath(barX, baseline, barWidth, incHeight, 4, 'up'), fill: INCOME_COLOR, class: 'chart-mark' });
        var incHit = svgEl('rect', { x: slotX, y: baseline - halfHeight, width: slotWidth, height: halfHeight, fill: 'transparent', class: 'chart-hit' });
        incHit.addEventListener('click', function (e) {
          e.stopPropagation();
          tooltip.show(incPath, m.label + ' Income: ' + formatMoney(m.income));
        });
        svg.appendChild(incPath);
        svg.appendChild(incHit);
      }

      if (m.expense > 0) {
        var expHeight = (m.expense / maxAbs) * (halfHeight - 6);
        var expPath = svgEl('path', { d: vBarPath(barX, baseline, barWidth, expHeight, 4, 'down'), fill: EXPENSE_COLOR, class: 'chart-mark' });
        var expHit = svgEl('rect', { x: slotX, y: baseline, width: slotWidth, height: halfHeight, fill: 'transparent', class: 'chart-hit' });
        expHit.addEventListener('click', function (e) {
          e.stopPropagation();
          tooltip.show(expPath, m.label + ' Expense: ' + formatMoney(-m.expense));
        });
        svg.appendChild(expPath);
        svg.appendChild(expHit);
      }
    });

    card.appendChild(svg);
    return card;
  }

  function renderCategoryChart(categories) {
    var card = document.createElement('div');
    card.className = 'detail-section chart-card';

    var title = document.createElement('h3');
    title.textContent = 'Spending & Income by Category';
    card.appendChild(title);

    if (categories.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'notes-text';
      empty.textContent = 'No transactions yet.';
      card.appendChild(empty);
      return card;
    }

    var W = 400;
    var rowHeight = 34, barHeight = 18, labelWidth = 84, valueWidth = 64;
    var H = categories.length * rowHeight + 8;
    var maxVal = Math.max.apply(null, categories.map(function (c) { return c.total; }));
    var trackWidth = W - labelWidth - valueWidth;

    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart-svg', role: 'img', 'aria-label': 'Total amount by transaction category' });

    categories.forEach(function (c, i) {
      var y = 8 + i * rowHeight;
      var barY = y + (rowHeight - barHeight) / 2 - 8;
      var width = (c.total / maxVal) * (trackWidth - 8);

      var label = svgEl('text', { x: 0, y: barY + barHeight / 2 + 4, class: 'chart-row-label' });
      label.textContent = c.category;
      svg.appendChild(label);

      var bar = svgEl('path', { d: hBarPath(labelWidth, barY, width, barHeight, 4), fill: c.color, class: 'chart-mark' });
      svg.appendChild(bar);

      var value = svgEl('text', { x: labelWidth + width + 8, y: barY + barHeight / 2 + 4, class: 'chart-row-value' });
      value.textContent = formatMoney(c.total);
      svg.appendChild(value);
    });

    card.appendChild(svg);
    return card;
  }

  function renderList(main) {
    var wrap = document.createElement('div');
    wrap.className = 'list-screen';

    var months = monthlyData();
    var income = months.reduce(function (s, m) { return s + m.income; }, 0);
    var expense = months.reduce(function (s, m) { return s + m.expense; }, 0);
    var profit = income - expense;
    var margin = income > 0 ? Math.round((profit / income) * 100) : 0;
    var shippingCost = typeof WAYBILLS_SAMPLE !== 'undefined'
      ? WAYBILLS_SAMPLE.reduce(function (s, w) { return s + w.cost; }, 0)
      : 0;

    var summary = document.createElement('div');
    summary.className = 'summary-strip summary-strip-4';
    [
      ['Income', formatMoney(income)],
      ['Expense', formatMoney(-expense)],
      ['Profit', formatMoney(profit)],
      ['Margin', margin + '%'],
    ].forEach(function (s) {
      var tile = document.createElement('div');
      tile.className = 'summary-tile';
      var l = document.createElement('span');
      l.className = 'summary-tile-label';
      l.textContent = s[0];
      var v = document.createElement('span');
      v.className = 'summary-tile-value';
      v.textContent = s[1];
      tile.appendChild(l);
      tile.appendChild(v);
      summary.appendChild(tile);
    });
    wrap.appendChild(summary);

    wrap.appendChild(renderDivergingChart(months));
    wrap.appendChild(renderCategoryChart(categoryData()));

    var shippingNote = document.createElement('div');
    shippingNote.className = 'detail-section';
    var shippingTitle = document.createElement('h3');
    shippingTitle.textContent = 'Shipping';
    shippingNote.appendChild(shippingTitle);
    var shippingRow = document.createElement('div');
    shippingRow.className = 'chip-row';
    shippingRow.appendChild(makeChip('Shipping Costs to Date', formatMoney(shippingCost), function () {
      location.hash = '#/business/shipping';
    }));
    shippingNote.appendChild(shippingRow);
    wrap.appendChild(shippingNote);

    var tableNote = document.createElement('p');
    tableNote.className = 'form-note';
    tableNote.textContent = 'Every value here is also in the Accounting ledger — tap a bar for its exact number.';
    wrap.appendChild(tableNote);

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderList };
})();
