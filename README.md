# BirdBox

A field-use prototype for aviary nest box checks: navigate by building and
box/cage, log egg conditions, track hatched babies, and drag eggs to quick
action zones (Missing / Discard / Collect). Built as plain React components
so the interaction model ports cleanly to SwiftUI/iOS later.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- No backend — state persists to `localStorage` for this prototype phase

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
```

Other scripts:

```bash
npm run build    # production build (runs tsc -b first)
npm run preview  # preview the build
npm run lint
```

## How it's organized

- `src/types.ts` — data model (`Egg`, `Baby`, `DailyBoxRecord`, statuses)
- `src/lib/useBirdBoxStore.ts` — all state + mutations, backed by `localStorage`
- `src/components/` — UI: `Header` (building/box nav, date, edit-mode toggle,
  stats), `EggTile`/`BabiesRow` (the grid), `ActionZones` (the drag targets),
  and the popups (`StatusPopup`, `BuildingPickerPopup`, `BoxPickerPopup`,
  `BandDetailsPopup`, `ColorPalettePopup`)
- `src/App.tsx` — wires it together and owns the pointer-based drag logic
  (custom, not a DnD library — touch and mouse both work the same way)

## Data model notes

- Each building/box/day combination is one `DailyBoxRecord`, keyed by
  `date|buildingId|boxId`.
- Today's record is always editable. Past days are read-only until the
  edit-mode toggle is switched on, so amending old data is a deliberate act.
- An egg marked **Hatched** is removed from the egg grid and becomes a
  **Baby** instead — it isn't double-counted.
- Dragging an egg onto **Missing** or **Discard** applies immediately.
  Dragging onto **Collect** opens a popup first (band ID, color, notes)
  since that action captures more detail.
