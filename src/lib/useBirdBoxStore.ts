import { useEffect, useMemo, useState } from 'react'
import { loadData, saveData } from '@/lib/storage'
import { todayStr, isToday } from '@/lib/date'
import { recordKey, type BirdBoxData, type DailyBoxRecord, type Egg, type EggStatus, type Baby } from '@/types'

function emptyRecord(date: string, buildingId: number, boxId: number): DailyBoxRecord {
  return { date, buildingId, boxId, eggs: [], babies: [], lastModified: new Date().toISOString() }
}

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

export function useBirdBoxStore() {
  const [data, setData] = useState<BirdBoxData>(() => loadData())
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [buildingId, setBuildingId] = useState(1)
  const [boxId, setBoxId] = useState(1)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    saveData(data)
  }, [data])

  const canEdit = isToday(selectedDate) || editMode

  const key = recordKey(selectedDate, buildingId, boxId)
  const record = data.records[key]

  const activeEggs = useMemo(
    () =>
      (record?.eggs ?? []).filter(
        (e) => e.status !== 'discarded' && e.status !== 'collected' && e.status !== 'hatched',
      ),
    [record],
  )
  const babies = record?.babies ?? []

  const stats = useMemo(() => {
    const fertile = activeEggs.filter((e) => e.status === 'fertile').length
    return { fertile, eggs: activeEggs.length, babies: babies.length }
  }, [activeEggs, babies])

  const lastChecked = useMemo(() => {
    let best: string | null = null
    for (const r of Object.values(data.records)) {
      if (r.buildingId !== buildingId || r.boxId !== boxId) continue
      if (r.date >= selectedDate) continue
      if (r.eggs.length === 0 && r.babies.length === 0) continue
      if (!best || r.date > best) best = r.date
    }
    return best
  }, [data.records, buildingId, boxId, selectedDate])

  function mutateRecord(fn: (r: DailyBoxRecord) => DailyBoxRecord) {
    if (!canEdit) return
    setData((prev) => {
      const existing = prev.records[key] ?? emptyRecord(selectedDate, buildingId, boxId)
      const next = fn(existing)
      next.lastModified = new Date().toISOString()
      return { ...prev, records: { ...prev.records, [key]: next } }
    })
  }

  function addEgg(): string {
    const id = makeId()
    const egg: Egg = {
      id,
      status: 'unset',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mutateRecord((r) => ({ ...r, eggs: [...r.eggs, egg] }))
    return id
  }

  function setEggStatus(eggId: string, status: EggStatus) {
    mutateRecord((r) => {
      let eggs = r.eggs.map((e) =>
        e.id === eggId ? { ...e, status, updatedAt: new Date().toISOString() } : e,
      )
      let babiesNext = r.babies
      if (status === 'hatched') {
        const egg = r.eggs.find((e) => e.id === eggId)
        babiesNext = [
          ...r.babies,
          { id: makeId(), hatchedFromEggId: egg?.id, createdAt: new Date().toISOString() },
        ]
      }
      return { ...r, eggs, babies: babiesNext }
    })
  }

  function updateEggDetails(eggId: string, patch: Partial<Pick<Egg, 'bandId' | 'color' | 'notes'>>) {
    mutateRecord((r) => ({
      ...r,
      eggs: r.eggs.map((e) => (e.id === eggId ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e)),
    }))
  }

  function sendEggToZone(eggId: string, zone: 'missing' | 'discard' | 'collect', details?: Partial<Pick<Egg, 'bandId' | 'color' | 'notes'>>) {
    mutateRecord((r) => ({
      ...r,
      eggs: r.eggs.map((e) =>
        e.id === eggId
          ? {
              ...e,
              ...details,
              status: zone === 'missing' ? 'missing' : zone === 'discard' ? 'discarded' : 'collected',
              updatedAt: new Date().toISOString(),
            }
          : e,
      ),
    }))
  }

  function removeEgg(eggId: string) {
    mutateRecord((r) => ({ ...r, eggs: r.eggs.filter((e) => e.id !== eggId) }))
  }

  function updateBaby(babyId: string, patch: Partial<Pick<Baby, 'bandId' | 'color' | 'notes'>>) {
    mutateRecord((r) => ({
      ...r,
      babies: r.babies.map((b) => (b.id === babyId ? { ...b, ...patch } : b)),
    }))
  }

  function buildingHasActivity(bId: number, date: string) {
    return Object.values(data.records).some(
      (r) => r.buildingId === bId && r.date === date && (r.eggs.length > 0 || r.babies.length > 0),
    )
  }

  function boxHasActivity(bId: number, boxNum: number, date: string) {
    const r = data.records[recordKey(date, bId, boxNum)]
    return !!r && (r.eggs.length > 0 || r.babies.length > 0)
  }

  return {
    settings: data.settings,
    selectedDate,
    setSelectedDate,
    buildingId,
    setBuildingId,
    boxId,
    setBoxId,
    editMode,
    setEditMode,
    canEdit,
    eggs: activeEggs,
    babies,
    stats,
    lastChecked,
    addEgg,
    setEggStatus,
    updateEggDetails,
    sendEggToZone,
    removeEgg,
    updateBaby,
    buildingHasActivity,
    boxHasActivity,
  }
}

export type BirdBoxStore = ReturnType<typeof useBirdBoxStore>
