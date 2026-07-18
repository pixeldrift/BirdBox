import { Popover } from '@/components/Popover'
import { eggVisual } from '@/components/EggTile'
import { EGG_STATUS_OPTIONS, type Egg, type EggStatus } from '@/types'

interface StatusPopupProps {
  open: boolean
  egg: Egg | null
  anchorEl: HTMLElement | null
  onClose: () => void
  onSelect: (status: EggStatus) => void
  onDelete: () => void
}

export function StatusPopup({ open, egg, anchorEl, onClose, onSelect, onDelete }: StatusPopupProps) {
  if (!egg) return null
  return (
    <Popover open={open} anchorEl={anchorEl} onClose={onClose} title="Egg condition">
      <div className="grid grid-cols-3 gap-3">
        {EGG_STATUS_OPTIONS.map(({ status, label }) => {
          const { Glyph, color } = eggVisual(status)
          const active = egg.status === status
          return (
            <button
              key={status}
              type="button"
              onClick={() => {
                onSelect(status)
                onClose()
              }}
              className="flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-colors"
            >
              <span
                className="clay clay-sm flex h-11 w-11 items-center justify-center rounded-full border-[3px]"
                style={{ borderColor: active ? 'var(--accent)' : 'var(--ink)' }}
              >
                <Glyph className="h-5 w-5" style={{ color }} />
              </span>
              <span
                className={`text-xs font-bold ${active ? 'underline underline-offset-2' : ''}`}
                style={{ color: active ? 'var(--accent-dark)' : 'var(--ink)', opacity: active ? 1 : 0.7 }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          onDelete()
          onClose()
        }}
        className="clay-inset clay-interactive mt-4 w-full rounded-xl py-2.5 text-sm font-bold transition-colors"
        style={{ color: 'var(--ink)', opacity: 0.6 }}
      >
        Remove this egg
      </button>
    </Popover>
  )
}
