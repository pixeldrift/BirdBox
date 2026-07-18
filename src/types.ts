export type EggStatus =
  | 'unset'
  | 'infertile'
  | 'fertile'
  | 'missing'
  | 'broken'
  | 'dead-in-shell'
  | 'hatched'
  | 'discarded'
  | 'collected'

export const EGG_STATUS_OPTIONS: {
  status: Exclude<EggStatus, 'unset' | 'discarded' | 'collected'>
  label: string
}[] = [
  { status: 'infertile', label: 'Infertile' },
  { status: 'fertile', label: 'Fertile' },
  { status: 'missing', label: 'Missing' },
  { status: 'broken', label: 'Broken' },
  { status: 'dead-in-shell', label: 'Dead in Shell' },
  { status: 'hatched', label: 'Hatched' },
]

export interface Egg {
  id: string
  status: EggStatus
  bandId?: string
  color?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Baby {
  id: string
  bandId?: string
  color?: string
  notes?: string
  hatchedFromEggId?: string
  createdAt: string
}

export interface DailyBoxRecord {
  date: string
  buildingId: number
  boxId: number
  eggs: Egg[]
  babies: Baby[]
  lastModified: string
}

export interface BirdBoxSettings {
  buildingCount: number
  boxCount: number
}

export interface BirdBoxData {
  settings: BirdBoxSettings
  records: Record<string, DailyBoxRecord>
}

export function recordKey(date: string, buildingId: number, boxId: number) {
  return `${date}|${buildingId}|${boxId}`
}
