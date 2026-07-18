import { Sheet } from '@/components/Sheet'
import { BAND_COLORS } from '@/lib/colors'

interface ColorPalettePopupProps {
  open: boolean
  onClose: () => void
  selected?: string
  onSelect: (color: string) => void
}

export function ColorPalettePopup({ open, onClose, selected, onSelect }: ColorPalettePopupProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Band color">
      <div className="grid grid-cols-5 gap-3">
        {BAND_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              onSelect(c)
              onClose()
            }}
            style={{ backgroundColor: c }}
            className={`aspect-square rounded-full border-2 transition-transform active:scale-90 ${
              selected === c ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-neutral-900' : ''
            } ${c === '#ffffff' ? 'border-neutral-300' : 'border-black/10'}`}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
    </Sheet>
  )
}
