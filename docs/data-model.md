# BirdBox Data Model

Reverse-engineered from the "WBA Birds - MASTER" Airtable base (`Airtable Ref/` screenshots),
a real base that had been in production use (599 birds, 190 contacts, 629 cages). This is the
reference schema for BirdBox's own data layer — table and field names below are Airtable's;
BirdBox can rename them, but the relationships and the kinds of fields (linked record vs.
formula vs. rollup) are worth preserving since they reflect real day-to-day usage.

Airtable field-type icons used below: **text**, **select** (single choice), **multi-select**,
**link** (to another table, 1:1 or 1:many), **formula**, **rollup** (aggregates linked records),
**date**, **currency**, **checkbox**, **attachment**.

## Birds (hub table — 599 records)

The center of the schema. Almost every other table links back here.

| Field | Type | Notes |
|---|---|---|
| Identifier | formula | Auto-built display name, e.g. `AR 11077 CA - (M) Jenday Conure` |
| Band # | text | Physical leg band ID; `Unbanded` or a placeholder like `-` when none |
| Bird Name | text | Optional pet name, e.g. "Emmet" |
| Species / Subspecies / Mutation | link | → Species / Subspecies / Mutations tables |
| Sex | select | Male / Female / Unsexed |
| Sexing | text | Method, e.g. "DNA - Blood" |
| Hatch Date | date | Sometimes month/year only or blank (uncertain) |
| Location | text | Cage code shorthand shown inline (e.g. `FLN`) — redundant with the linked Cage |
| **Mother / Father** | link (self) | **Links back to other Birds rows — this is the whole genealogy feature** |
| Paired | link (self) | Current mate, if any |
| Med Attachments | attachment | Vet docs, DNA sexing certificates |
| Medical Notes | text | e.g. "Sexed by Avian Biotech", "Negative Polyoma" |
| Genetics | text | Free-form genetic notes |
| Notes | text | Free-form ("Feeding for Steve", "Constricted Toes") |
| Status | select | Uncategorized / Available / Reserved / Sold / WBA / AR / Deceased / Boarding (kanban-worthy pipeline) |
| Owner / Client | link | → Contacts |
| Source | text | Original breeder/source name |
| Invoice | link | → Invoices |
| Acquire Date | date | When this bird entered the collection |
| Cost | currency | What was paid to acquire it |
| Price | currency | Asking/sale price |
| Deposit | currency | Deposit collected from buyer |
| Paid | currency | Amount actually paid so far |
| Owe | formula | Remaining balance |
| Debt | formula | Status label: "Paid For" / "Owe on" |
| Profit | formula | Price − Cost |
| Client Balance | formula | What the client still owes |
| Delivery | select | Local Meetup / Ship (Air) / Pickup |
| Pickup/Ship Date | date | |
| Air Waybill / Departing Airport / Arrival / Arriving Airport / Flight # | text/link | Shipping details; Airports are linked records |
| Waybill | link | → Waybills |

**Genealogy pattern**: Mother/Father are ordinary linked-record fields pointing at other rows in
the same table. A "Progeny" reverse-link (birds where this bird is Mother or Father) would need
either a symmetric linked field or a computed reverse lookup — the source base didn't show one
explicitly hooked up, but it's the natural next field for the family-tree/genealogy screen.

## Cages (629 records) → Buildings (12 records)

Two-level location hierarchy: **Building → Cage → Bird**.

