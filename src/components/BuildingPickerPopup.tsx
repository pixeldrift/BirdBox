import { Popover } from '@/components/Popover'
import { CheckGlyph } from '@/components/icons'

interface BuildingPickerPopupProps {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  count: number
  selected: number
  onSelect: (id: number) => void
  isDone: (id: number) => boolean
}

export function BuildingPickerPopup({ open, anchorEl, onClose, count, selected, onSelect, isDone }: BuildingPickerPopupProps) {
  const ids = Array.from({ length: count }, (_, i) => i + 1)
  return (
    <Popover open={open} anchorEl={anchorEl} onClose={onClose} title="Building" widthClassName="w-[calc(100vw-2rem)] max-w-md">
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
              className="clay clay-interactive font-display relative flex aspect-[4/5] flex-col items-center justify-center gap-1 rounded-2xl border-[3px] text-lg font-bold"
              style={{ borderColor: active ? 'var(--accent)' : 'var(--ink)', color: active ? 'var(--accent-dark)' : 'var(--ink)' }}
            >
              {done && <CheckGlyph className="absolute top-1.5 right-1.5 h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />}
              {String(id).padStart(2, '0')}
            </button>
          )
        })}
      </div>
    </Popover>
  )
}
