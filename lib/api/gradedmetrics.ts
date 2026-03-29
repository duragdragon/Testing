import { LRUCache } from 'lru-cache'

const BASE_URL = 'https://raw.githubusercontent.com/gradedmetrics/api/master/docs'

export interface GMSet {
  i: string     // set code (e.g. "18ll")
  n: string     // set name
  c?: number    // card count
  j?: number[]  // history
}

export interface GMCard {
  i: string       // card id
  n: string       // name
  e?: number      // card number
  ps?: number     // PSA 10 count (psa10Grades)
  t?: number      // total graded
  x?: string[]    // variants (e.g. ["Holofoil"])
  f?: Record<string, unknown>  // grade breakdown
  _?: boolean     // archived
  s?: string      // set code
  w?: number      // score
  ra?: number     // rank
}

const setsCache = new LRUCache<string, GMSet[]>({ max: 1, ttl: 1000 * 60 * 60 * 12 })
const setCardsCache = new LRUCache<string, GMCard[]>({ max: 300, ttl: 1000 * 60 * 60 * 2 })
const fewestTensCache = new LRUCache<string, GMCard[]>({ max: 1, ttl: 1000 * 60 * 60 * 2 })

async function gmFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/${path}`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`GradedMetrics fetch failed: ${res.status} ${path}`)
  return res.json()
}

export async function getGMSets(): Promise<GMSet[]> {
  const cached = setsCache.get('sets')
  if (cached) return cached

  const data = await gmFetch<GMSet[]>('sets.json')
  setsCache.set('sets', data)
  return data
}

export async function getGMSetCards(gmSetCode: string): Promise<GMCard[]> {
  const cached = setCardsCache.get(gmSetCode)
  if (cached) return cached

  try {
    const data = await gmFetch<GMCard[]>(`sets/${gmSetCode}.json`)
    const cards = Array.isArray(data) ? data : []
    setCardsCache.set(gmSetCode, cards)
    return cards
  } catch {
    // Some sets may not have a file — return empty
    return []
  }
}

export async function getCardsWithFewestTens(): Promise<GMCard[]> {
  const cached = fewestTensCache.get('fewest-tens')
  if (cached) return cached

  const data = await gmFetch<GMCard[]>('cards-by-fewest-10s.json')
  const cards = Array.isArray(data) ? data : []
  fewestTensCache.set('fewest-tens', cards)
  return cards
}

// Extract PSA 9 count from the grades breakdown object
// GradedMetrics stores grades as f["9"] = { value } or f["9"] = number
export function getGrade9Count(card: GMCard): number {
  if (!card.f) return 0
  const g9 = card.f['9']
  if (typeof g9 === 'number') return g9
  if (typeof g9 === 'object' && g9 !== null) {
    const obj = g9 as Record<string, unknown>
    // Try common field names for the count
    return Number(obj.h ?? obj.g ?? obj.c ?? obj.t ?? 0)
  }
  return 0
}
