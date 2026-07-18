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
      {ZONES.map(({ key, label, Glyph }) => (
        <div key={key} className="flex flex-col items-center gap-1.5">
          <div
            ref={(el) => registerRef(key, el)}
            className={`flex aspect-square w-full items-center justify-center rounded-2xl border-2 transition-colors ${
              activeZone === key
                ? 'border-orange-500 bg-orange-100 dark:bg-orange-500/20'
                : 'border-neutral-900 dark:border-neutral-100'
            } ${disabled ? 'opacity-40' : ''}`}
          >
            <Glyph className={`h-7 w-7 ${activeZone === key ? 'text-orange-600' : 'text-neutral-900 dark:text-neutral-100'}`} />
          </div>
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">{label}</span>
        </div>
      ))}
    </div>
  )
}
