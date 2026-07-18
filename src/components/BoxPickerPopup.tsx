import { CustomScrollbar, Popover, ScrollFadeBottom, ScrollFadeTop } from '@/components/Popover'
import { useDragSelectGrid } from '@/lib/useDragSelectGrid'
import { useScrollFade } from '@/lib/useScrollFade'

interface BoxPickerPopupProps {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  count: number
  selected: number
  onSelect: (id: number) => void
  isDone: (id: number) => boolean
}

// Cap the grid to ~5 rows (20 tiles) so the popup stays compact instead of
// filling the screen; the rest is reachable via the internal scroll + fade.
const VISIBLE_ROWS = 5
const TILE_SIZE = 64
const GRID_GAP = 8
const GRID_MAX_HEIGHT = VISIBLE_ROWS * TILE_SIZE + (VISIBLE_ROWS - 1) * GRID_GAP

export function BoxPickerPopup({ open, anchorEl, onClose, count, selected, onSelect, isDone }: BoxPickerPopupProps) {
  const ids = Array.from({ length: count }, (_, i) => i + 1)
  const { hovered, onPointerDown } = useDragSelectGrid((value) => {
    onSelect(Number(value))
    onClose()
  })
  const { ref, containerRef, canScrollUp, canScrollDown, scrollTop, scrollHeight, clientHeight } = useScrollFade<HTMLDivElement>()

  return (
    <Popover open={open} anchorEl={anchorEl} onClose={onClose} title="Box" widthClassName="w-[calc(100vw-2rem)] max-w-xs">
      <div ref={ref} className="overflow-y-auto pr-6" style={{ maxHeight: GRID_MAX_HEIGHT }}>
        <ScrollFadeTop show={canScrollUp} />
        <CustomScrollbar containerRef={containerRef} scrollTop={scrollTop} scrollHeight={scrollHeight} clientHeight={clientHeight} />
        <div className="grid touch-none grid-cols-4 gap-2 select-none" onPointerDown={onPointerDown}>
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
                className={`font-display aspect-square rounded-xl text-xl font-bold transition-colors ${
                  active || dragged ? 'clay-accent' : done ? 'border-2' : ''
                }`}
                style={
                  !active && !dragged
                    ? { color: done ? 'var(--accent)' : 'var(--ink)', opacity: done ? 1 : 0.75, borderColor: done ? 'var(--accent)' : undefined }
                    : undefined
                }
              >
                {String(id).padStart(2, '0')}
              </button>
            )
          })}
        </div>
        <ScrollFadeBottom show={canScrollDown} />
      </div>
    </Popover>
  )
}
