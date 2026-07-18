import { Popover } from '@/components/Popover'

interface BoxPickerPopupProps {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  count: number
  selected: number
  onSelect: (id: number) => void
  isDone: (id: number) => boolean
}

export function BoxPickerPopup({ open, anchorEl, onClose, count, selected, onSelect, isDone }: BoxPickerPopupProps) {
  const ids = Array.from({ length: count }, (_, i) => i + 1)
  return (
    <Popover open={open} anchorEl={anchorEl} onClose={onClose} title="Box" widthClassName="w-[calc(100vw-2rem)] max-w-md">
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
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
              className={`font-display aspect-square rounded-lg text-xs font-bold transition-colors ${active ? 'clay-accent' : done ? 'border-2' : ''}`}
              style={
                !active
                  ? { color: done ? 'var(--accent)' : 'var(--ink)', opacity: done ? 1 : 0.75, borderColor: done ? 'var(--accent)' : undefined }
                  : undefined
              }
            >
              {String(id).padStart(2, '0')}
            </button>
          )
        })}
      </div>
    </Popover>
  )
}
