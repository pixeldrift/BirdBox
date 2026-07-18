import type { Baby } from '@/types'
import { ChickGlyph } from '@/components/icons'

interface BabiesRowProps {
  babies: Baby[]
  disabled?: boolean
  onSelect: (babyId: string) => void
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
          onClick={() => onSelect(b.id)}
          aria-label={`Baby${b.bandId ? `, band ${b.bandId}` : ''}`}
          className="flex flex-col items-center gap-1 rounded-xl p-1.5 text-neutral-900 transition-colors hover:bg-orange-50 disabled:opacity-50 dark:text-neutral-100 dark:hover:bg-orange-500/10"
        >
          <ChickGlyph className="h-9 w-9" />
          {b.bandId && <span className="text-[10px] font-medium text-neutral-500">{b.bandId}</span>}
        </button>
      ))}
    </div>
  )
}
