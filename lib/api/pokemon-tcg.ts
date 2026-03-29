import { TCGSet, TCGCard, TCGSetsResponse, TCGCardsResponse } from '../types/tcg'
import { tcgSetsCache, tcgCardsCache } from '../cache/memory-cache'
import { CacheKeys } from '../cache/cache-keys'
import { tcgRateLimiter } from '../utils/rate-limiter'

const BASE_URL = 'https://api.pokemontcg.io/v2'

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (process.env.POKEMON_TCG_API_KEY) {
    headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY
  }
  return headers
}

async function tcgFetch<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`
  const res = await tcgRateLimiter.throttledFetch(url, {
    headers: getHeaders(),
    next: { revalidate: 86400 }, // 24h revalidation for Next.js cache
  })

  if (!res.ok) {
    throw new Error(`Pokemon TCG API error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

export async function getAllSets(): Promise<TCGSet[]> {
  const cacheKey = CacheKeys.tcgSets()
  const cached = tcgSetsCache.get(cacheKey)
  if (cached) return cached

  try {
    // Fetch all sets (paginate if needed)
    const allSets: TCGSet[] = []
    let page = 1
    const pageSize = 250

    while (true) {
      const data = await tcgFetch<TCGSetsResponse>(`/sets?page=${page}&pageSize=${pageSize}&orderBy=releaseDate`)
      allSets.push(...data.data)
      if (allSets.length >= data.totalCount) break
      page++
    }

    tcgSetsCache.set(cacheKey, allSets)
    return allSets
  } catch (err) {
    console.error('[Pokemon TCG] Failed to fetch sets:', err)
    return []
  }
}

export async function getSetCards(tcgSetId: string): Promise<TCGCard[]> {
  const cacheKey = CacheKeys.tcgSetCards(tcgSetId)
  const cached = tcgCardsCache.get(cacheKey)
  if (cached) return cached

  try {
    const allCards: TCGCard[] = []
    let page = 1
    const pageSize = 250

    while (true) {
      const data = await tcgFetch<TCGCardsResponse>(
        `/cards?q=set.id:${tcgSetId}&page=${page}&pageSize=${pageSize}&orderBy=number`
      )
      allCards.push(...data.data)
      if (allCards.length >= data.totalCount) break
      page++
    }

    tcgCardsCache.set(cacheKey, allCards)
    return allCards
  } catch (err) {
    console.error(`[Pokemon TCG] Failed to fetch cards for set ${tcgSetId}:`, err)
    return []
  }
}

export function getMarketPrice(card: TCGCard): number | undefined {
  const prices = card.tcgplayer?.prices
  if (!prices) return undefined

  // Try holofoil first, then normal, then first edition
  const priceObj = prices.holofoil || prices.normal || prices['1stEditionHolofoil'] || prices.reverseHolofoil
  return priceObj?.market ?? priceObj?.mid ?? undefined
}
