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

## Persistent storage / backend

Everything built so far (Birds, Contacts, Accounting, Health) lives in in-memory sample arrays
(`js/data/*.js`) — edits made while using the app (e.g. adding a Health Record, or a bird photo)
work for real but reset on page reload since there's no backend or local persistence yet. Health
Record and bird-photo uploads specifically use `URL.createObjectURL()`, which only lives for the
current tab session. Before this app is used for real records, it needs either a backend (with
real file storage for attachments) or at least local persistence (IndexedDB) as a stopgap.

## More icon packs / artwork

User uploaded two image folders to `src/images/`: **TeraTiger** (named files, fewer species) and
**Birdorable** (many more images, but unreadable CDN hash filenames with no ground truth).

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

- **Birdorable — done for the species identified so far.** Built as the `birdorable`
  ("Birdorable") pack in `ICON_PACKS`, referencing `src/images/Birdorable/Parrots-Parakeets/`
  directly. Filenames there are garbled CDN hashes (e.g. `01nc3s7f...@2x.webp`) with no species
  info in the filename itself — solved by cross-referencing: the user saved 18 pages of
  `birdorable.com/meet?page=N` as `.html` (now in `src/images/Birdorable/`), whose markup embeds
  the *same* CDN hash per bird thumbnail next to its species name/slug, so the hash is the join
  key, no visual guessing needed. `src/images/Birdorable/species-map.json` is the durable result
  of that match (hash → species/slug/meetUrl) — 85 unique species identified from 89 of 109 local
  files (4 more were duplicate downloads of an already-matched hash). The pack itself uses 79 of
  those 85: 21 node-level generic icons plus 68 `subspeciesOverrides` mapping Birdorable's species
  names onto our Species|Subspecies convention (far richer than `teratiger` per node, since
  Birdorable draws many species per genus — e.g. all 12 macaw species, not just one generic
  macaw). Six new taxonomy nodes came with it: `lory`, `rosella`, `pionus-parrot`, `vasa-parrot`,
  `kea`, `pesquets-parrot`, plus standalone `kakapo`. See docs/data-model.md and the comment above
  the `birdorable` entry in `js/data/icon-taxonomy.js` for the 6 matched-but-unused species and
  why (real taxonomic edge cases, not oversights).

  **Still open**: 20 of the 109 local files are unresolved — every saved page was missing the
  same last 20-of-70 thumbnails (lazy-load hadn't scrolled them into view before the page was
  saved, so their hash never made it into the HTML). Re-saving those pages scrolled to the
  bottom, or fetching `meet?page=N` directly, would close the gap — direct fetches to
  `birdorable.com` were still blocked by the environment's egress proxy as of this writing even
  after the user set network access to allow all domains (worth retrying; may need a fresh
  session for the setting to take effect, per `read_documentation`'s `environment.network` page).
  **When more Birdorable images or `meet`/`families` page saves are uploaded — the user has more
  categories beyond Parrots-Parakeets not yet uploaded — re-run the same hash-matching script
  (hash = filename minus `@2x`/`-N`/`.webp`) rather than re-identifying by hand**, then extend the
  `birdorable` pack's `icons`/`subspeciesOverrides` the same way. Per the user, the intent here is
  a **cross-promotional partnership** — credit + a shop link back to Birdorable (the `meetUrl`
  already captured per species) so users can buy real merch matching their own birds, not just
  using the art for free — worth confirming/formalizing that relationship before this pack ships
  to real users.

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
