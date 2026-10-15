# BirdBox Roadmap

Running list of features that are planned but not yet built, beyond what's already sketched as
placeholder screens in `js/nav-data.js`.

## Printing

Physical, printable outputs generated from BirdBox records — distinct from on-screen labels
(the `Labels` screen under My Birds is currently just a nav placeholder for this).

- **Bird/cage labels** — small printable labels for individual birds or cage fronts.
- **Cage cards** — a printable card per cage, including a **QR code linking to that bird's (or
  cage's) info** for quick lookup by scanning.
- **Instructions** — printable care/feeding instructions (ties into Cages.Feeding and
  FeedWater from the data model).
- **Shipping labels** — generated from the Shipping/Waybill data (carrier, waybill #, departing/
  arriving airport, client address).

User has real-world examples to share (from prior tooling) before this gets designed — hold off
on building until those arrive.

Likely touches: My Birds → Labels, Aviary → Caging, Business → Shipping.

## Feed/Water, Supplies, Cleaning, Tasks (deprioritized)

Per user: full inventory/feeding-schedule tracking, supply management, and multi-user/employee
caretaking workflows are for a much larger multi-person operation and are a less common scenario
for now — pushed further down the list than originally scoped. Caging itself stayed in (built
light, grouped from `Birds.cage` — see docs/data-model.md) but these four stay nav placeholders
until there's real demand for them.

## Granular (field-level) privacy

