import { ChevronIcon, EraseCrumbsGlyph, RecordPencilGlyph, TriangleGlyph } from '@/components/icons'
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
      <div className="grid grid-cols-2 gap-3">
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

        <div className="clay rounded-2xl px-4 py-2 text-center">
          <div className="font-display text-lg font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
            {stats.fertile} / {stats.eggs} / {stats.babies}
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ink)', opacity: 0.5 }}>
            Fertile&nbsp;&nbsp;Eggs&nbsp;&nbsp;Babies
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const editActive = canEdit && (editMode || isTodaySelected)

  return (
    <div className="clay-inset relative flex h-11 w-24 items-center rounded-full p-1">
      <div
        className="clay-accent absolute inset-y-1 rounded-full transition-[left,right] duration-200 ease-out"
        style={{ left: editActive ? '50%' : '4px', right: editActive ? '4px' : '50%' }}
      />
      <button
        type="button"
        onClick={() => onSetEditMode(false)}
        disabled={isTodaySelected}
        title="View mode"
        className="clay-interactive relative z-10 flex h-full w-1/2 items-center justify-center disabled:cursor-default"
      >
        <RecordPencilGlyph className="h-5 w-5" style={{ color: editActive ? 'var(--ink)' : '#fff8ee', opacity: editActive ? 0.4 : 1 }} />
      </button>
      <button
        type="button"
        onClick={() => onSetEditMode(true)}
        title="Edit mode"
        className="clay-interactive relative z-10 flex h-full w-1/2 items-center justify-center"
      >
        <EraseCrumbsGlyph className="h-5 w-5" style={{ color: editActive ? '#fff8ee' : 'var(--ink)', opacity: editActive ? 1 : 0.4 }} />
      </button>
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
      <div className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={onDec}
          disabled={disableDec}
          className="p-1 transition-transform active:scale-90 disabled:opacity-30"
          aria-label={`Previous ${label}`}
        >
          <TriangleGlyph dir="left" className="h-9 w-9" />
        </button>
        <button
          type="button"
          onClick={(e) => onOpen(e.currentTarget)}
          className="clay clay-interactive font-display min-w-[4.75rem] rounded-full border-[3px] px-4 py-2.5 text-4xl font-bold tabular-nums"
          style={{ borderColor: 'var(--accent)', color: 'var(--ink)' }}
        >
          {String(value).padStart(2, '0')}
        </button>
        <button
          type="button"
          onClick={onInc}
          disabled={disableInc}
          className="p-1 transition-transform active:scale-90 disabled:opacity-30"
          aria-label={`Next ${label}`}
        >
          <TriangleGlyph dir="right" className="h-9 w-9" />
        </button>
      </div>
    </div>
  )
}