**Buildings**: Name (short code like `F1`, `FUN`, `FLN`), Nickname, Description ("Top of the
hill", "Steve's Garage"), linked Cages (many), linked Birds, Photo.

**Cages**: Name (`F1-001`, `FD-A`, …), Nickname, Description, Notes, Feeding (per-cage feeding
instructions), Photo, Status, linked Building (one), linked Birds (currently housed, many).

BirdBox's Caging screen deliberately doesn't build this out as two full entities yet — per user,
that level of tracking (feeding schedules, supplies, multi-user caretaking) is for a much larger
multi-employee operation and is a less common case for now (see roadmap). Instead
`js/data/buildings-sample.js` is just a building-code → nickname lookup, and the Caging screen
groups `Birds.cage` directly into "cages in use."

## Health Records (new in BirdBox, not in the source Airtable base)

The source base only had a free-text `Medical Notes` field plus a `Med Attachments` file field
on Birds. BirdBox instead gives health records their own entity (`js/data/health-sample.js`),
one row per document/visit, linked to a bird:

Type (select: DNA Certificate / Immunization / Surgical Sexing / Vet Visit / Other), Date,
Provider, Notes, Bird (link), Attachments (files, see the roadmap note on persistence below).
Shown both from `My Birds → Health` (browse/search/filter across every bird) and as a "Health
Records" section directly on a bird's own detail page, per the user's ask that this be
reachable from the master bird record.

## Contacts (190 records)

Full Name, First/Last Name, **Type** (select: Pet Owner / Breeder / Vendor / Store), Company
Name, full address (Street/Address 2/City/State/ZIP), Email, Phone, Facebook/Instagram, Website,
Notes, plus rollups: Birds Purchasing, Birds Owned, Source Of (birds originally sourced from
this contact), Transactions, Invoices, Waybills.

## Invoices (24 records) & Transactions (39 records)

An Invoice links to **many** Birds and many Transactions — one invoice can cover a multi-bird
purchase.

**Invoices**: Invoice # (e.g. `AR 21-2017`), Date, Vendor/Client (link), Total, Autototal
(rollup, likely summed from linked Birds' Cost), Paid, Balance (formula), Count (rollup count of
linked Birds), Closed (checkbox), AP/AR (select: Payable/Receivable), linked Birds, linked
Transactions, Attachments, Notes.

**Transactions**: Item (description), Expense / Income (currency, one populated per row), Date,
linked Invoice, Category (select: Bird (Baby) / Bird (Adult) / …), Funding (link → Funding
Sources), Client (link → Contacts), Bird (link → Birds), Notes, Attachments, linked Invoices.

**Funding Sources** (19 records): flat lookup of payment methods (Cash, Zelle, CashApp, Venmo,
PayPal, Check, specific bank names), linked back to Transactions.

## Waybills (72 records)

Waybill # (carrier tracking number), Date, Client (link), Attachments, **In/Out** (select:
Outgoing/Incoming), Notes, linked Birds (one waybill can cover multiple birds), Departing
Airport / Arriving Airport (link → Airports).

BirdBox's version (`js/data/waybills-sample.js`) adds a **Cost** field (the source base didn't
track shipping cost) and skips the full 389-row Airports lookup table — departing/arriving
airport are plain text codes. Shown at Business → Shipping, cross-linked to Contacts and Birds
the same way Accounting is.

## Bird photos + icon taxonomy (new in BirdBox)

Two related additions, both about what shows in a bird's avatar:

**Photos**: `Birds.photos` (new field) is `[{ id, url, isPrimary }]`, empty by default. A
bird's own detail page has a Photos section — upload (real `<input type="file">`, multiple,
session-only via `URL.createObjectURL()` like Health Record attachments) and tap-to-set-primary.
Exactly one photo is primary at a time; the first upload becomes primary automatically.

**Icon taxonomy fallback** (`js/data/icon-taxonomy.js`): when a bird has no photo, its avatar
falls back through a hierarchy from most to least specific — mutation+subspecies → subspecies →
species → size/functional group → broader functional group → the generic bird icon — per the
user's worked example ("a Turquoise Green-Cheeked Conure falls back to Green-Cheek, then Conure,
then Small Parrot, then Hookbill, then Bird"). `resolveBirdIcon(bird)` walks a tree of named
nodes (`TAXONOMY_NODES`), each with an optional icon and a parent; most nodes have `icon: null`
on purpose since only 17 species icons exist today (from `NestBox Icons.psd`) — the point of the
system is that gaps degrade gracefully, not that every node needs art.

The tree deliberately mixes scientific-ish groupings (Conure, Macaw, Amazon, African Grey) with
the folk/functional categories real bird keepers use, per the user's ask: Hookbill → Parrot →
Small/Medium/Large Parrot; Poultry (Chicken/Turkey/Peafowl); Ground Bird; Ratite; Water Bird →
Waterfowl/Wading Bird/Sea Bird; Songbird; Softbill (Toucan/Hornbill/Turaco/Kingfisher); and Bird
of Prey. Several of these (Bird of Prey, Sea Bird, and most individual species under Poultry/
Waterfowl/Ratite) have no bird in the current sample data and no icon — they're placeholders in
the tree for when the app covers more than parrots, which is the intent (see `snippets.md`'s
original bird-icon list and the taxonomy reference files in the repo root).

