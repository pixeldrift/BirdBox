import { ChevronIcon, PencilGlyph } from '@/components/icons'
import { addDays, formatRelativeLabel, formatShort, todayStr } from '@/lib/date'

interface HeaderProps {
  buildingId: number
  boxId: number
  buildingCount: number
  boxCount: number
  onStepBuilding: (delta: number) => void
  onStepBox: (delta: number) => void
  onOpenBuildingPicker: () => void
  onOpenBoxPicker: () => void
  selectedDate: string
  onChangeDate: (date: string) => void
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

      <div className="flex items-center justify-between gap-3 border-t border-b border-neutral-200 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChangeDate(addDays(selectedDate, -1))}
            className="rounded-md p-1 text-neutral-400 hover:text-orange-500"
            aria-label="Previous day"
          >
            <ChevronIcon dir="left" className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1 text-sm font-semibold dark:border-neutral-700"
            >
              {formatRelativeLabel(selectedDate)}
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <input
              type="date"
              value={selectedDate}
              max={todayStr()}
              onChange={(e) => e.target.value && onChangeDate(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Pick a date"
            />
          </div>
          <button
            type="button"
            onClick={() => !isTodaySelected && onChangeDate(addDays(selectedDate, 1))}
            disabled={isTodaySelected}
            className="rounded-md p-1 text-neutral-400 hover:text-orange-500 disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronIcon dir="right" className="h-4 w-4" />
          </button>
        </div>

        <div className="text-right text-xs text-neutral-500">
          <div>Last Checked:</div>
          <div className="font-semibold text-neutral-800 dark:text-neutral-200">
            {lastChecked ? `${formatRelativeLabel(lastChecked)} (${formatShort(lastChecked)})` : 'No prior record'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex overflow-hidden rounded-xl border border-neutral-300 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => onSetEditMode(false)}
            disabled={isTodaySelected}
            title="View mode"
            className={`flex items-center justify-center px-3 py-2 ${!editMode || isTodaySelected ? 'bg-neutral-100 dark:bg-neutral-800' : ''} disabled:opacity-40`}
          >
            <PencilGlyph className="h-4 w-4 text-neutral-400" />
          </button>
          <button
            type="button"
            onClick={() => onSetEditMode(true)}
            title="Edit mode"
            className={`flex items-center justify-center border-l border-neutral-300 px-3 py-2 dark:border-neutral-700 ${canEdit && (editMode || isTodaySelected) ? 'bg-orange-500' : ''}`}
          >
            <PencilGlyph className={`h-4 w-4 ${canEdit && (editMode || isTodaySelected) ? 'text-white' : 'text-neutral-400'}`} />
          </button>
        </div>

        <div className="rounded-lg border border-neutral-300 px-3 py-1.5 text-center text-sm font-bold dark:border-neutral-700">
          {stats.fertile} / {stats.eggs} / {stats.babies}
          <div className="text-[9px] font-normal text-neutral-500">Fertile&nbsp;&nbsp;Eggs&nbsp;&nbsp;Babies</div>
        </div>
      </div>
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
  onOpen: () => void
  disableDec: boolean
  disableInc: boolean
}) {
  return (
    <div className="text-center">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onDec}
          disabled={disableDec}
          className="rounded-full p-1 text-orange-500 disabled:opacity-30"
          aria-label={`Previous ${label}`}
        >
          <ChevronIcon dir="left" className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="min-w-[3.5rem] rounded-lg border-2 border-neutral-900 px-3 py-1 text-2xl font-bold tabular-nums dark:border-neutral-100"
        >
          {String(value).padStart(2, '0')}
        </button>
        <button
          type="button"
          onClick={onInc}
          disabled={disableInc}
          className="rounded-full p-1 text-orange-500 disabled:opacity-30"
          aria-label={`Next ${label}`}
        >
          <ChevronIcon dir="right" className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
