import { PSASetPop, PSASetInfo } from '../types/psa'
import { fetchPSAWithRetry } from '../utils/rate-limiter'
import { parseSetPopFromHTML, parsePSASetsFromHTML } from './psa-parser'
import { psaPopCache, psaSetsCache } from '../cache/memory-cache'
import { CacheKeys } from '../cache/cache-keys'

const PSA_POKEMON_CATEGORY_URL = 'https://www.psacard.com/pop/trading-cards/10002/pokemon'

export async function fetchSetPopData(psaSetId: string): Promise<PSASetPop> {
  const cacheKey = CacheKeys.psaSetPop(psaSetId)
  const cached = psaPopCache.get(cacheKey)
  if (cached) return cached

  const url = `${PSA_POKEMON_CATEGORY_URL}/${psaSetId}`

  try {
    const res = await fetchPSAWithRetry(url)
    const html = await res.text()
    const { cards, setName } = parseSetPopFromHTML(html, psaSetId)

    const result: PSASetPop = {
      psaSetId,
      psaSetName: setName,
      cards,
      fetchedAt: new Date().toISOString(),
    }

    psaPopCache.set(cacheKey, result)
    return result
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`[PSA Scraper] Failed to fetch set ${psaSetId}: ${errMsg}`)

    // Return empty result rather than throwing — UI handles gracefully
    return {
      psaSetId,
      psaSetName: 'Unknown Set',
      cards: [],
      fetchedAt: new Date().toISOString(),
    }
  }
}

export async function fetchPSASets(): Promise<PSASetInfo[]> {
  const cacheKey = CacheKeys.psaSets()
  const cached = psaSetsCache.get(cacheKey)
  if (cached) return cached

  try {
    const res = await fetchPSAWithRetry(PSA_POKEMON_CATEGORY_URL)
    const html = await res.text()
    const sets = parsePSASetsFromHTML(html)

    if (sets.length > 0) {
      psaSetsCache.set(cacheKey, sets)
    }

    return sets
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`[PSA Scraper] Failed to fetch PSA sets: ${errMsg}`)
    return []
  }
}
