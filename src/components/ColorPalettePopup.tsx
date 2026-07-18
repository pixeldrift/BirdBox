import { Popover } from '@/components/Popover'
import { BAND_COLORS } from '@/lib/colors'

interface ColorPalettePopupProps {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  selected?: string
  onSelect: (color: string) => void
}

export function ColorPalettePopup({ open, anchorEl, onClose, selected, onSelect }: ColorPalettePopupProps) {
  return (
    <Popover open={open} anchorEl={anchorEl} onClose={onClose} title="Band color" widthClassName="w-[calc(100vw-2rem)] max-w-xs">
      <div className="grid grid-cols-5 gap-3">
        {BAND_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              onSelect(c)
              onClose()
            }}
            style={{ backgroundColor: c, backgroundImage: 'none', borderColor: c === '#ffffff' ? 'var(--cream-inset)' : 'rgba(0,0,0,0.15)' }}
            className={`clay clay-interactive aspect-square rounded-full border-[3px] ${
              selected === c ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--cream-panel)]' : ''
            }`}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
    </Popover>
  )
}
