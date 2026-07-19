import { useEffect, useState } from 'react'
import { Popover } from '@/components/Popover'
import { TriangleGlyph } from '@/components/icons'
import { addMonths, formatMonthYear, fromDateStr, monthGrid, startOfMonthStr, todayStr } from '@/lib/date'

interface DatePickerPopupProps {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  selectedDate: string
  onSelect: (date: string) => void
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function DatePickerPopup({ open, anchorEl, onClose, selectedDate, onSelect }: DatePickerPopupProps) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonthStr(selectedDate))

  useEffect(() => {
    if (open) setViewMonth(startOfMonthStr(selectedDate))
  }, [open, selectedDate])

  const today = todayStr()
  const cells = monthGrid(viewMonth)
  const nextMonthDisabled = addMonths(viewMonth, 1) > startOfMonthStr(today)

  return (
    <Popover open={open} anchorEl={anchorEl} onClose={onClose} widthClassName="w-[calc(100vw-2rem)] max-w-xs">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className="p-1 transition-transform active:scale-90"
          aria-label="Previous month"
        >
          <TriangleGlyph dir="left" className="h-6 w-6" />
        </button>
        <span className="font-display text-lg font-bold" style={{ color: 'var(--ink)' }}>
          {formatMonthYear(viewMonth)}
        </span>
        <button
          type="button"
          onClick={() => !nextMonthDisabled && setViewMonth((m) => addMonths(m, 1))}
          disabled={nextMonthDisabled}
          className="p-1 transition-transform active:scale-90 disabled:opacity-25"
          aria-label="Next month"
        >
          <TriangleGlyph dir="right" className="h-6 w-6" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[10px] font-bold" style={{ color: 'var(--ink)', opacity: 0.4 }}>
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />
          const isFuture = cell > today
          const isSelected = cell === selectedDate
          const isToday = cell === today
          return (
            <button
              key={cell}
              type="button"
              disabled={isFuture}
              data-popover-current={isSelected || undefined}
              onClick={() => {
                onSelect(cell)
                onClose()
              }}
              className={`font-display aspect-square rounded-lg text-xs font-bold transition-colors disabled:opacity-25 ${isSelected ? 'clay-accent-soft' : ''}`}
              style={
                !isSelected
                  ? { color: 'var(--ink)', opacity: isFuture ? 0.35 : 0.85, textDecoration: isToday ? 'underline' : undefined }
                  : undefined
              }
            >
              {fromDateStr(cell).getDate()}
            </button>
          )
        })}
      </div>
    </Popover>
  )
}
