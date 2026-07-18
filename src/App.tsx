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

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export default function App() {
  const store = useBirdBoxStore()

  const [statusPopupEggId, setStatusPopupEggId] = useState<string | null>(null)
  const [buildingPickerOpen, setBuildingPickerOpen] = useState(false)
  const [boxPickerOpen, setBoxPickerOpen] = useState(false)
  const [collectPendingEggId, setCollectPendingEggId] = useState<string | null>(null)
  const [babyEditId, setBabyEditId] = useState<string | null>(null)

  const [dragVisual, setDragVisual] = useState<{ eggId: string; x: number; y: number } | null>(null)
  const [activeZone, setActiveZone] = useState<DropZone | null>(null)

  const dragInfo = useRef<{ eggId: string; startX: number; startY: number; active: boolean } | null>(null)
  const draggedFlag = useRef(false)
  const activeZoneRef = useRef<DropZone | null>(null)
  const zoneRefs = useRef<Record<DropZone, HTMLDivElement | null>>({ missing: null, discard: null, collect: null })
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
          setCollectPendingEggId(info.eggId)
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

  function handleEggActivate(eggId: string) {
    if (draggedFlag.current) {
      draggedFlag.current = false
      return
    }
    setStatusPopupEggId(eggId)
  }

  const statusEgg = store.eggs.find((e) => e.id === statusPopupEggId) ?? null
  const ghostEgg = dragVisual ? store.eggs.find((e) => e.id === dragVisual.eggId) : null
  const babyBeingEdited = store.babies.find((b) => b.id === babyEditId) ?? null

  return (
    <div className="min-h-screen bg-[#f5f4f0] px-4 py-6 dark:bg-[#121110] sm:py-10">
      <div className="mx-auto max-w-md space-y-6">
        <div className="rounded-3xl border-2 border-neutral-900 bg-white p-4 shadow-sm dark:border-neutral-100 dark:bg-neutral-900 sm:p-5">
          <Header
            buildingId={store.buildingId}
            boxId={store.boxId}
            buildingCount={store.settings.buildingCount}
            boxCount={store.settings.boxCount}
            onStepBuilding={(d) => store.setBuildingId((prev: number) => clamp(prev + d, 1, store.settings.buildingCount))}
            onStepBox={(d) => store.setBoxId((prev: number) => clamp(prev + d, 1, store.settings.boxCount))}
            onOpenBuildingPicker={() => setBuildingPickerOpen(true)}
            onOpenBoxPicker={() => setBoxPickerOpen(true)}
            selectedDate={store.selectedDate}
            onChangeDate={store.setSelectedDate}
            lastChecked={store.lastChecked}
            editMode={store.editMode}
            onSetEditMode={store.setEditMode}
            canEdit={store.canEdit}
            stats={store.stats}
          />

          <div className="mt-5 grid grid-cols-4 gap-3">
            {store.eggs.map((egg) => (
              <EggTile
                key={egg.id}
                egg={egg}
                disabled={!store.canEdit}
                dimmed={dragVisual?.eggId === egg.id}
                onActivate={() => handleEggActivate(egg.id)}
                onPointerDownDrag={(e) => handlePointerDownDrag(e, egg.id)}
              />
            ))}
            <AddEggTile disabled={!store.canEdit} onClick={() => setStatusPopupEggId(store.addEgg())} />
          </div>

          <div className="mt-4">
            <BabiesRow babies={store.babies} disabled={!store.canEdit} onSelect={setBabyEditId} />
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
        open={statusPopupEggId !== null}
        egg={statusEgg}
        onClose={() => setStatusPopupEggId(null)}
        onSelect={(status) => statusEgg && store.setEggStatus(statusEgg.id, status)}
        onDelete={() => statusEgg && store.removeEgg(statusEgg.id)}
      />

      <BuildingPickerPopup
        open={buildingPickerOpen}
        onClose={() => setBuildingPickerOpen(false)}
        count={store.settings.buildingCount}
        selected={store.buildingId}
        onSelect={store.setBuildingId}
        isDone={(id) => store.buildingHasActivity(id, store.selectedDate)}
      />

      <BoxPickerPopup
        open={boxPickerOpen}
        onClose={() => setBoxPickerOpen(false)}
        count={store.settings.boxCount}
        selected={store.boxId}
        onSelect={store.setBoxId}
        isDone={(id) => store.boxHasActivity(store.buildingId, id, store.selectedDate)}
      />

      <BandDetailsPopup
        open={collectPendingEggId !== null}
        title="Collect"
        submitLabel="Confirm collected"
        onClose={() => setCollectPendingEggId(null)}
        onSubmit={(details) => collectPendingEggId && store.sendEggToZone(collectPendingEggId, 'collect', details)}
      />

      <BandDetailsPopup
        open={babyEditId !== null}
        title="Baby"
        submitLabel="Save"
        initial={babyBeingEdited ?? undefined}
        onClose={() => setBabyEditId(null)}
        onSubmit={(details) => babyBeingEdited && store.updateBaby(babyBeingEdited.id, details)}
      />

      {dragVisual && ghostEgg && (
        <div
          className="pointer-events-none fixed z-50 w-16"
          style={{ left: dragVisual.x - 32, top: dragVisual.y - 40 }}
        >
          <div className="egg-shape flex aspect-[4/5] w-full items-center justify-center border-[3px] border-orange-500 bg-white/90 shadow-lg dark:bg-neutral-800/90">
            {(() => {
              const { Glyph, color } = eggVisual(ghostEgg.status)
              return <Glyph className={`h-7 w-7 ${color}`} />
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
