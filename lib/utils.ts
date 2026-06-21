export function daysUntil(date: string): number {
  const target = new Date(date)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function deadlineColor(days: number): 'red' | 'amber' | 'green' {
  if (days <= 7) return 'red'
  if (days <= 30) return 'amber'
  return 'green'
}

export function formatDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
