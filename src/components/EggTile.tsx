import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Egg } from '@/types'
import { CheckGlyph, CrackGlyph, DeadGlyph, QuestionGlyph, XGlyph } from '@/components/icons'

export function eggVisual(status: Egg['status']) {
  switch (status) {
    case 'fertile':
      return { Glyph: CheckGlyph, color: 'text-orange-500', border: 'border-neutral-900 dark:border-neutral-100' }
    case 'infertile':
      return { Glyph: XGlyph, color: 'text-neutral-900 dark:text-neutral-100', border: 'border-neutral-900 dark:border-neutral-100' }
    case 'missing':
      return { Glyph: QuestionGlyph, color: 'text-orange-500', border: 'border-neutral-900 dark:border-neutral-100' }
    case 'broken':
      return { Glyph: CrackGlyph, color: 'text-orange-500', border: 'border-neutral-900 dark:border-neutral-100' }
    case 'dead-in-shell':
      return { Glyph: DeadGlyph, color: 'text-orange-500', border: 'border-neutral-900 dark:border-neutral-100' }
    default:
      return { Glyph: QuestionGlyph, color: 'text-neutral-300 dark:text-neutral-600', border: 'border-dashed border-neutral-300 dark:border-neutral-600' }
  }
}

interface EggTileProps {
  egg: Egg
  disabled?: boolean
  dimmed?: boolean
  onActivate: () => void
  onPointerDownDrag?: (e: ReactPointerEvent) => void
}

export function EggTile({ egg, disabled, dimmed, onActivate, onPointerDownDrag }: EggTileProps) {
  const { Glyph, color, border } = eggVisual(egg.status)
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onActivate}
      onPointerDown={onPointerDownDrag}
      className={`egg-shape aspect-[4/5] w-full border-[3px] bg-white dark:bg-neutral-800 flex items-center justify-center touch-none select-none transition-transform active:scale-95 disabled:opacity-50 ${border} ${dimmed ? 'opacity-40' : ''}`}
      aria-label={`Egg, status ${egg.status}`}
    >
      <Glyph className={`h-7 w-7 ${color}`} />
    </button>
  )
}

export function AddEggTile({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="egg-shape aspect-[4/5] w-full border-[3px] border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-300 dark:text-neutral-600 hover:border-orange-400 hover:text-orange-500 transition-colors disabled:opacity-40 disabled:hover:border-neutral-300 disabled:hover:text-neutral-300"
      aria-label="Add egg"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
      </svg>
    </button>
  )
}
