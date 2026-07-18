import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Egg } from '@/types'
import { CheckGlyph, CrackGlyph, DeadGlyph, PlusGlyph, QuestionGlyph, XGlyph } from '@/components/icons'

export function eggVisual(status: Egg['status']) {
  switch (status) {
    case 'fertile':
      return { Glyph: CheckGlyph, color: 'var(--accent)' }
    case 'infertile':
      return { Glyph: XGlyph, color: 'var(--ink)' }
    case 'missing':
      return { Glyph: QuestionGlyph, color: 'var(--accent)' }
    case 'broken':
      return { Glyph: CrackGlyph, color: 'var(--accent)' }
    case 'dead-in-shell':
      return { Glyph: DeadGlyph, color: 'var(--accent)' }
    default:
      return { Glyph: QuestionGlyph, color: 'var(--ink)' }
  }
}

interface EggTileProps {
  egg: Egg
  disabled?: boolean
  dimmed?: boolean
  onActivate: (anchor: HTMLElement) => void
  onPointerDownDrag?: (e: ReactPointerEvent) => void
}

export function EggTile({ egg, disabled, dimmed, onActivate, onPointerDownDrag }: EggTileProps) {
  const { Glyph, color } = eggVisual(egg.status)
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => onActivate(e.currentTarget)}
      onPointerDown={onPointerDownDrag}
      className={`clay clay-interactive egg-shape flex aspect-[4/5] w-full touch-none select-none items-center justify-center border-[3px] disabled:opacity-50 ${dimmed ? 'opacity-40' : ''}`}
      style={{ borderColor: 'var(--ink)' }}
      aria-label={`Egg, status ${egg.status}`}
    >
      <Glyph className="h-7 w-7" style={{ color }} />
    </button>
  )
}

export function AddEggTile({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="clay-inset clay-interactive egg-shape flex aspect-[4/5] w-full items-center justify-center transition-colors disabled:opacity-40"
      style={{ color: 'var(--accent)' }}
      aria-label="Add egg"
    >
      <PlusGlyph className="h-7 w-7" />
    </button>
  )
}
