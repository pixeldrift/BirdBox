export function todayStr(): string {
  return toDateStr(new Date())
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: string, delta: number): string {
  const d = fromDateStr(s)
  d.setDate(d.getDate() + delta)
  return toDateStr(d)
}

export function isToday(s: string): boolean {
  return s === todayStr()
}

export function formatShort(s: string): string {
  return fromDateStr(s).toLocaleDateString(undefined, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

export function formatRelativeLabel(s: string): string {
  if (isToday(s)) return 'Today'
  const diffDays = Math.round(
    (fromDateStr(todayStr()).getTime() - fromDateStr(s).getTime()) /
      86400000,
  )
  if (diffDays === 1) return 'Yesterday'
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`
  if (diffDays >= 7 && diffDays < 14) return '1 week ago'
  if (diffDays >= 14 && diffDays < 31) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 0) return formatShort(s)
  return formatShort(s)
}
