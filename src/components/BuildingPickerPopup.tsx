import { Sheet } from '@/components/Sheet'
import { CheckGlyph } from '@/components/icons'

interface BuildingPickerPopupProps {
  open: boolean
  onClose: () => void
  count: number
  selected: number
  onSelect: (id: number) => void
  isDone: (id: number) => boolean
}

export function BuildingPickerPopup({ open, onClose, count, selected, onSelect, isDone }: BuildingPickerPopupProps) {
  const ids = Array.from({ length: count }, (_, i) => i + 1)
  return (
    <Sheet open={open} onClose={onClose} title="Building">
      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
        {ids.map((id) => {
          const active = id === selected
          const done = isDone(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                onSelect(id)
                onClose()
              }}
              className={`relative flex aspect-[4/5] flex-col items-center justify-center gap-1 rounded-xl border-2 text-lg font-bold transition-colors ${
                active
                  ? 'border-orange-500 text-orange-500'
                  : 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
              }`}
            >
              {done && <CheckGlyph className="absolute top-1 right-1 h-3.5 w-3.5 text-orange-500" />}
              {String(id).padStart(2, '0')}
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
