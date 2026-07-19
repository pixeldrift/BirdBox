import type { Baby } from '@/types'
import { ChickGlyph } from '@/components/icons'

interface BabiesRowProps {
  babies: Baby[]
  disabled?: boolean
  onSelect: (babyId: string, anchor: HTMLElement) => void
}

export function BabiesRow({ babies, disabled, onSelect }: BabiesRowProps) {
  if (babies.length === 0) return null
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
      {babies.map((b) => (
        <button
          key={b.id}
          type="button"
          disabled={disabled}
          onClick={(e) => onSelect(b.id, e.currentTarget)}
          aria-label={`Baby${b.bandId ? `, band ${b.bandId}` : ''}`}
          className="clay clay-interactive flex flex-col items-center gap-1 rounded-2xl p-2 disabled:opacity-50"
          style={{ color: 'var(--ink)' }}
        >
          <ChickGlyph className="h-14 w-14" />
          {b.bandId && <span className="text-[10px] font-bold" style={{ opacity: 0.6 }}>{b.bandId}</span>}
        </button>
      ))}
    </div>
  )
}
