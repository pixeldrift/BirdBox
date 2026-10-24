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

**Status:** stages 1 and 2 are built (see docs/data-model.md): the species and alternate-names
tables, the eBird seed, US display names, typo-tolerant search, birds linked to species, the picker
in the add form, name matching in CSV import, Birds of the World links, and species-keyed icons.
Still open: the add-bird form is the only place that uses the picker (an edit-bird screen would
need it too); domestic breeds and forms with no eBird code (Pekin Duck, Embden Goose, Faverolles,
society finches, fancy pigeons) need their own records linked to a parent species; the
first-guess `aviculture` rules, display names and `POPULAR` list in `scripts/` need review with real
breeders; popularity should come from real usage; the yearly taxonomy-update procedure (species
splits mint new codes); family-level Birds of the World links; a code per Birdorable image beyond
the 813 matched. Review the US display names in `scripts/species-aliases.js` (e.g. "African Grey"
vs "African Gray", "Blue-and-gold Macaw") — they are suggestions.

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
  in `species-map.json`. Outside: the eBird/Clements taxonomy (see the Birds of the World section — chosen as the canonical ID).
- **Taxonomy/icon gaps to fill when this happens:** pigeon and dove nodes (not in
  `TAXONOMY_NODES` yet), finch subgroups.

## Mutations & genetics reference (BOW doesn't cover these)

Birds of the World gives us species, scientific names and taxonomy, but not aviculture
**mutations**, so the mutation list is either our own table or a reference to an outside source.
Things any design has to handle:

- **Names are species-specific.** The same name can be a different gene (or a different mode of
  inheritance) in different species — "Pied" is recessive in some and dominant in others — so a
  mutation record is keyed by species (or species group) plus name, not by name alone.
- **Inheritance data is the valuable part** for the user's separate genetics predictor: mode
  (autosomal recessive / dominant / incomplete dominant / sex-linked), which locus or allele it
  belongs to, and how mutations combine into visual forms (split, double factor, compound).
- **Aliases again:** Cinnamon/Fawn, regional and breeder-association names — same names-table idea
  as species.
- Each mutation should carry a `source` and an external reference so we can link out and credit.

Sources the user named — Gencalc, Mutabase, Dribbr, One Odd Bird, Avibase, B10K. I haven't
evaluated any of them. My understanding is that Avibase is a names/synonyms and checklist-crosswalk
database (more useful for alternate species names and taxonomy disagreements than for mutations)
and B10K is a genome-sequencing/phylogeny project (probably not a source of mutation names). For
each candidate, before depending on it, check: permission/licence to reuse the data (don't scrape
— approach them, as with Birdorable and Cornell), whether there's an export or API, species
coverage, whether it records inheritance mode, how actively it's maintained, and whether its names
conflict with breeders' usage. Default until decided: our own mutation table with `source` /
external-link fields, so any outside source can be linked or imported later. Coordinate with the
genetics-predictor project, which needs the same dataset.

## Birds of the World / eBird taxonomy — decided canonical species ID

**Decision (user):** use the Birds of the World (BOW) / eBird (Clements) species as BirdBox's
authoritative nomenclature and ID, so we're industry standard instead of inventing our own system.

