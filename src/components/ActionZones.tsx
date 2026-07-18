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

export function ActionZones({ activeZone, disabled, registerRef }: ActionZonesProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {ZONES.map(({ key, label, Glyph }) => {
        const active = activeZone === key
        return (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <div
              ref={(el) => registerRef(key, el)}
              className={`clay flex aspect-square w-full items-center justify-center rounded-2xl border-[3px] transition-colors ${disabled ? 'opacity-40' : ''}`}
              style={{
                borderColor: active ? 'var(--accent)' : 'var(--ink)',
                background: active ? 'var(--accent-soft)' : undefined,
              }}
            >
              <Glyph className="h-7 w-7" style={{ color: active ? 'var(--accent-dark)' : 'var(--ink)' }} />
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
