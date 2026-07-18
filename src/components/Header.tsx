import { Fragment } from 'react'
import { ChevronIcon, RecordPencilGlyph, TriangleGlyph } from '@/components/icons'
import { addDays, formatRelativeLabel, formatShort, todayStr } from '@/lib/date'

interface HeaderProps {
  buildingId: number
  boxId: number
  buildingCount: number
  boxCount: number
  onStepBuilding: (delta: number) => void
  onStepBox: (delta: number) => void
  onOpenBuildingPicker: (anchor: HTMLElement) => void
  onOpenBoxPicker: (anchor: HTMLElement) => void
  selectedDate: string
  onChangeDate: (date: string) => void
  onOpenDatePicker: (anchor: HTMLElement) => void
  lastChecked: string | null
  editMode: boolean
  onSetEditMode: (v: boolean) => void
  canEdit: boolean
  stats: { fertile: number; eggs: number; babies: number }
}

export function Header({
  buildingId,
  boxId,
  buildingCount,
  boxCount,
  onStepBuilding,
  onStepBox,
  onOpenBuildingPicker,
  onOpenBoxPicker,
  selectedDate,
  onChangeDate,
  onOpenDatePicker,
  lastChecked,
  editMode,
  onSetEditMode,
  canEdit,
  stats,
}: HeaderProps) {
  const isTodaySelected = selectedDate === todayStr()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1">
        <NumberNav
          label="Building"
          value={buildingId}
          onDec={() => onStepBuilding(-1)}
          onInc={() => onStepBuilding(1)}
          onOpen={onOpenBuildingPicker}
          disableDec={buildingId <= 1}
          disableInc={buildingId >= buildingCount}
        />
        <NumberNav
          label="Box"
          value={boxId}
          onDec={() => onStepBox(-1)}
          onInc={() => onStepBox(1)}
          onOpen={onOpenBoxPicker}
          disableDec={boxId <= 1}
          disableInc={boxId >= boxCount}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t-2 border-b-2 border-[var(--cream-inset)] py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChangeDate(addDays(selectedDate, -1))}
            className="rounded-md p-1 text-[var(--ink)]/40 transition-colors hover:text-[var(--accent)]"
            aria-label="Previous day"
          >
            <ChevronIcon dir="left" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => onOpenDatePicker(e.currentTarget)}
            className="clay clay-sm clay-interactive flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold"
          >
            {formatRelativeLabel(selectedDate)}
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[var(--accent)]" fill="none" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => !isTodaySelected && onChangeDate(addDays(selectedDate, 1))}
            disabled={isTodaySelected}
            className="rounded-md p-1 text-[var(--ink)]/40 transition-colors hover:text-[var(--accent)] disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronIcon dir="right" className="h-4 w-4" />
          </button>
        </div>

        <div className="text-right text-xs" style={{ color: 'var(--ink)', opacity: 0.55 }}>
          <div>Last Checked:</div>
          <div className="font-bold" style={{ opacity: 1 }}>
            {lastChecked ? `${formatRelativeLabel(lastChecked)} (${formatShort(lastChecked)})` : 'No prior record'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <EditModeToggle editMode={editMode} isTodaySelected={isTodaySelected} canEdit={canEdit} onSetEditMode={onSetEditMode} />

        <StatsBox stats={stats} />
      </div>
    </div>
  )
}

// Sized to match the height of the StatsBox pill it shares a row with.
const TOGGLE_W = 110
const TOGGLE_H = 50
const TOGGLE_PAD = 3
const THUMB_W = 64
const ICON_BTN_W = 32
const ICON_BTN_OFFSET = 8
const ICON_SIZE = 28
const EMBOSS = { filter: 'drop-shadow(0 1px 1px rgba(64,30,0,0.4))' } as const

