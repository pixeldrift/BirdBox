import { useEffect, useState } from 'react'
import { Popover } from '@/components/Popover'
import { PaletteGlyph, PencilGlyph } from '@/components/icons'
import { ColorPalettePopup } from '@/components/ColorPalettePopup'

export interface BandDetails {
  bandId?: string
  color?: string
  notes?: string
}

interface BandDetailsPopupProps {
  open: boolean
  anchorEl: HTMLElement | null
  title: string
  submitLabel: string
  initial?: BandDetails
  onClose: () => void
  onSubmit: (details: BandDetails) => void
}

export function BandDetailsPopup({ open, anchorEl, title, submitLabel, initial, onClose, onSubmit }: BandDetailsPopupProps) {
  const [bandId, setBandId] = useState(initial?.bandId ?? '')
  const [color, setColor] = useState<string | undefined>(initial?.color)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [paletteAnchor, setPaletteAnchor] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPaletteAnchor(null)
    if (open) {
      setBandId(initial?.bandId ?? '')
      setColor(initial?.color)
      setNotes(initial?.notes ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      <Popover open={open} anchorEl={anchorEl} onClose={onClose} title={title}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="w-11 shrink-0 text-sm font-bold" style={{ color: 'var(--ink)', opacity: 0.6 }}>
              ID#
            </label>
            <input
              autoFocus
              value={bandId}
              onChange={(e) => setBandId(e.target.value)}
              placeholder="Band ID"
              className="clay-inset min-w-0 flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ color: 'var(--ink)' }}
            />
            <button
              type="button"
              onClick={(e) => setPaletteAnchor(e.currentTarget)}
              style={color ? { backgroundColor: color, backgroundImage: 'none' } : { color: 'var(--ink)', opacity: 0.4 }}
              className="clay clay-interactive flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px]"
              aria-label="Choose band color"
            >
              {!color && <PaletteGlyph className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex w-11 shrink-0 items-center justify-center pt-2" style={{ color: 'var(--ink)', opacity: 0.4 }}>
              <PencilGlyph className="h-4 w-4" />
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              rows={2}
              className="clay-inset min-w-0 flex-1 resize-none rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ color: 'var(--ink)' }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onSubmit({ bandId: bandId || undefined, color, notes: notes || undefined })
            onClose()
          }}
          className="clay-accent clay-interactive mt-4 w-full rounded-xl py-2.5 text-sm font-bold"
        >
          {submitLabel}
        </button>
      </Popover>
      <ColorPalettePopup
        open={paletteAnchor !== null}
        anchorEl={paletteAnchor}
        onClose={() => setPaletteAnchor(null)}
        selected={color}
        onSelect={setColor}
      />
    </>
  )
}
