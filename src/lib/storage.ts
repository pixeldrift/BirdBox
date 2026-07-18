import type { BirdBoxData } from '@/types'

const STORAGE_KEY = 'birdbox:data:v1'

export function loadData(): BirdBoxData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as BirdBoxData
  } catch {
    // fall through to defaults
  }
  return {
    settings: { buildingCount: 6, boxCount: 100 },
    records: {},
  }
}

export function saveData(data: BirdBoxData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // storage full or unavailable; prototype-level no-op
  }
}
