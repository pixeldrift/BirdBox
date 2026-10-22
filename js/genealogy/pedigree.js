// Pedigree maths for the Genealogy tools — adapted from the Tree of Birds project, working on BirdBox's
// real birds instead of a spreadsheet. Nodes are plain objects built from BIRDS_SAMPLE:
//   { id, name, sex ('M' | 'F' | ''), motherID, fatherID, mutation, splits, scigenus, scispecies, species, subspecies, bird }
// Provides the coefficient of inbreeding (F) and relatedness (R) of a pairing, a plain-language
// description of how two birds are related, and the 'safe to breed' tiers.
const Pedigree = (function () {
  function sexCode(bird) {
    var s = String(bird.sex || '').toLowerCase();
    return s === 'male' ? 'M' : s === 'female' ? 'F' : '';
  }

  function toNode(bird) {
    var sci = String(bird.scientificName || '').split(/\s+/);
    return {
      id: bird.id, name: bird.name || bird.band || bird.speciesName || bird.species || 'Bird', sex: sexCode(bird),
      motherID: bird.motherId || '', fatherID: bird.fatherId || '',
      mutation: bird.mutation || '', splits: bird.splits || '',
      scigenus: sci[0] || '', scispecies: sci[1] || '',
      species: bird.speciesName || bird.species || '', subspecies: bird.subspecies || '',
      bird: bird,
    };
  }

  // Every bird as a pedigree node (optionally only some), and the lookup by id.
  function nodes(filter) {
    return BIRDS_SAMPLE.filter(filter || function () { return true; }).map(toNode);
  }

  function index(list) {
    var by = {};
    list.forEach(function (n) { by[n.id] = n; });
    return by;
  }

  // ---- ancestry ----
// Map of ancestorId -> minimal number of generations above `id` (breadth-first, so the
// first depth recorded for an ancestor is always the shortest path to them).
function ancestorDepths(id, byId, maxDepth) {
  maxDepth = maxDepth || 10;
  const depths = new Map();
  let frontier = [id];
  for (let depth = 1; frontier.length && depth <= maxDepth; depth++) {
    const next = [];
    frontier.forEach(curId => {
      const b = byId[curId];
      if (!b) return;
      [b.motherID, b.fatherID].forEach(pid => {
        if (pid && byId[pid] && pid !== id && !depths.has(pid)) {
          depths.set(pid, depth);
          next.push(pid);
        }
      });
    });
    frontier = next;
  }
  return depths;
}

function isConsanguineous(motherID, fatherID, byId) {
  if (!motherID || !fatherID) return false;
  if (motherID === fatherID) return true;
  const mAnc = ancestorDepths(motherID, byId), fAnc = ancestorDepths(fatherID, byId);
  if (mAnc.has(fatherID) || fAnc.has(motherID)) return true; // parent paired with own ancestor
  for (const a of mAnc.keys()) if (fAnc.has(a)) return true; // shared ancestor on both sides
  return false;
}


  // ---- inbreeding and relatedness ----
function computeGenerationDepths(byId) {
  const depth = {};
  function d(id) {
    if (id in depth) return depth[id];
    depth[id] = 0; // guards against a malformed cyclic reference while resolving
    const b = byId[id];
    if (!b) return (depth[id] = 0);
    const fatherD = b.fatherID && byId[b.fatherID] ? d(b.fatherID) : -1;
    const motherD = b.motherID && byId[b.motherID] ? d(b.motherID) : -1;
    return (depth[id] = Math.max(fatherD, motherD) + 1);
  }
  Object.keys(byId).forEach(d);
  return depth;
}

function kinshipCoefficient(aId, bId, byId, depthOf, memo) {
  if (!aId || !bId || !byId[aId] || !byId[bId]) return 0;
  const key = aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;
  if (memo.has(key)) return memo.get(key);

  let result;
  if (aId === bId) {
    const bird = byId[aId];
    result = 0.5 * (1 + kinshipCoefficient(bird.fatherID, bird.motherID, byId, depthOf, memo));
  } else {
    const expandId = (depthOf[aId] ?? 0) >= (depthOf[bId] ?? 0) ? aId : bId;
    const otherId = expandId === aId ? bId : aId;
    const expand = byId[expandId];
    result = !expand.fatherID && !expand.motherID ? 0 : 0.5 * (
      kinshipCoefficient(expand.fatherID, otherId, byId, depthOf, memo) +
      kinshipCoefficient(expand.motherID, otherId, byId, depthOf, memo)
    );
  }
  memo.set(key, result);
  return result;
}

// F: inbreeding coefficient of a hypothetical offspring of A and B.
// R: coefficient of relatedness between A and B themselves.
function calculateCoi(aId, bId, byId) {
  const depthOf = computeGenerationDepths(byId);
  const memo = new Map();
  const F = kinshipCoefficient(aId, bId, byId, depthOf, memo);
  const a = byId[aId], b = byId[bId];
  const Fa = kinshipCoefficient(a.fatherID, a.motherID, byId, depthOf, memo);
  const Fb = kinshipCoefficient(b.fatherID, b.motherID, byId, depthOf, memo);
  const denom = Math.sqrt((1 + Fa) * (1 + Fb));
  return { F, R: denom > 0 ? (2 * F) / denom : 0 };
}

function describeRelationship(aId, bId, byId) {
  const a = byId[aId], b = byId[bId];
  const describeDirect = (n, ancestorName, descendantName) => {
    if (n === 1) return `${descendantName} is a direct offspring of ${ancestorName} — they are parent and offspring.`;
    if (n === 2) return `${descendantName} is a grandchild of ${ancestorName} — they are grandparent and grandchild.`;
    return `${descendantName} is a descendant of ${ancestorName}, ${n} generations back.`;
  };

  const ancA = ancestorDepths(aId, byId);
  const ancB = ancestorDepths(bId, byId);
  if (ancA.has(bId)) return describeDirect(ancA.get(bId), b.name, a.name);
  if (ancB.has(aId)) return describeDirect(ancB.get(aId), a.name, b.name);

  const sameMother = a.motherID && a.motherID === b.motherID;
  const sameFather = a.fatherID && a.fatherID === b.fatherID;
  if (sameMother && sameFather) return "These two birds are full siblings — they share the same mother and father.";
  if (sameMother || sameFather) return "These two birds are half-siblings — they share one parent.";

  let closest = null;
  ancA.forEach((dA, id) => {
    if (ancB.has(id)) {
      const dB = ancB.get(id);
      if (!closest || dA + dB < closest.dA + closest.dB) closest = { id, dA, dB };
    }
  });

  if (closest) {
    const ancestor = byId[closest.id];
    const { dA, dB } = closest;
    if (dA + dB === 3) { // one generation on one side, two on the other
      return `These two birds share a grandparent (${ancestor.name}) — one is the other's aunt/uncle.`;
    }
    if (dA === 2 && dB === 2) {
      return `These two birds share a grandparent (${ancestor.name}).`;
    }
    return `These two birds share a common ancestor, ${ancestor.name}, ${dA} generation(s) back on one side and ${dB} on the other.`;
  }

  return "No shared ancestry was found between these two birds in the available pedigree.";
}

  // How worried to be about a pairing, from the coefficient of inbreeding F (as a percent).
  function tier(Fpct) {
    if (Fpct < 3) return { id: 'safe', label: 'Safe to breed' };
    if (Fpct < 12.5) return { id: 'caution', label: 'Caution: mild inbreeding risk' };
    if (Fpct < 25) return { id: 'warning', label: 'Warning: significant health risks likely' };
    return { id: 'danger', label: 'Warning: serious health problems could result' };
  }

  return {
    toNode: toNode, nodes: nodes, index: index, ancestorDepths: ancestorDepths, isConsanguineous: isConsanguineous,
    computeGenerationDepths: computeGenerationDepths, calculateCoi: calculateCoi, describeRelationship: describeRelationship, tier: tier,
  };
})();
