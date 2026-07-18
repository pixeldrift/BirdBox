import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useBirdBoxStore } from '@/lib/useBirdBoxStore'
import { Header } from '@/components/Header'
import { EggTile, AddEggTile, eggVisual } from '@/components/EggTile'
import { BabiesRow } from '@/components/BabiesRow'
import { ActionZones, type DropZone } from '@/components/ActionZones'
import { StatusPopup } from '@/components/StatusPopup'
import { BuildingPickerPopup } from '@/components/BuildingPickerPopup'
import { BoxPickerPopup } from '@/components/BoxPickerPopup'
import { BandDetailsPopup } from '@/components/BandDetailsPopup'
import { DatePickerPopup } from '@/components/DatePickerPopup'

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export default function App() {
  const store = useBirdBoxStore()

  const [statusPopup, setStatusPopup] = useState<{ eggId: string; anchor: HTMLElement } | null>(null)
  const [buildingPickerAnchor, setBuildingPickerAnchor] = useState<HTMLElement | null>(null)
  const [boxPickerAnchor, setBoxPickerAnchor] = useState<HTMLElement | null>(null)
  const [datePickerAnchor, setDatePickerAnchor] = useState<HTMLElement | null>(null)
  const [collectPending, setCollectPending] = useState<{ eggId: string; anchor: HTMLElement | null } | null>(null)
  const [babyEdit, setBabyEdit] = useState<{ babyId: string; anchor: HTMLElement } | null>(null)

  const [dragVisual, setDragVisual] = useState<{ eggId: string; x: number; y: number } | null>(null)
  const [activeZone, setActiveZone] = useState<DropZone | null>(null)

  const dragInfo = useRef<{ eggId: string; startX: number; startY: number; active: boolean } | null>(null)
  const draggedFlag = useRef(false)
  const activeZoneRef = useRef<DropZone | null>(null)
  const zoneRefs = useRef<Record<DropZone, HTMLDivElement | null>>({ missing: null, discard: null, collect: null })
  const gridRef = useRef<HTMLDivElement>(null)
  const storeRef = useRef(store)
  storeRef.current = store

  useEffect(() => {
    function move(e: PointerEvent) {
      const info = dragInfo.current
      if (!info) return
      const dx = e.clientX - info.startX
      const dy = e.clientY - info.startY
      if (!info.active && Math.hypot(dx, dy) > 10) {
        info.active = true
        draggedFlag.current = true
      }
      if (info.active) {
        setDragVisual({ eggId: info.eggId, x: e.clientX, y: e.clientY })
        let hit: DropZone | null = null
        for (const zone of ['missing', 'discard', 'collect'] as DropZone[]) {
          const el = zoneRefs.current[zone]
          if (!el) continue
          const r = el.getBoundingClientRect()
          if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
            hit = zone
            break
          }
        }
        activeZoneRef.current = hit
        setActiveZone(hit)
      }
    }
    function up() {
      const info = dragInfo.current
      const zone = activeZoneRef.current
      if (info?.active && zone) {
        if (zone === 'collect') {
          setCollectPending({ eggId: info.eggId, anchor: zoneRefs.current.collect })
        } else {
          storeRef.current.sendEggToZone(info.eggId, zone)
        }
      }
      dragInfo.current = null
      activeZoneRef.current = null
      setDragVisual(null)
      setActiveZone(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  function handlePointerDownDrag(e: ReactPointerEvent, eggId: string) {
    if (!store.canEdit) return
    draggedFlag.current = false
    dragInfo.current = { eggId, startX: e.clientX, startY: e.clientY, active: false }
  }

  function handleEggActivate(eggId: string, anchor: HTMLElement) {
    if (draggedFlag.current) {
      draggedFlag.current = false
      return
    }
    setStatusPopup({ eggId, anchor })
  }

  const statusEgg = store.eggs.find((e) => e.id === statusPopup?.eggId) ?? null
  const ghostEgg = dragVisual ? store.eggs.find((e) => e.id === dragVisual.eggId) : null
  const babyBeingEdited = store.babies.find((b) => b.id === babyEdit?.babyId) ?? null

  return (
    <div className="min-h-screen p-2 sm:p-4" style={{ background: 'var(--cream-bg)' }}>
      <div className="mx-auto flex min-h-[calc(100dvh-1rem)] w-full max-w-md flex-col sm:min-h-[calc(100dvh-2rem)]">
        <div
          className="flex flex-1 flex-col rounded-[2rem] border-[6px] p-4 shadow-[0_18px_36px_rgba(36,31,23,0.22)] sm:p-5"
          style={{ borderColor: 'var(--ink)', background: 'var(--cream-panel)' }}
        >
          <Header
            buildingId={store.buildingId}
            boxId={store.boxId}
            buildingCount={store.settings.buildingCount}
            boxCount={store.settings.boxCount}
            onStepBuilding={(d) => store.setBuildingId((prev: number) => clamp(prev + d, 1, store.settings.buildingCount))}
            onStepBox={(d) => store.setBoxId((prev: number) => clamp(prev + d, 1, store.settings.boxCount))}
            onOpenBuildingPicker={setBuildingPickerAnchor}
            onOpenBoxPicker={setBoxPickerAnchor}
            selectedDate={store.selectedDate}
            onChangeDate={store.setSelectedDate}
            onOpenDatePicker={setDatePickerAnchor}
            lastChecked={store.lastChecked}
            editMode={store.editMode}
            onSetEditMode={store.setEditMode}
            canEdit={store.canEdit}
            stats={store.stats}
          />

          <div ref={gridRef} className="mt-5 grid grid-cols-4 gap-3">
            {store.eggs.map((egg) => (
              <EggTile
                key={egg.id}
                egg={egg}
                disabled={!store.canEdit}
                dimmed={dragVisual?.eggId === egg.id}
                onActivate={(anchor) => handleEggActivate(egg.id, anchor)}
                onPointerDownDrag={(e) => handlePointerDownDrag(e, egg.id)}
              />
            ))}
            <AddEggTile
              disabled={!store.canEdit}
              onClick={() => {
                const id = store.addEgg()
                // anchor to the grid itself; the new tile isn't in the DOM yet this tick
                setStatusPopup({ eggId: id, anchor: gridRef.current ?? document.body })
              }}
            />
          </div>

          <div className="mt-4">
            <BabiesRow babies={store.babies} disabled={!store.canEdit} onSelect={(babyId, anchor) => setBabyEdit({ babyId, anchor })} />
          </div>

          <div className="mt-6">
            <ActionZones
              activeZone={activeZone}
              disabled={!store.canEdit}
              registerRef={(zone, el) => {
                zoneRefs.current[zone] = el
              }}
            />
          </div>
        </div>
      </div>

      <StatusPopup
        open={statusPopup !== null}
        egg={statusEgg}
        anchorEl={statusPopup?.anchor ?? null}
        onClose={() => setStatusPopup(null)}
        onSelect={(status) => statusEgg && store.setEggStatus(statusEgg.id, status)}
        onDelete={() => statusEgg && store.removeEgg(statusEgg.id)}
      />

      <BuildingPickerPopup
        open={buildingPickerAnchor !== null}
        anchorEl={buildingPickerAnchor}
        onClose={() => setBuildingPickerAnchor(null)}
        count={store.settings.buildingCount}
        selected={store.buildingId}
        onSelect={store.setBuildingId}
        isDone={(id) => store.buildingHasActivity(id, store.selectedDate)}
      />

      <BoxPickerPopup
        open={boxPickerAnchor !== null}
        anchorEl={boxPickerAnchor}
        onClose={() => setBoxPickerAnchor(null)}
        count={store.settings.boxCount}
        selected={store.boxId}
        onSelect={store.setBoxId}
        isDone={(id) => store.boxHasActivity(store.buildingId, id, store.selectedDate)}
      />

      <BandDetailsPopup
        open={collectPending !== null}
        anchorEl={collectPending?.anchor ?? null}
        title="Collect"
        submitLabel="Confirm collected"
        onClose={() => setCollectPending(null)}
        onSubmit={(details) => collectPending && store.sendEggToZone(collectPending.eggId, 'collect', details)}
      />

      <DatePickerPopup
        open={datePickerAnchor !== null}
        anchorEl={datePickerAnchor}
        onClose={() => setDatePickerAnchor(null)}
        selectedDate={store.selectedDate}
        onSelect={store.setSelectedDate}
      />

      <BandDetailsPopup
        open={babyEdit !== null}
        anchorEl={babyEdit?.anchor ?? null}
        title="Baby"
        submitLabel="Save"
        initial={babyBeingEdited ?? undefined}
        onClose={() => setBabyEdit(null)}
        onSubmit={(details) => babyBeingEdited && store.updateBaby(babyBeingEdited.id, details)}
      />

      {dragVisual && ghostEgg && (
        <div
          className="pointer-events-none fixed z-50 w-16"
          style={{ left: dragVisual.x - 32, top: dragVisual.y - 40 }}
        >
          <div
            className="egg-shape clay-egg flex aspect-[4/5] w-full items-center justify-center border-[3px]"
            style={{ borderColor: 'var(--accent)' }}
          >
            {(() => {
              const { Glyph, color } = eggVisual(ghostEgg.status)
              return <Glyph className="h-7 w-7" style={{ color }} />
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
