import { DownArrowGlyph, QuestionGlyph, XGlyph } from '@/components/icons'

export type DropZone = 'missing' | 'discard' | 'collect'

const ZONES: { key: DropZone; label: string; Glyph: typeof QuestionGlyph }[] = [
  { key: 'missing', label: 'Missing', Glyph: QuestionGlyph },
  { key: 'discard', label: 'Discard', Glyph: XGlyph },
  { key: 'collect', label: 'Collect', Glyph: DownArrowGlyph },
]

interface ActionZonesProps {
  activeZone: DropZone | null
  disabled?: boolean
  registerRef: (zone: DropZone, el: HTMLDivElement | null) => void
}

// Trough geometry, in a shared 0-100 x 0-90 box: a flat-bottomed "U" whose
// top corners flare outward into a pair of open "ears" — like a laundry
// basket seen from the front. Only the ear endpoints move (rest vs. dragged-
// towards); every other point is fixed, so both path strings share the exact
// same command structure and the `d` CSS property can transition smoothly
// between them instead of snapping.
const WALL_X_L = 28
const WALL_X_R = 72
const BASE_TOP_Y = 34
const BASE_BOTTOM_Y = 82
const CORNER_R = 8

const EAR_REST = { lx: 22, ly: 10, rx: 78, ry: 10 }
const EAR_ACTIVE = { lx: 6, ly: 4, rx: 94, ry: 4 }
const ROOF_PEAK = { x: 50, y: 0 }

function troughPath(ear: typeof EAR_REST) {
  return [
    `M ${ear.lx} ${ear.ly}`,
    `L ${WALL_X_L} ${BASE_TOP_Y}`,
    `L ${WALL_X_L} ${BASE_BOTTOM_Y - CORNER_R}`,
    `Q ${WALL_X_L} ${BASE_BOTTOM_Y} ${WALL_X_L + CORNER_R} ${BASE_BOTTOM_Y}`,
    `L ${WALL_X_R - CORNER_R} ${BASE_BOTTOM_Y}`,
    `Q ${WALL_X_R} ${BASE_BOTTOM_Y} ${WALL_X_R} ${BASE_BOTTOM_Y - CORNER_R}`,
    `L ${WALL_X_R} ${BASE_TOP_Y}`,
    `L ${ear.rx} ${ear.ry}`,
  ].join(' ')
}

// Roof only ever spans the *rest* ear positions — it fades away (rather than
// morphing) as the trough opens, like a lid lifting off, instead of trying to
// track the ears as they spread apart.
const ROOF_D = `M ${EAR_REST.lx} ${EAR_REST.ly} L ${ROOF_PEAK.x} ${ROOF_PEAK.y} L ${EAR_REST.rx} ${EAR_REST.ry}`

function ZoneShape({ active, showRoof }: { active: boolean; showRoof?: boolean }) {
  const strokeColor = active ? 'var(--accent)' : 'var(--ink)'
  return (
    <svg viewBox="0 0 100 90" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      {showRoof && (
        <path
          d={ROOF_D}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: active ? 0 : 1, transition: 'opacity 200ms ease' }}
        />
      )}
      <path
        d={troughPath(active ? EAR_ACTIVE : EAR_REST)}
        fill="none"
        stroke={strokeColor}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'd 200ms ease, stroke 200ms ease' }}
      />
    </svg>
  )
}

export function ActionZones({ activeZone, disabled, registerRef }: ActionZonesProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {ZONES.map(({ key, label, Glyph }) => {
        const active = activeZone === key
        return (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <div
              ref={(el) => registerRef(key, el)}
              className={`relative aspect-square w-full transition-opacity ${disabled ? 'opacity-40' : ''}`}
            >
              <ZoneShape active={active} showRoof={key === 'discard'} />
              <div className="absolute inset-0 flex items-end justify-center pb-[16%]">
                <Glyph className="h-7 w-7" style={{ color: active ? 'var(--accent-dark)' : 'var(--ink)' }} />
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
