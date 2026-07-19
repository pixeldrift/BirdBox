import { Popover } from '@/components/Popover'

interface BoxPickerPopupProps {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  count: number
  selected: number
  onSelect: (id: number) => void
  onStep: (delta: number) => void
  isDone: (id: number) => boolean
}

// Cap the grid to ~5 rows (20 tiles) so the popup stays compact instead of
// filling the screen; the rest is reachable via the popover's own scroll + fade.
const VISIBLE_ROWS = 5
const TILE_SIZE = 64
const GRID_GAP = 8
const GRID_MAX_HEIGHT = VISIBLE_ROWS * TILE_SIZE + (VISIBLE_ROWS - 1) * GRID_GAP

export function BoxPickerPopup({ open, anchorEl, onClose, count, selected, onSelect, onStep, isDone }: BoxPickerPopupProps) {
  const ids = Array.from({ length: count }, (_, i) => i + 1)

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      title="Box"
      onStep={onStep}
      widthClassName="w-[calc(100vw-2rem)] max-w-xs"
      contentMaxHeight={GRID_MAX_HEIGHT}
    >
      <div className="grid grid-cols-4 gap-2">
        {ids.map((id) => {
          const active = id === selected
          const done = isDone(id)
          return (
            <button
              key={id}
              type="button"
              data-popover-current={active || undefined}
              onClick={() => {
                onSelect(id)
                onClose()
              }}
              className={`font-display aspect-square rounded-xl text-xl font-bold transition-colors ${
                active ? 'clay-accent' : done ? 'border-2' : ''
              }`}
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
