import { DownArrowGlyph, QuestionGlyph, XGlyph } from '@/components/icons'

export type DropZone = 'missing' | 'discard' | 'collect'

const ZONES: { key: DropZone; label: string; Glyph: typeof QuestionGlyph }[] = [
  { key: 'missing', label: 'Missing', Glyph: QuestionGlyph },
  { key: 'discard', label: 'Discard', Glyph: XGlyph },
  { key: 'collect', label: 'Collect', Glyph: DownArrowGlyph },
]

interface ActionZonesProps {
  // 0 (at rest) to 1 (egg right over it) per zone, driving a continuous
  // fade rather than a binary open/closed switch.
  proximity: Record<DropZone, number>
  disabled?: boolean
  registerRef: (zone: DropZone, el: HTMLDivElement | null) => void
}

// Box geometry, in a shared 0-100 x 0-90 box: a flat-bottomed "U" whose walls
// are fixed — nothing about the box itself moves or morphs. Two more pieces
// lie on top of that fixed outline and only ever fade in/out:
//  - a dim flat lid across the top, present at rest;
//  - a funnel (two static lines flaring up and outward from the same top
//    corners) indicating where a dragged egg will land if released.
// Proximity crossfades between them — lid fading down as the funnel fades
// up — rather than the box shape opening on its own.
const WALL_X_L = 28
const WALL_X_R = 72
const TOP_Y = 34
const BASE_BOTTOM_Y = 82
const CORNER_R = 8
const FUNNEL_L = { x: 6, y: 4 }
const FUNNEL_R = { x: 94, y: 4 }
const REST_LID_OPACITY = 0.35

const BOX_D = [
  `M ${WALL_X_L} ${TOP_Y}`,
  `L ${WALL_X_L} ${BASE_BOTTOM_Y - CORNER_R}`,
  `Q ${WALL_X_L} ${BASE_BOTTOM_Y} ${WALL_X_L + CORNER_R} ${BASE_BOTTOM_Y}`,
  `L ${WALL_X_R - CORNER_R} ${BASE_BOTTOM_Y}`,
  `Q ${WALL_X_R} ${BASE_BOTTOM_Y} ${WALL_X_R} ${BASE_BOTTOM_Y - CORNER_R}`,
  `L ${WALL_X_R} ${TOP_Y}`,
].join(' ')

const LID_D = `M ${WALL_X_L} ${TOP_Y} L ${WALL_X_R} ${TOP_Y}`

const FUNNEL_D = [
  `M ${FUNNEL_L.x} ${FUNNEL_L.y} L ${WALL_X_L} ${TOP_Y}`,
  `M ${WALL_X_R} ${TOP_Y} L ${FUNNEL_R.x} ${FUNNEL_R.y}`,
].join(' ')

function ZoneShape({ proximity }: { proximity: number }) {
  const strokeColor = proximity > 0.5 ? 'var(--accent)' : 'var(--ink)'
  return (
    <svg viewBox="0 0 100 90" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      <path
        d={FUNNEL_D}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={5}
        strokeLinecap="round"
        style={{ opacity: proximity, transition: 'opacity 120ms linear' }}
      />
      <path
        d={LID_D}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={6}
        strokeLinecap="round"
        style={{ opacity: REST_LID_OPACITY * (1 - proximity), transition: 'opacity 120ms linear' }}
      />
      <path d={BOX_D} fill="none" stroke={strokeColor} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 120ms linear' }} />
    </svg>
  )
}

export function ActionZones({ proximity, disabled, registerRef }: ActionZonesProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {ZONES.map(({ key, label, Glyph }) => {
        const p = proximity[key] ?? 0
        return (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <div
              ref={(el) => registerRef(key, el)}
              className={`relative aspect-square w-full transition-opacity ${disabled ? 'opacity-40' : ''}`}
            >
              <ZoneShape proximity={p} />
              <div className="absolute inset-0 flex items-end justify-center pb-[16%]">
                <Glyph className="h-7 w-7" style={{ color: p > 0.5 ? 'var(--accent-dark)' : 'var(--ink)' }} />
              </div>
            </div>
            <span className="text-xs font-bold" style={{ color: 'var(--ink)', opacity: 0.7 }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
