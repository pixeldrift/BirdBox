import { useEffect, useState } from 'react'
import { Sheet } from '@/components/Sheet'
import { PaletteGlyph, PencilGlyph } from '@/components/icons'
import { ColorPalettePopup } from '@/components/ColorPalettePopup'

export interface BandDetails {
  bandId?: string
  color?: string
  notes?: string
}

interface BandDetailsPopupProps {
  open: boolean
  title: string
  submitLabel: string
  initial?: BandDetails
  onClose: () => void
  onSubmit: (details: BandDetails) => void
}

export function BandDetailsPopup({ open, title, submitLabel, initial, onClose, onSubmit }: BandDetailsPopupProps) {
  const [bandId, setBandId] = useState(initial?.bandId ?? '')
  const [color, setColor] = useState<string | undefined>(initial?.color)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setBandId(initial?.bandId ?? '')
      setColor(initial?.color)
      setNotes(initial?.notes ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      <Sheet open={open} onClose={onClose} title={title}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="w-11 shrink-0 text-sm font-semibold text-neutral-500">ID#</label>
            <input
              autoFocus
              value={bandId}
              onChange={(e) => setBandId(e.target.value)}
              placeholder="Band ID"
              className="min-w-0 flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              style={color ? { backgroundColor: color } : undefined}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${color ? 'border-black/10' : 'border-neutral-300 dark:border-neutral-700 text-neutral-400'}`}
              aria-label="Choose band color"
            >
              {!color && <PaletteGlyph className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex w-11 shrink-0 items-center justify-center pt-2 text-neutral-400">
              <PencilGlyph className="h-4 w-4" />
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              rows={2}
              className="min-w-0 flex-1 resize-none rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onSubmit({ bandId: bandId || undefined, color, notes: notes || undefined })
            onClose()
          }}
          className="mt-4 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          {submitLabel}
        </button>
      </Sheet>
      <ColorPalettePopup open={paletteOpen} onClose={() => setPaletteOpen(false)} selected={color} onSelect={setColor} />
    </>
  )
}