function EditModeToggle({
  editMode,
  isTodaySelected,
  canEdit,
  onSetEditMode,
}: {
  editMode: boolean
  isTodaySelected: boolean
  canEdit: boolean
  onSetEditMode: (v: boolean) => void
}) {
  // "Record" (today's default) docks the thumb right; "Revise" (unlock a past date) docks it left.
  const recordActive = canEdit && (editMode || isTodaySelected)

  return (
    <div className="clay-inset relative rounded-full" style={{ width: TOGGLE_W, height: TOGGLE_H, padding: TOGGLE_PAD }}>
      <div
        className="clay-accent-soft absolute rounded-full transition-[left,right] duration-200 ease-out"
        style={
          recordActive
            ? { top: TOGGLE_PAD, bottom: TOGGLE_PAD, right: TOGGLE_PAD, width: THUMB_W }
            : { top: TOGGLE_PAD, bottom: TOGGLE_PAD, left: TOGGLE_PAD, width: THUMB_W }
        }
      />
      <button
        type="button"
        onClick={() => onSetEditMode(false)}
        disabled={isTodaySelected}
        title="Revise"
        className="clay-interactive absolute flex items-center justify-center rounded-full disabled:cursor-default"
        style={{ left: ICON_BTN_OFFSET, top: TOGGLE_PAD, bottom: TOGGLE_PAD, width: ICON_BTN_W }}
      >
        <RecordPencilGlyph
          style={{
            height: ICON_SIZE,
            width: ICON_SIZE,
            color: recordActive ? 'var(--ink)' : '#fff8ee',
            opacity: recordActive ? 0.4 : 1,
            transform: 'rotate(180deg)',
            ...(recordActive ? undefined : EMBOSS),
          }}
        />
      </button>
      <button
        type="button"
        onClick={() => onSetEditMode(true)}
        title="Record"
        className="clay-interactive absolute flex items-center justify-center rounded-full"
        style={{ right: ICON_BTN_OFFSET, top: TOGGLE_PAD, bottom: TOGGLE_PAD, width: ICON_BTN_W }}
      >
        <RecordPencilGlyph
          style={{
            height: ICON_SIZE,
            width: ICON_SIZE,
            color: recordActive ? '#fff8ee' : 'var(--ink)',
            opacity: recordActive ? 1 : 0.4,
            ...(recordActive ? EMBOSS : undefined),
          }}
        />
      </button>
    </div>
  )
}

function StatsBox({ stats }: { stats: { fertile: number; eggs: number; babies: number } }) {
  const cols = [
    { value: stats.fertile, label: 'Fertile' },
    { value: stats.eggs, label: 'Eggs' },
    { value: stats.babies, label: 'Babies' },
  ]
  return (
    <div className="clay flex items-start gap-2 rounded-2xl px-4 py-2">
      {cols.map((col, i) => (
        <Fragment key={col.label}>
          {i > 0 && (
            <span className="font-display pt-0.5 text-lg font-bold" style={{ color: 'var(--ink)', opacity: 0.3 }}>
              /
            </span>
          )}
          <div className="flex flex-col items-center">
            <span className="font-display text-lg leading-tight font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
              {col.value}
            </span>
            <span className="text-[9px] font-semibold whitespace-nowrap uppercase tracking-wide" style={{ color: 'var(--ink)', opacity: 0.5 }}>
              {col.label}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

function NumberNav({
  label,
  value,
  onDec,
  onInc,
  onOpen,
  disableDec,
  disableInc,
}: {
  label: string
  value: number
  onDec: () => void
  onInc: () => void
  onOpen: (anchor: HTMLElement) => void
  disableDec: boolean
  disableInc: boolean
}) {
  return (
    <div className="text-center">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink)', opacity: 0.55 }}>
        {label}
      </div>
      <div className="flex items-center justify-center gap-0">
        <button
          type="button"
          onClick={onDec}
          disabled={disableDec}
          className="p-0 transition-transform active:scale-90 disabled:opacity-30"
          aria-label={`Previous ${label}`}
        >
          <TriangleGlyph dir="left" className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={(e) => onOpen(e.currentTarget)}
          className="clay clay-interactive font-display rounded-2xl border-[3px] px-1 py-1 text-7xl leading-none font-extrabold tabular-nums"
          style={{ borderColor: 'var(--accent)', color: 'var(--ink)' }}
        >
          {String(value).padStart(2, '0')}
        </button>
        <button
          type="button"
          onClick={onInc}
          disabled={disableInc}
          className="p-0 transition-transform active:scale-90 disabled:opacity-30"
          aria-label={`Next ${label}`}
        >
          <TriangleGlyph dir="right" className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
