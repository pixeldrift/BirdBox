// Mutation genetics for the Genealogy tools — the generic Mendelian engine and the per-species gene
// profiles, adapted from the Tree of Birds project. Works on pedigree nodes (see js/genealogy/pedigree.js).
// A bird records what it LOOKS like (its mutation) but not what it silently carries, so genotypes are
// worked out from (1) its own appearance, (2) splits proven by its recorded offspring and (3) any splits
// you declare. Odds are therefore a floor: an unproven carrier can produce more than predicted.
// To add a species, add a profile to SPECIES_PROFILES (its genes, inheritance types and phenotype names).
const Genetics = (function () {
function normalizeMutationText(text) {
  return (text || '').trim().toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ');
}

// Some real-world spreadsheets record the mutation name under "subspecies" instead of
// "mutation" (this app's own Cockatiel sample rows used to, until it was cleaned up) --
// search both rather than assume one column holds it.
function mutationSourceText(bird) {
  return normalizeMutationText(bird.mutation || '');
}

// ----- Generic Mendelian engine (shared by every species profile) ----- //

// Distribution of a hypothetical offspring's copies (0/1/2) of one gene's mutant allele,
// given each parent's copies. Sex-linked genes get the ZW-specific treatment (a daughter's
// single Z comes only from the father); every other inheritance type -- simple recessive,
// simple dominant, incomplete dominant -- uses the same autosomal Mendelian transmission,
// since they differ only in how "copies" maps to a visible phenotype, not in how they pass
// from parent to offspring.
function geneOffspringDistribution(gene, motherCopies, fatherCopies, offspringSex) {
  const pFather = fatherCopies / 2;
  if (gene.inheritance === 'sexlinked') {
    if (offspringSex === 'daughter') {
      return [{ copies: 0, probability: 1 - pFather }, { copies: 2, probability: pFather }]; // her Z comes only from dad
    }
    const pMother = motherCopies / 2;
    const outcomes = {};
    [[1 - pMother, 0], [pMother, 1]].forEach(([pm, m]) => {
      [[1 - pFather, 0], [pFather, 1]].forEach(([pf, f]) => {
        const c = m + f; outcomes[c] = (outcomes[c] || 0) + pm * pf;
      });
    });
    return Object.entries(outcomes).map(([c, p]) => ({ copies: +c, probability: p }));
  }
  const pMother = motherCopies / 2;
  const outcomes = {};
  [[1 - pMother, 0], [pMother, 1]].forEach(([pm, m]) => {
    [[1 - pFather, 0], [pFather, 1]].forEach(([pf, f]) => {
      const c = m + f; outcomes[c] = (outcomes[c] || 0) + pm * pf;
    });
  });
  return Object.entries(outcomes).map(([c, p]) => ({ copies: +c, probability: p }));
}

// The visible label this gene contributes at a given copy count, or null if invisible.
// Simple dominant genes look the same at 1 or 2 copies (no "single/double factor" visual
// distinction); incomplete-dominant genes look genuinely different at every copy count.
function geneVisualLabel(gene, copies) {
  if (gene.inheritance === 'incompleteDominant') return gene.states[copies] || null;
  if (gene.inheritance === 'dominant') return copies >= 1 ? gene.label : null;
  return copies === 2 ? gene.label : null; // recessive or sexlinked-recessive
}

// Splits an owner-supplied "splits" column into this species' matching gene keys. Lets you
// record what a previous owner told you about a bird's known carrier status -- e.g. proven
// through pairings you don't have the pedigree for -- even when the pedigree we do have
// can't prove it. Free text, comma/slash/semicolon-separated, matched against each gene's
// label (e.g. "Cinnamon, Pied" or "Cinnamon / Pied").
function parseDeclaredSplits(bird, profile) {
  const raw = (bird.splits || '').toLowerCase();
  const declared = new Set();
  if (!raw.trim()) return declared;
  const tokens = raw.split(/[,/;]+/).map(t => t.trim()).filter(Boolean);
  profile.genes.forEach(g => {
    const label = g.label.toLowerCase();
    if (tokens.some(t => t === label || t.includes(label))) declared.add(g.key);
  });
  return declared;
}

// { copies, tag } for one bird at one gene. tag is 'visual' | 'split' | 'split-declared' |
// 'clear' | 'unknown' -- 'unknown' is treated as clear (copies: 0) for the headline
// prediction, flagged in the UI since it's an assumption, not a fact proven by the pedigree
// or declared by the owner.
function geneStatus(bird, gene, profile, allBirds) {
  const ownCopies = profile.parseVisualStates(mutationSourceText(bird))[gene.key] || 0;

  if (gene.inheritance === 'incompleteDominant') {
    return { copies: ownCopies, tag: ownCopies === 0 ? 'clear' : 'visual' }; // always fully visible, no hidden state
  }
  if (gene.inheritance === 'dominant') {
    if (ownCopies === 0) return { copies: 0, tag: 'clear' }; // not showing it is definitive
    return { copies: ownCopies, tag: 'visual' }; // showing it -- single/double factor assumed, not provable here
  }

  // recessive or sexlinked-recessive
  if (ownCopies === 2) return { copies: 2, tag: 'visual' };
  const sex = (bird.sex || '').trim().toUpperCase();
  if (gene.inheritance === 'sexlinked' && sex === 'F') {
    return { copies: 0, tag: 'clear' }; // a hen can't hide a sex-linked recessive
  }
  if (parseDeclaredSplits(bird, profile).has(gene.key)) {
    return { copies: 1, tag: 'split-declared' };
  }
  const children = allBirds.filter(c => c.motherID === bird.id || c.fatherID === bird.id);
  const provenSplit = children.some(c => (profile.parseVisualStates(mutationSourceText(c))[gene.key] || 0) === 2);
  if (provenSplit) return { copies: 1, tag: 'split' };
  return { copies: 0, tag: 'unknown' };
}

function statusOf(bird, profile, allBirds) {
  const status = {};
  profile.genes.forEach(g => { status[g.key] = geneStatus(bird, g, profile, allBirds); });
  return status;
}

// Full named-phenotype probability distribution for a hypothetical son or daughter.
function offspringDistribution(profile, motherStatus, fatherStatus, offspringSex) {
  let combos = [{ states: {}, probability: 1 }];
  profile.genes.forEach(g => {
    const dist = geneOffspringDistribution(g, motherStatus[g.key].copies, fatherStatus[g.key].copies, offspringSex);
    const next = [];
    combos.forEach(c => dist.forEach(d => {
      if (d.probability > 0) next.push({ states: { ...c.states, [g.key]: d.copies }, probability: c.probability * d.probability });
    }));
    combos = next;
  });

  const byName = new Map(); // combos with the same visible name (e.g. carrier vs clear) collapse together
  combos.forEach(c => {
    const name = profile.nameForStates(c.states);
    byName.set(name, (byName.get(name) || 0) + c.probability);
  });
  return [...byName.entries()]
    .map(([name, probability]) => ({ name, probability }))
    .filter(r => r.probability > 1e-9)
    .sort((a, b) => b.probability - a.probability);
}

function combineDistributions(sonDist, daughterDist) {
  const byName = new Map();
  sonDist.forEach(r => byName.set(r.name, (byName.get(r.name) || 0) + r.probability * 0.5));
  daughterDist.forEach(r => byName.set(r.name, (byName.get(r.name) || 0) + r.probability * 0.5));
  return [...byName.entries()].map(([name, probability]) => ({ name, probability })).sort((a, b) => b.probability - a.probability);
}

// Default naming: base name, plus every gene's visible label, in gene-list order.
function genericComposeName(genes, baseName, states) {
  const labels = genes.map(g => geneVisualLabel(g, states[g.key])).filter(Boolean);
  return labels.length ? labels.join(' ') : baseName;
}

// ----- Species profiles ----- //

function matchesSciOrCommonName(bird, { genus, species, subspeciesIncludes = [], speciesIncludes = [] }) {
  const g = (bird.scigenus || '').trim().toLowerCase();
  const s = (bird.scispecies || '').trim().toLowerCase();
  if (genus && species && g === genus && s === species) return true;
  if (!subspeciesIncludes.length || !speciesIncludes.length) return false;
  const sub = (bird.subspecies || '').trim().toLowerCase();
  const sp = (bird.species || '').trim().toLowerCase();
  return subspeciesIncludes.some(k => sub.includes(k)) && speciesIncludes.some(k => sp.includes(k));
}

const SPECIES_PROFILES = [
  // ----- Green-Cheek Conure (Pyrrhura molinae) ----- //
  {
    id: 'green-cheek-conure',
    label: 'Green-Cheek Conure',
    matches: bird => matchesSciOrCommonName(bird, {
      genus: 'pyrrhura', species: 'molinae', subspeciesIncludes: ['green'], speciesIncludes: ['conure'],
    }),
    genes: [
      { key: 'dilute', label: 'Dilute', inheritance: 'recessive' },
      { key: 'opaline', label: 'Opaline', inheritance: 'sexlinked' },
      { key: 'cinnamon', label: 'Cinnamon', inheritance: 'sexlinked' },
      { key: 'turquoise', label: 'Turquoise', inheritance: 'recessive' },
    ],
    baseName: 'Normal',
    nicknameBits: {
      'normal': '0000', 'turquoise': '0001', 'turqoise': '0001', 'turqouise': '0001',
      'cinnamon': '0010', 'turquoise cinnamon': '0011',
      'opaline': '0100', 'yellow sided': '0100', 'turquoise yellow sided': '0101',
      'pineapple': '0110', 'turquoise cinnamon yellow sided': '0111',
      'dilute': '1000', 'mint': '1001', 'dilute cinnamon': '1010', 'cinnamint': '1011',
      'dilute yellow sided': '1100', 'dillute yellow sided': '1100',
      'opamint': '1101', 'suncheek': '1110', 'mooncheek': '1111',
    },
    parseVisualStates(raw) {
      const bits = this.nicknameBits[raw];
      if (bits) return { dilute: +bits[0] * 2, opaline: +bits[1] * 2, cinnamon: +bits[2] * 2, turquoise: +bits[3] * 2 };
      return {
        dilute: /dilut/.test(raw) ? 2 : 0,
        opaline: (/opalin/.test(raw) || /yellow ?sided/.test(raw)) ? 2 : 0,
        cinnamon: /cinnamon/.test(raw) ? 2 : 0,
        turquoise: /turqu?o?ise/.test(raw) ? 2 : 0,
      };
    },
    nameForStates(states) { return genericComposeName(this.genes, this.baseName, states); },
  },

  // ----- Cockatiel (Nymphicus hollandicus) ----- //
  {
    id: 'cockatiel',
    label: 'Cockatiel',
    matches: bird => matchesSciOrCommonName(bird, {
      genus: 'nymphicus', species: 'hollandicus', speciesIncludes: ['cockatiel'],
    }),
    genes: [
      { key: 'pied', label: 'Pied', inheritance: 'recessive' },
      { key: 'whiteface', label: 'Whiteface', inheritance: 'recessive' },
      { key: 'fallow', label: 'Fallow', inheritance: 'recessive' },
      { key: 'cinnamon', label: 'Cinnamon', inheritance: 'sexlinked' },
      { key: 'pearl', label: 'Pearl', inheritance: 'sexlinked' },
      { key: 'lutino', label: 'Lutino', inheritance: 'sexlinked' },
      { key: 'silver', label: 'Silver', inheritance: 'incompleteDominant', states: [null, 'Single Factor Silver', 'Double Factor Silver'] },
    ],
    baseName: 'Normal Grey',
    parseVisualStates(raw) {
      return {
        pied: /\bpied\b/.test(raw) ? 2 : 0,
        whiteface: /white ?face/.test(raw) ? 2 : 0,
        fallow: /fallow/.test(raw) ? 2 : 0,
        cinnamon: /cinnamon/.test(raw) ? 2 : 0,
        pearl: /pearl/.test(raw) ? 2 : 0,
        lutino: /lutino/.test(raw) ? 2 : 0,
        silver: /silver/.test(raw) ? (/double/.test(raw) ? 2 : 1) : 0,
      };
    },
    nameForStates(states) { return genericComposeName(this.genes, this.baseName, states); },
  },

  // ----- Indian Ringneck Parakeet (Psittacula krameri) ----- //
  {
    id: 'indian-ringneck',
    label: 'Indian Ringneck Parakeet',
    matches: bird => matchesSciOrCommonName(bird, {
      genus: 'psittacula', species: 'krameri', subspeciesIncludes: ['ringneck'], speciesIncludes: ['parakeet'],
    }),
    genes: [
      { key: 'blue', label: 'Blue', inheritance: 'recessive' },
      { key: 'pied', label: 'Pied', inheritance: 'recessive' },
      { key: 'dilute', label: 'Dilute', inheritance: 'recessive' },
      { key: 'grey', label: 'Grey', inheritance: 'dominant' },
      { key: 'cinnamon', label: 'Cinnamon', inheritance: 'sexlinked' },
      { key: 'lutino', label: 'Lutino', inheritance: 'sexlinked' },
    ],
    baseName: 'Green',
    parseVisualStates(raw) {
      return {
        blue: /\bblue\b/.test(raw) ? 2 : 0,
        pied: /\bpied\b/.test(raw) ? 2 : 0,
        dilute: /dilut/.test(raw) ? 2 : 0,
        grey: /\bgrey\b|\bgray\b|slaty/.test(raw) ? 1 : 0,
        cinnamon: /cinnamon/.test(raw) ? 2 : 0,
        lutino: /lutino/.test(raw) ? 2 : 0,
      };
    },
    nameForStates(states) {
      const base = states.blue === 2 ? 'Blue' : this.baseName;
      const others = this.genes.filter(g => g.key !== 'blue').map(g => geneVisualLabel(g, states[g.key])).filter(Boolean);
      return others.length ? `${base} ${others.join(' ')}` : base;
    },
  },

  // ----- Peach-Faced Lovebird (Agapornis roseicollis) ----- //
  {
    id: 'peachfaced-lovebird',
    label: 'Peach-Faced Lovebird',
    matches: bird => matchesSciOrCommonName(bird, {
      genus: 'agapornis', species: 'roseicollis', subspeciesIncludes: ['peach'], speciesIncludes: ['lovebird'],
    }),
    genes: [
      { key: 'blue', label: 'Blue', inheritance: 'recessive' },
      { key: 'darkFactor', label: 'Dark Factor', inheritance: 'incompleteDominant', states: [null, null, null] }, // resolved jointly with blue below
      { key: 'violet', label: 'Violet', inheritance: 'incompleteDominant', states: [null, 'Violet', 'Full Violet'] },
      { key: 'pied', label: 'Pied', inheritance: 'recessive' },
      { key: 'pallid', label: 'Pallid', inheritance: 'recessive' },
      { key: 'cinnamon', label: 'Cinnamon', inheritance: 'sexlinked' },
    ],
    baseName: 'Normal',
    // Blue x Dark Factor is a classic joint-named 2-gene grid, not two independent labels.
    colorGrid: {
      '0,0': 'Normal', '0,1': 'Olive', '0,2': 'Jade',
      '2,0': 'Blue', '2,1': 'Cobalt', '2,2': 'Mauve',
    },
    parseVisualStates(raw) {
      const gridMatch = Object.entries({
        normal: [0, 0], green: [0, 0], olive: [0, 1], jade: [0, 2], 'deep olive': [0, 2],
        blue: [2, 0], cobalt: [2, 1], mauve: [2, 2],
      }).find(([word]) => new RegExp(`\\b${word}\\b`).test(raw));
      const [blue, darkFactor] = gridMatch ? gridMatch[1] : [/\bblue\b/.test(raw) ? 2 : 0, 0];
      return {
        blue, darkFactor,
        violet: /violet/.test(raw) ? (/full/.test(raw) ? 2 : 1) : 0,
        pied: /\bpied\b/.test(raw) ? 2 : 0,
        pallid: /pallid/.test(raw) ? 2 : 0,
        cinnamon: /cinnamon/.test(raw) ? 2 : 0,
      };
    },
    nameForStates(states) {
      const base = this.colorGrid[`${states.blue === 2 ? 2 : 0},${states.darkFactor}`] || this.baseName;
      const others = this.genes
        .filter(g => g.key !== 'blue' && g.key !== 'darkFactor')
        .map(g => geneVisualLabel(g, states[g.key])).filter(Boolean);
      return others.length ? `${base} ${others.join(' ')}` : base;
    },
  },

  // ----- Gouldian Finch (Chloebia gouldiae) ----- //
  // Core 3-gene model (head/body/breast color); doesn't cover rarer factors like Dilute or
  // Lightback.
  {
    id: 'gouldian-finch',
    label: 'Gouldian Finch',
    matches: bird => matchesSciOrCommonName(bird, {
      genus: 'chloebia', species: 'gouldiae', speciesIncludes: ['gouldian'],
    }),
    genes: [
      { key: 'redHead', label: 'Red-Headed', inheritance: 'sexlinked' },
      { key: 'blueBody', label: 'Blue', inheritance: 'recessive' },
      { key: 'whiteBreast', label: 'White-Breasted', inheritance: 'recessive' },
    ],
    baseName: 'Black-Headed Green',
    parseVisualStates(raw) {
      // Yellow/orange-headed is Red-Headed + Blue body combined, not text containing
      // "red" or "blue" -- has to be recognized as its own phenotype name first.
      if (/yellow.?head|orange.?head/.test(raw)) {
        return { redHead: 2, blueBody: 2, whiteBreast: /white.?breast/.test(raw) ? 2 : 0 };
      }
      return {
        redHead: /red.?head/.test(raw) ? 2 : 0,
        blueBody: /\bblue\b/.test(raw) ? 2 : 0,
        whiteBreast: /white.?breast/.test(raw) ? 2 : 0,
      };
    },
    nameForStates(states) {
      // Yellow/orange-headed is Red-Headed + Blue body combined, not its own gene.
      const head = states.redHead === 2
        ? (states.blueBody === 2 ? 'Yellow-Headed' : 'Red-Headed')
        : 'Black-Headed';
      const body = states.blueBody === 2 ? 'Blue' : 'Green';
      const breast = states.whiteBreast === 2 ? 'White-Breasted' : null;
      return [head, body, breast].filter(Boolean).join(' ');
    },
  },
];

function matchSpeciesProfile(bird) {
  return SPECIES_PROFILES.find(p => p.matches(bird)) || null;
}


function geneStatusLabel(tag) {
  return { visual: 'visual', split: 'split (proven)', 'split-declared': 'split (declared)', clear: 'clear', unknown: 'clear (unproven)' }[tag] || tag;
}

// ---- ready-made answers for the screens ----

// Every outcome name this profile can produce (so a picker only offers real ones).
function outcomeNames(profile) {
  var combos = [{}];
  profile.genes.forEach(function (g) {
    var next = [];
    combos.forEach(function (c) { [0, 1, 2].forEach(function (v) { var o = Object.assign({}, c); o[g.key] = v; next.push(o); }); });
    combos = next;
  });
  var names = {};
  combos.forEach(function (c) { names[profile.nameForStates(c)] = true; });
  return Object.keys(names).sort();
}

// The likely chicks of mother x father: the combined odds, plus sons and daughters separately.
function predictPair(mother, father, profile, allNodes) {
  var motherStatus = statusOf(mother, profile, allNodes);
  var fatherStatus = statusOf(father, profile, allNodes);
  var sons = offspringDistribution(profile, motherStatus, fatherStatus, 'son');
  var daughters = offspringDistribution(profile, motherStatus, fatherStatus, 'daughter');
  return {
    motherStatus: motherStatus, fatherStatus: fatherStatus, sons: sons, daughters: daughters,
    combined: combineDistributions(sons, daughters),
    anyUnknown: profile.genes.some(function (g) { return motherStatus[g.key].tag === 'unknown' || fatherStatus[g.key].tag === 'unknown'; }),
    hasSexLinked: profile.genes.some(function (g) { return g.inheritance === 'sexlinked'; }),
  };
}

// Opposite-sex birds of the same species ranked by their chance of producing the wanted outcome with `bird`.
function rankMates(bird, profile, desiredName, allNodes, limit) {
  var sex = bird.sex;
  if (!sex) return null;
  var out = [];
  allNodes.forEach(function (other) {
    if (other.id === bird.id || !other.sex || other.sex === sex) return;
    var p = matchSpeciesProfile(other);
    if (!p || p.id !== profile.id) return;
    var mother = sex === 'F' ? bird : other, father = sex === 'F' ? other : bird;
    var m = predictPair(mother, father, profile, allNodes).combined.filter(function (r) { return r.name === desiredName; })[0];
    if (m && m.probability > 0.001) out.push({ other: other, probability: m.probability });
  });
  out.sort(function (a, b) { return b.probability - a.probability; });
  return out.slice(0, limit || 6);
}

return {
  profiles: SPECIES_PROFILES, matchSpeciesProfile: matchSpeciesProfile, statusOf: statusOf, outcomeNames: outcomeNames,
  predictPair: predictPair, rankMates: rankMates, geneStatusLabel: geneStatusLabel,
};
})();
