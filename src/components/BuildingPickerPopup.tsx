import { Popover } from '@/components/Popover'
import { CheckGlyph } from '@/components/icons'
import { useDragSelectGrid } from '@/lib/useDragSelectGrid'

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
  const { hovered, onPointerDown } = useDragSelectGrid((value) => {
    onSelect(Number(value))
    onClose()
  })

  return (
    <Popover open={open} anchorEl={anchorEl} onClose={onClose} title="Building" widthClassName="w-[calc(100vw-2rem)] max-w-md">
      <div className="grid touch-none grid-cols-4 gap-2.5 select-none sm:grid-cols-6" onPointerDown={onPointerDown}>
        {ids.map((id) => {
          const value = String(id)
          const active = id === selected
          const done = isDone(id)
          const dragged = hovered === value && !active
          return (
            <button
              key={id}
              type="button"
              data-select-value={value}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(id)
                  onClose()
                }
              }}
              className="clay clay-interactive font-display relative flex aspect-[4/5] flex-col items-center justify-center gap-1 rounded-2xl border-[3px] text-lg font-bold"
              style={{
                borderColor: active || dragged ? 'var(--accent)' : 'var(--ink)',
                color: active || dragged ? 'var(--accent-dark)' : 'var(--ink)',
              }}
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
