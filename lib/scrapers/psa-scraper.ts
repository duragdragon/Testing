import { PSASetPop } from '../types/psa'
import { fetchPSAWithRetry } from '../utils/rate-limiter'
import { parseSetPopFromHTML } from './psa-parser'
import { psaPopCache } from '../cache/memory-cache'
import { CacheKeys } from '../cache/cache-keys'
import { getPSAInfoForTcgSet } from '../utils/set-matcher'

/**
 * Fetch population data for a set identified by its TCG API set ID.
 * Looks up the real PSA URL from set-id-map.json.
 */
export async function fetchSetPopData(tcgSetId: string): Promise<PSASetPop> {
  const cacheKey = CacheKeys.psaSetPop(tcgSetId)
  const cached = psaPopCache.get(cacheKey)
  if (cached) return cached

  const psaInfo = getPSAInfoForTcgSet(tcgSetId)

  if (!psaInfo) {
    return {
      psaSetId: '',
      psaSetName: '',
      cards: [],
      fetchedAt: new Date().toISOString(),
    }
  }

  try {
    const res = await fetchPSAWithRetry(psaInfo.psaUrl)
    const html = await res.text()
    const { cards, setName } = parseSetPopFromHTML(html, psaInfo.psaSetId)

    const result: PSASetPop = {
      psaSetId: psaInfo.psaSetId,
      psaSetName: setName,
      cards,
      fetchedAt: new Date().toISOString(),
    }

    if (cards.length > 0) {
      psaPopCache.set(cacheKey, result)
    }
    return result
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`[PSA Scraper] Failed to fetch set ${tcgSetId} (${psaInfo.psaUrl}): ${errMsg}`)
    return {
      psaSetId: psaInfo.psaSetId,
      psaSetName: '',
      cards: [],
      fetchedAt: new Date().toISOString(),
    }
  }
}

/**
 * Fetch pop data directly by a known PSA URL (for user-provided URLs).
 */
export async function fetchSetPopByUrl(psaUrl: string, psaSetId: string): Promise<PSASetPop> {
  const cacheKey = CacheKeys.psaSetPop(`url:${psaSetId}`)
  const cached = psaPopCache.get(cacheKey)
  if (cached) return cached

  try {
    const res = await fetchPSAWithRetry(psaUrl)
    const html = await res.text()
    const { cards, setName } = parseSetPopFromHTML(html, psaSetId)

    const result: PSASetPop = {
      psaSetId,
      psaSetName: setName,
      cards,
      fetchedAt: new Date().toISOString(),
    }

    if (cards.length > 0) {
      psaPopCache.set(cacheKey, result)
    }
    return result
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`[PSA Scraper] Failed to fetch ${psaUrl}: ${errMsg}`)
    return {
      psaSetId,
      psaSetName: '',
      cards: [],
      fetchedAt: new Date().toISOString(),
    }
  }
}
