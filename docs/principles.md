# Design principles

## Many ways in; everything linked both directions

Anything you can do in BirdBox you should be able to start from wherever you happen to be, not only from one "official" screen. Records are all interconnected, and each link can be made and followed from **both ends**.

Worked examples (the target behaviour):

- **Shipping a bird.** From the bird's page, ship it to a client. From the client's page, add a shipment to that client. From the list of upcoming shipments, add a bird to one (or add a brand-new bird right there). From Accounting, if you notice shipping costs were never logged, set up the shipment from the entry. The same shipment results every time, with the same links.
- **A cage and its birds:** a cage page lists its birds and can add or remove them; a bird's page can set its cage.
- **Photos, files, supplies, care plans, tasks, events:** attached to a record from the record, or from the library / list they live in.

How this shows up in the code:

- **Links are data, not screens.** A link is a field (`client_id`, `bird_ids`, `mother_id`…) or a link row (`media_links`, `event_links`, `care_items`), editable from either side.
- **Shared components** do the two-way work: `Relations.one` / `Relations.many` (list what's linked, add an existing one, remove, "+ add a new one here"), `Picker` (search or browse any record type, with "Add new"), `Modal`.
- **Context carries over.** "Add new" from inside a record pre-fills what it already knows (the client, the bird, the cage, the date). See the Caging explorer's context-aware Add New and `LocationExplorer.setPrefill`.
- **Removing a link never deletes a record**, and says so.

When adding a feature, ask: from which other screens would someone reasonably want to start this? Add an entry point in each, pre-filled from that context.

## One look for each kind of control

See `docs/ui-conventions.md`.