Registry -> Search currently uses one coarse flag (`Birds.registryPublic`) that exposes a fixed
set of fields (band #, species/subspecies/mutation, sex, hatch date, public lineage) and always
hides another fixed set (owner, notes, cost/price). Per user, this needs to grow into **granular
permissions** — choosing *which* fields are public, member-only, or private per bird (or per
field), echoing the privacy tiers already sketched in `bird_registry.html` (Public/Members/
Limited/Specific/Private/Custom). The current boolean is the on/off case of that spectrum, not a
different feature — extend it rather than replacing it.

## Linked data / modular architecture (vision)

Per user: "everything will be modular and aware of everything else... everything is linked
data." The Registry toggle is the first concrete instance of the pattern this points toward — a
bird's public registry entry isn't separately maintained data, it's the *same* Bird record with
a visibility flag, read live by whatever screen needs it. The vision is for **Classifieds**
listings and **Lost & Found** alerts to work the same way: posting a bird for sale or reporting
it lost should link to its existing Bird record (and inherit/extend its privacy settings) rather
than duplicating band #, species, photos, etc. into a separate listing. Keep this in mind as
Classifieds and Registry -> Lost & Found get built — reach for "link to the existing record" over
"re-enter the data" by default.

## Data linking / import-mapping tool (separate project — integrate later)

The user is building a **separate data-linking tool** that matches data fields between formats
and lets you visually map/transfer them. Plan to integrate it here eventually rather than grow a
bespoke importer. Where it would plug in:

- **Birds -> Import CSV** (`js/screens/birds-add.js`) today only accepts BirdBox's own template
  (headers matched case/space-insensitively, nothing else). With the linking tool, a breeder could
  upload *any* spreadsheet (AviMate export, their own sheet, the old Airtable base), visually map
  its columns onto BirdBox fields, and feed the result through the same validation/preview step
  and `POST /api/birds` batch endpoint — those pieces are already field-mapping-agnostic.
- Same idea for the other record types (Contacts, Transactions, Health, Waybills) once they get
  add/import flows, and for **export** to other formats.
- `js/csv.js` is deliberately generic (parse/stringify/download) so it can be shared.

Not started — hold until the tool exists; don't build a column-mapping UI here in the meantime.

## Add / import for the other record types

Birds now has an add form and CSV batch import. Contacts, Transactions, Waybills, and Buildings
are still read-only screens with no way to add records through the app (Health has an add form
but no import). Follow the same pattern: `POST` on the existing `/api/*` endpoint accepting one
or an array, shared client/server validation, preview-before-commit import.

## Species lists & taxonomy (needs a real plan before the species lookup is built)

Per the user: Species/Subspecies/Mutation must become a lookup table (filter-as-you-type, most
popular / recently used first) rather than free text, but there's no definitive taxonomy to copy.
Points to settle in the plan:

- **No single source of truth.** Classifications are debated and names vary (the app already hit
  this: "Sun Conure" vs Birdorable's "Sun Parakeet", "Quaker" vs "Monk Parakeet", "Indian Ringneck"
  vs "Rose-ringed Parakeet"). The data structure needs **alternate names** as first-class data —
  likely a names table (species id, name, kind: preferred/common/trade/regional/historical,
  source) plus scientific-name synonyms — and a record of which taxonomy/version a species came
  from, so annual revisions don't break existing birds.
- **Where to draw the line.** Don't load every bird in the world into the working list. Note that
  storage isn't the real constraint — a full world list (~11k species) is tiny for Postgres; the
  Airtable slowdown was linked-record UI. What needs limiting is what the picker *shows*: an
  "aviculture" tier (parrots, finches, pigeons/doves, waterfowl, poultry/gamefowl, softbills,
  ratites, falconry raptors) as the default list, ranked by popularity and the user's own recent
  use, with the rest of the world reachable by search and promoted into the user's list on first
  use. Decide this with the user, with real breeders' species in hand.
- **Aviculture groupings are separate from taxonomy** (already modeled: `TAXONOMY_NODES`), and
  **mutations are aviculture-specific** — no reference list covers them, so they're our own table.
- **Migration:** existing free-text Species/Subspecies/Mutation values need mapping onto the new
  records (the names table is how); the add-bird form, CSV import and icon packs should all resolve
  through species ids.
- **Candidate sources already in hand:** `IOC_Names_File_Plus-12.1.Red.Draft.xlsx` and
  `Bird Species Master List.txt` / `Bird Species.tsv` in the repo root, and the 840 Birdorable names
  in `species-map.json`. Outside: the eBird/Clements taxonomy (free API, stable species codes).
- **Taxonomy/icon gaps to fill when this happens:** pigeon and dove nodes (not in
  `TAXONOMY_NODES` yet), finch subgroups.

## Birds of the World (Cornell Lab) — reference + possible partnership

Birds of the World is the primary reference the user wants to align with: a vast species database
with illustrations for nearly every bird, and (like Birdorable) a potential cross-promotional
partner. Open questions, none verified yet:

- **Link out, don't copy.** Store a stable species code per species and link to its Birds of the
  World page for details; no duplicated content. Hotlinking/embedding their *illustrations* as an
  icon pack is a different matter — it needs their permission (content is licensed, and access may
  be subscription-gated or technically blocked). Treat it as a partnership/licensing conversation
  with the Cornell Lab, not an engineering workaround. If agreed, an icon pack can be a pure
  reference (species code -> their image URL) with nothing copied into our repo.
- Check whether the eBird/Clements species codes used by Birds of the World are the right key for
  our species table.

## Persistent storage / backend

Everything built so far (Birds, Contacts, Accounting, Health) lives in in-memory sample arrays
(`js/data/*.js`) — edits made while using the app (e.g. adding a Health Record, or a bird photo)
work for real but reset on page reload since there's no backend or local persistence yet. Health
Record and bird-photo uploads specifically use `URL.createObjectURL()`, which only lives for the
current tab session. Before this app is used for real records, it needs either a backend (with
real file storage for attachments) or at least local persistence (IndexedDB) as a stopgap.

## More icon packs / artwork

User uploaded two image folders to `src/images/`: **TeraTiger** (named files, fewer species) and
**Birdorable** (hundreds of species, now matched to names via `species-map.json`).

- **TeraTiger — done.** Built as the `teratiger` ("Hand-Drawn") pack in `ICON_PACKS`
  (`js/data/icon-taxonomy.js`), referencing files directly from `src/images/TeraTiger/` (no
  copying needed, the repo is served statically). Covers 17 species-level nodes plus exact
  subspecies/mutation portraits for 5 sample birds — see docs/data-model.md for the full list.
  Seven new taxonomy leaf nodes were added to fit its coverage (`budgie`, `parrotlet`, `quaker`,
  `linnie`, `kakariki`, `bourkes-parakeet`, `poicephalus`), and `SPECIES_NODE` was filled out to
  cover every species-level node in the tree rather than just the sample data's six. Its
  `Conures/` source folder turned out to be an Etsy marketing screenshot, not usable icons, so
  there's no conure art in this pack — a real gap since Conure is the most common species in the
  sample data.

- **Birdorable — done, and growing.** Built as the `birdorable` ("Birdorable") pack in
  `ICON_PACKS`, using the 200x200 PNGs in `src/images/Birdorable/Birds/` (named for each species)
  and the user-maintained `src/images/Birdorable/species-map.json` (original hash filename →
  species, slug, `meetUrl`, clean file name). 840 species mapped; the pack uses ~140 of them:
  52 node-level icons and 90 `subspeciesOverrides`, covering every parrot we have a node for plus a
  representative icon for most other groups (raptors, gulls, waterfowl, ratites, toucans, ...).
  Adding more is a data change: new taxonomy node (if needed) + `icons`/`subspeciesOverrides`
  entries. About 700 mapped species are not wired in yet because they have no taxonomy node; pick
  the groups that matter to the user's breeders. Per the user: **finches and pigeons/doves** are
  commonly kept (add nodes + icons for those); wild/native songbirds are rare in aviculture, so skip them.
  Per the user, the intent is a **cross-promotional partnership** — credit + a shop link back to
  Birdorable (`meetUrl` per species) so users can buy matching merch for their birds — worth
  confirming/formalizing that relationship before this pack ships to real users.

The switching architecture (`ICON_PACKS`, picker at Account → Settings → Icon Style) needs no
further changes for a third pack — same pattern as `teratiger`: a new entry with id/label/
description + a `TAXONOMY_NODES`-keyed `icons` map, no resolver or screen changes, no obligation
to cover every node.

Separately, even the current `line` pack only covers the 17 species already drawn in
`NestBox Icons.psd` — most nodes are intentionally `icon: null` there too. Worth illustrating
over time within that pack, roughly in priority order: (1) subspecies/mutation-level icons for
whichever birds actually get photographed least often in real use (photos always win over the
taxonomy icon, so this matters most for birds without photos), (2) missing species-level icons
already referenced in the tree (Parakeet, Amazon, African Grey, Eclectus, Lovebird, Cockatiel,
Caique all currently fall back to a size class), (3) the two acknowledged gaps with no icon at
any level in their branch in any pack — Bird of Prey and Sea Bird.

## Production (build last)

Recordkeeping for the breeding side: clutches, egg collection, and hatching, plus graphs/
reporting on top of that data (matches the product doc's example: "What DYH Amazon babies did
we have in February two years ago?"). User wants this built **last** among the remaining My
Birds/Aviary/Business screens — it's a bigger lift than the others (more interconnected
record-keeping, plus charts) and everything else should land first.

Likely shape, based on the pattern so far: a Clutch entity (pair/parents, date laid, egg count,
expected hatch date) with Eggs or hatch outcomes recorded per clutch (fertile/clear/hatched/
didn't hatch), rolling up into production stats per bird/pair/species/season.

Business → Reports now exists (KPIs + income/expense/category charts, built per the `dataviz`
skill — see `js/screens/reports.js`) so Production's reporting is an extension of that same
screen/method, not a new one: add production charts alongside the financial ones rather than
building a separate reports surface.

Likely touches: My Birds → Production, Business → Reports.

## Genealogy tree, inbreeding calculator, genetics predictor

User is building these as a **separate project** and may merge it into BirdBox later. Do **not**
build these out here — leave `My Birds → Genealogy` and `My Birds → Genetics` as nav
placeholders (per `js/nav-data.js`) until that merge happens or the user says otherwise. The
`Birds` screen's Mother/Father/Paired/Offspring links (see `js/screens/birds.js`) already cover
basic genealogy navigation and are the data these features would eventually build on.
