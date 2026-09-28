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

## Persistent storage / backend

Everything built so far (Birds, Contacts, Accounting, Health) lives in in-memory sample arrays
(`js/data/*.js`) — edits made while using the app (e.g. adding a Health Record) work for real
but reset on page reload since there's no backend or local persistence yet. Health Record file
uploads specifically use `URL.createObjectURL()`, which only lives for the current tab session.
Before this app is used for real records, it needs either a backend (with real file storage for
attachments) or at least local persistence (IndexedDB) as a stopgap.

## Production (build last)

Recordkeeping for the breeding side: clutches, egg collection, and hatching, plus graphs/
reporting on top of that data (matches the product doc's example: "What DYH Amazon babies did
we have in February two years ago?"). User wants this built **last** among the remaining My
Birds/Aviary/Business screens — it's a bigger lift than the others (more interconnected
record-keeping, plus charts) and everything else should land first.

Likely shape, based on the pattern so far: a Clutch entity (pair/parents, date laid, egg count,
expected hatch date) with Eggs or hatch outcomes recorded per clutch (fertile/clear/hatched/
didn't hatch), rolling up into production stats per bird/pair/species/season. The reporting
piece should follow the `dataviz` skill when it's built.

Likely touches: My Birds → Production, Business → Reports.

## Genealogy tree, inbreeding calculator, genetics predictor

User is building these as a **separate project** and may merge it into BirdBox later. Do **not**
build these out here — leave `My Birds → Genealogy` and `My Birds → Genetics` as nav
placeholders (per `js/nav-data.js`) until that merge happens or the user says otherwise. The
`Birds` screen's Mother/Father/Paired/Offspring links (see `js/screens/birds.js`) already cover
basic genealogy navigation and are the data these features would eventually build on.
