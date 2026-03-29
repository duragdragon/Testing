export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

export function formatRatio(numerator: number, denominator: number): string {
  if (denominator === 0) return '—'
  return (numerator / denominator).toFixed(2)
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

export function formatPrice(price?: number): string {
  if (!price) return '—'
  return `$${price.toFixed(2)}`
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    const [year, month, day] = dateStr.split('/')
    const date = new Date(`${year}-${month}-${day}`)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}