Verified (2026-10): BOW's species pages are keyed by the **eBird species code**, not a universal
numeric ID and not derived from the name by any formula:
`https://birdsoftheworld.org/bow/species/<speciesCode>/cur/introduction` — e.g. `golphe` (Golden
Pheasant), `ostric2` (Common Ostrich), `hyamac1` (Hyacinth Macaw), `gncpar` (Green-cheeked
Parakeet, i.e. "Green-cheek Conure"). The trailing digit disambiguates collisions/splits, so the
URL can't be reverse-engineered from a name — we store the code per species. The code list is
the eBird taxonomy, available from the public endpoint
`https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&cat=species` (it returned all **11,167**
species — exactly BOW's stated species count — with `speciesCode`, `comName`, `sciName`,
`order`, `familyCode`/`familyComName`, and `taxonOrder`; it worked without an API key when tried,
but confirm eBird's terms/key requirements before relying on it). The BOW page itself responded
200 to an unauthenticated request; full content is subscription-gated, which is fine for a link.

How it fits the plan above:
- **Species table keyed by eBird `speciesCode`**, with the taxonomy version stored. Species
  splits mint new codes (that's what `ostric2` is), so existing birds need a code-succession
  story on each annual taxonomy update.
- **Off-site links** wherever a bird page names a species (and later family), opening BOW in a new
  tab. Family pages likely use `familyCode` but that URL pattern is unverified.
- **Not everything has a code**: domestic breeds and forms (Pekin Duck, Faverolles, Embden Goose),
  hybrids, and trade names have no eBird species. They need their own records, optionally linked
  to a parent species code. Mutations remain our own table.
- **Alternate names matter immediately:** only 780 of the 840 Birdorable names match an eBird
  common name exactly (misses are naming variants, e.g. "Jandaya Conure", "Eclectus Parrot",
  "Herring Gull", "Pekin Duck"), which is the names-table requirement in action. The eBird file
  also gives us 410 parrots and 353 pigeons/doves for the aviculture tier.
- **Icons:** with a code per species, icon packs can key on `speciesCode`; Birdorable's
  `species-map.json` could be extended with the code for each image.
- **Illustrations from BOW itself** remain a permission/licensing question for the Cornell Lab
  (a partnership, like Birdorable); linking out needs no permission.

## Credits, partners and affiliate links

Account -> About lists credits (data in `js/data/credits.js`) lists the sources, artists
and partners behind the app with a short description of each and an external link: Birds of the
World, eBird / the Clements Checklist, Avibase, the IOC list, Birdorable, TeraTigerStudio, Dribbr
and Gencalc. Fonts and other technical credits are deliberately not listed in the app — the audience
doesn't care. Adding one is a single entry in the data file. Each entry has a `relationship`
(`courtesy` by default, `partner`, or `affiliate`); partner and affiliate entries are labelled on
screen, can carry a `disclosure` line, and affiliate links are marked `rel="sponsored"`, so turning a
courtesy link into a paid or cross-promotion one later is a data change plus the agreement itself.
Still to do: check Avibase's and Gencalc's addresses in a browser (Avibase refused automated requests
when tested; Gencalc wouldn't load from the build environment, so its blurb is minimal — confirm it); confirm the Birdorable and Cornell relationships before any link is marked partner;
consider a per-species "shop" link using Birdorable's `meetUrl` once that agreement exists.

## About page (user-facing copy)

Account -> About (`js/screens/about.js`, copy in `js/data/about.js`) says who made BirdBox, who it's
for, what it does today, and a short Coming soon / On the horizon / Someday list, in plain language
with no technical detail (no tech stack, no fonts). The copyright line uses the creator name and a
start year from that file and the current year. **Keep its feature list and roadmap in step with this
file when plans change** — it is the simplified public version of this roadmap. It deliberately
makes no privacy claim beyond "the public Registry only shows birds you choose to include", because
there are no accounts or logins yet.

## Our own pickers (instead of the phone's)

Date boxes (and later dropdowns) currently use the phone/browser's built-in pickers, which look
different on every device and sized themselves wider than our forms on some phones (fixed with CSS for
now). Eventually build BirdBox's own date picker — and match our own select/dropdown styling — so
every form looks and behaves the same everywhere. One shared date component used by every form
(`js/screens/record-form.js`, the bird, shipment, health and transfer forms), with quick choices like
Today / Yesterday and a way to leave it blank ("I don't remember").

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

## Places (Caging) — later

- **Desktop layout:** a persistent hierarchy sidebar beside the explorer and an inspector panel for the selected place. The explorer already keeps one selected place shared by Browse and Tree, so this is mostly layout.
- **Tasks, calendar events and supplies on a place:** once those sections exist, link them to a location, building, room or cage (a nullable reference on each) and show them, with aggregate counts, on the place's page.
- **Public directory:** the My Aviary details (name, address, phone, website, socials, logo) are stored for this.

## Team and permissions — later

- **Permissions system:** granular control over what each user can see or edit, by area (birds, shipping, accounting, contacts, places, media, settings…) and by action (see / add / change / delete). Each **role** (Owner, Manager, Staff, Volunteer) gets a default permission set, and a role's defaults can be customised, as can an individual's. Users are defined already (see below); this is what gives them teeth.
- **Logins:** sign-in for team members, tied to their user record, so the permissions actually apply.
- **Assign team members:** to tasks, calendar events, shipments and care routines once those sections exist (a nullable `assigned_to` reference to `users.id` on each).

## Data and genealogy — later

- **Anonymise the demo data:** randomise the existing birds and contacts so nothing real remains — shuffle and scramble first and last names, addresses and details across entries, generate random phone numbers and emails, and re-assign relationships sensibly. (The current data is old, but this should be a repeatable "make a safe demo copy" tool.)
- **Carriers (splits) on a bird:** a field for genes a bird is known to carry but doesn't show, so the mutation predictor doesn't have to infer it only from chicks. The predictor already reads it; it needs a column and a field on the bird form.
- **More species gene profiles** for the mutation predictor (Budgerigar, Quaker, Sun Conure, Lineolated, and the rest of the Tree of Birds list).
- **Production (pairs, clutches, eggs)**, built on the same pairings the family tree shows.
- **Genealogy diagram export** (image / print) and a printable pedigree certificate.

## Tasks — later

- **Who did it:** ticking a task currently records the assigned team member (or nobody); with logins it will record whoever is signed in. A "working as" choice could come sooner.
- **Reminders and notifications** for tasks that are due or overdue, and low-stock supplies in the to-do list.
- **Feeding that uses up stock:** ticking a feeding off could subtract the amounts from the supplies.

## Calendar — later

- **Repeating events** (a weekly tour day) and drag-to-reschedule.
- **Reminders** and an invite/confirmation message to the client.
- **Birthdays / hatch anniversaries** and breeding milestones (egg due dates) as an optional layer once Production exists.
- **Sync** with Google/Apple calendars (an iCal feed).

## Home screen — later

- **Today at a glance:** a compact schedule strip on the home screen — what's due today (tasks, feedings), what's on the calendar (appointments, shipments going out), anything running low or overdue — each tappable. Same data as the Tasks and Calendar tabs (`taskOccurrences`, `calendarItems`).

## Connect everything, from anywhere — to build out

Principle: `docs/principles.md` ("many ways in; everything linked both directions"). Entry points still missing, each pre-filled from where you are:

- **Bird page:** ~~"Ship this bird"~~ and ~~"Sell this bird"~~ are built (`js/bird-actions.js`); still to do: "Schedule" (new event or task for this bird).
- **Contact page:** ~~"Ship to…", "Sell a bird to…", "Receive a shipment"~~ are built; still to do: "+ New accounting entry" for them; "+ New event" with them.
- **Shipment page:** "+ Add a new bird" (not just link an existing one); "Log the shipping expense" (new accounting entry pre-filled with the cost, category Expense, linked to the shipment); "Add to calendar".
- **Accounting entry page:** "Set up the shipment" or link an existing one; "+ Add a bird" it relates to.
- **Cage / place pages:** "+ New task" and "+ New event" for this place.
- **Supply page:** "Add to a care plan" (pick a cage, bird or place).
- **Calendar and Tasks:** start a shipment, health record or bird from an entry.
- **A shared "Add new…" menu** that offers whatever makes sense in the current context.

## Shipping — later

- **Booking and label helper:** a tool that fills out the carrier's booking forms and prints shipping labels for you from what BirdBox already knows — the client's name, address and phone from the address book, your own details from My Aviary, the birds (species, band, count) and the route/date — so you're not retyping it each time. Starts as printable/copyable forms for the carriers you use most, with the waybill number and the saved PDFs filed back onto the shipment.

## Offline mode — later (important)

Many users will work in rural areas with poor or no signal while in the aviary, so BirdBox has to keep working offline.

- **Work offline:** records, photos and ticked-off tasks entered with no connection are kept on the device and queued, then pushed to the server automatically when there's signal again, with sensible handling of conflicts.
- **A sync status indicator, not a menu section:** a small icon in the top bar showing **clean** (everything saved to the server) or **dirty** (changes waiting to sync, with how many), and tapping it shows what's pending and lets you retry. The "On Device" and "Cloud Sync" icons (`icons/tinted/account/On_Device.png`, `Cloud_Sync.png`) are kept for this.
- **What must be available offline:** the birds, cages and places, care plans and today's tasks and calendar, supplies, and contacts — read and write; photos queued for upload.
- **Safety:** warn before anything that would lose unsynced changes (sign out, clear data), and never silently drop a failed save.
