import { Sheet } from '@/components/Sheet'
import { eggVisual } from '@/components/EggTile'
import { EGG_STATUS_OPTIONS, type Egg, type EggStatus } from '@/types'

interface StatusPopupProps {
  open: boolean
  egg: Egg | null
  onClose: () => void
  onSelect: (status: EggStatus) => void
  onDelete: () => void
}

export function StatusPopup({ open, egg, onClose, onSelect, onDelete }: StatusPopupProps) {
  if (!egg) return null
  return (
    <Sheet open={open} onClose={onClose} title="Egg condition">
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
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition-colors ${
                active
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-orange-300'
              }`}
            >
              <span className="egg-shape flex h-10 w-9 items-center justify-center border-[3px] border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-800">
                <Glyph className={`h-5 w-5 ${color}`} />
              </span>
              <span
                className={`text-xs font-medium ${active ? 'text-orange-600 dark:text-orange-400 underline underline-offset-2' : 'text-neutral-600 dark:text-neutral-300'}`}
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
        className="mt-4 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 py-2.5 text-sm font-medium text-neutral-500 hover:border-red-300 hover:text-red-500 transition-colors"
      >
        Remove this egg
      </button>
    </Sheet>
  )
}
