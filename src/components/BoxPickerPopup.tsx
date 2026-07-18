import { Sheet } from '@/components/Sheet'

interface BoxPickerPopupProps {
  open: boolean
  onClose: () => void
  count: number
  selected: number
  onSelect: (id: number) => void
  isDone: (id: number) => boolean
}

export function BoxPickerPopup({ open, onClose, count, selected, onSelect, isDone }: BoxPickerPopupProps) {
  const ids = Array.from({ length: count }, (_, i) => i + 1)
  return (
    <Sheet open={open} onClose={onClose} title="Box">
      <div className="grid max-h-[60vh] grid-cols-6 gap-1.5 overflow-y-auto sm:grid-cols-10">
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
              className={`aspect-square rounded-md text-xs font-semibold transition-colors ${
                active
                  ? 'bg-orange-500 text-white'
                  : done
                    ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {String(id).padStart(2, '0')}
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
