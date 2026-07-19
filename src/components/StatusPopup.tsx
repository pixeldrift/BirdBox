import { Popover } from '@/components/Popover'
import { eggVisual } from '@/components/EggTile'
import { XGlyph } from '@/components/icons'
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
    <Popover open={open} anchorEl={anchorEl} onClose={onClose} title="Egg Condition">
      <div className="grid grid-cols-3 gap-3">
        {EGG_STATUS_OPTIONS.map(({ status, label }) => {
          const { Glyph, color } = eggVisual(status)
          const active = egg.status === status
          // Hatched no longer represents an egg — the chick has left it — so
          // it skips the egg-shaped bubble the other (still-an-egg) statuses
          // share with the main grid tiles.
          const isHatched = status === 'hatched'
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
              {isHatched ? (
                // Same footprint as the egg-shaped bubble below (aspect-[4/5]
                // w-11), just without the bubble itself, so its label lines
                // up on the same baseline as the actual egg statuses.
                <span className="flex aspect-[4/5] w-11 items-center justify-center">
                  <Glyph className="h-full w-full" style={{ color }} />
                </span>
              ) : (
                <span
                  className="clay-egg clay-interactive egg-shape flex aspect-[4/5] w-11 items-center justify-center border-[3px]"
                  style={{ borderColor: active ? 'var(--accent)' : 'var(--ink)' }}
                >
                  <Glyph className="h-[80%] w-[80%]" style={{ color }} />
                </span>
              )}
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
        className="clay clay-interactive mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl py-2.5 text-sm font-bold transition-colors"
        style={{ color: 'var(--ink)', opacity: 0.65 }}
      >
        <XGlyph className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
        Remove this egg
      </button>
    </Popover>
  )
}