To extend: add a node to `TAXONOMY_NODES` (with the right `parent`) for a new species/category,
or add an entry to `SUBSPECIES_ICON_OVERRIDES`/`MUTATION_ICON_OVERRIDES` to illustrate one
specific subspecies or mutation without touching the resolver.

## Registry (new in BirdBox)

Not a separate entity — Registry -> Search reads directly off `Birds.registryPublic` (new
field, default `false`). There's nothing else to enter: turning a bird's registry toggle on
(from the bird's own detail page, or from Registry -> Register's manage list — both write the
same field, so either one is the whole action) makes it findable by exact band number, showing
only band #, species/subspecies/mutation, sex, hatch date, and lineage to *other public* birds —
never owner, notes, or money fields. A parent/child that isn't itself public shows as private
rather than leaking through the link. This is the first working instance of the "linked data,
not duplicated data" pattern the user wants the rest of the app (Classifieds, Lost & Found) to
follow — see docs/roadmap.md.

## Reports (new in BirdBox)

Business → Reports reads directly from Transactions and Waybills — no new entity, just a
dashboard: a KPI row (Income/Expense/Profit/Margin), an "Income vs Expense by Month" diverging
bar chart, a "Spending & Income by Category" horizontal bar chart, and a shipping-cost-to-date
tile linking to Shipping. Built per the `dataviz` skill's method against this app's own warm
palette rather than the skill's generic default — see the comment at the top of
`js/screens/reports.js` for the exact validated hex values and the command used to check them.
No dark-mode chart variant yet since the app has no dark theme at all (see roadmap).

## Taxonomy: Species → Subspecies → Mutations

Matches the reference files already in this repo (`Bird Species Master List.txt`,
`Bird Band Abbreviations.txt`, `IOC_Names_File_Plus-12.1.Red.Draft.xlsx`) — this Airtable base
was clearly seeded from the same kind of source.

- **Species** (40 records): Name, linked Subspecies (many), linked Birds (rollup).
- **Subspecies** (124 records): Name, Alternate Name, Shorthand, Common Species (link →
  Species), Scientific Species, Genus, Sub Family, Family, Order, linked Birds.
- **Mutations** (48 records): flat — Name + linked Birds.

## Reference/logistics tables

- **States** (55 records): State abbreviation + full name (includes territories).
- **Airports** (389 records): Airport code, State, City, Airport Name, Airport Size
  (Non-Hub/Small/Medium/Large Hub) — full US airport reference, used by both Birds (shipping
  fields) and Waybills.

## How this maps onto the current app IA (`js/nav-data.js`)

| Airtable table(s) / new entity | BirdBox group / screen | Status |
|---|---|---|
| Birds, Species/Subspecies/Mutations | My Birds → Birds | Built (list + detail) |
| Birds.Mother/Father/Paired | My Birds → Birds (Family section) / Genealogy | Built on Birds; dedicated Genealogy tree deferred, see roadmap |
| Health Records (new) | My Birds → Health, and a section on Birds detail | Built (list + detail + add form with file upload) |
| Contacts | Business → Contacts | Built (list + detail) |
| Invoices, Transactions, Funding Sources | Business → Accounting | Built (ledger list + detail, no separate Invoices grouping yet) |
| Buildings, Cages (simplified) | Aviary → Caging | Built (cages grouped from Birds.cage, deliberately light — see roadmap) |
| Waybills + Cost (new field) | Business → Shipping | Built (list + detail, no full Airports lookup table) |
| Transactions + Waybills | Business → Reports | Built (KPIs + charts, see below) |
| Birds.registryPublic (new) | Registry → Search, Register | Built (search + manage-list toggle, see below); Lost & Found still a placeholder |
| Cages.Feeding | Aviary → Feed/Water | Placeholder (deprioritized, see roadmap) |

## Open questions for when we build against this

- Do we want a proper reverse-link for **Progeny** (children of a bird), or compute it on the
  fly by querying "birds where Mother = X or Father = X"?
- `Location` (text) vs. the linked Cage — the source base kept both; worth collapsing to just
  the link in BirdBox.
- `Status` mixes true lifecycle state (Available/Reserved/Sold/Deceased) with what look like
  consignment/ownership tags (WBA/AR) — worth separating into two fields.
- Cost/Price/Deposit/Paid/Owe/Debt/Profit/Client Balance is a lot of overlapping money fields on
  Birds itself; Transactions is the real ledger, so most of these could become formulas/rollups
  off Transactions rather than manually-entered fields.
