import { NextResponse } from 'next/server'
import { getAllSets } from '@/lib/api/pokemon-tcg'
import { fetchPSASets } from '@/lib/scrapers/psa-scraper'
import { psaSetIdToTcgSetId, findTcgSetForPsaSet } from '@/lib/utils/set-matcher'
import { mergedSetsCache } from '@/lib/cache/memory-cache'
import { CacheKeys } from '@/lib/cache/cache-keys'
import { MergedSet } from '@/lib/types/scored-card'

export const revalidate = 21600 // 6 hours

export async function GET() {
  const cacheKey = CacheKeys.mergedSets()
  const cached = mergedSetsCache.get(cacheKey)
  if (cached) {
    return NextResponse.json({ sets: cached })
  }

  try {
    // Fetch both in parallel
    const [tcgSets, psaSets] = await Promise.all([
      getAllSets(),
      fetchPSASets(),
    ])

    const mergedSets: MergedSet[] = psaSets.map(psaSet => {
      // Try known mapping first
      const knownTcgId = psaSetIdToTcgSetId(psaSet.psaSetId)
      const tcgSet = knownTcgId
        ? tcgSets.find(s => s.id === knownTcgId)
        : findTcgSetForPsaSet(psaSet.psaSetName, tcgSets)

      return {
        psaSetId: psaSet.psaSetId,
        psaSetName: psaSet.psaSetName,
        psaUrl: psaSet.psaUrl,
        tcgSetId: tcgSet?.id,
        tcgSetName: tcgSet?.name,
        series: tcgSet?.series,
        releaseDate: tcgSet?.releaseDate,
        logoUrl: tcgSet?.images.logo,
        cardCount: psaSet.cardCount || tcgSet?.total,
      }
    })

    // If PSA scraping returned nothing, fall back to TCG sets only
    const result: MergedSet[] = mergedSets.length > 0
      ? mergedSets.sort((a, b) => {
          const dateA = a.releaseDate || '0'
          const dateB = b.releaseDate || '0'
          return dateB.localeCompare(dateA)
        })
      : tcgSets.map(s => ({
          psaSetId: '',
          psaSetName: s.name,
          psaUrl: '',
          tcgSetId: s.id,
          tcgSetName: s.name,
          series: s.series,
          releaseDate: s.releaseDate,
          logoUrl: s.images.logo,
          cardCount: s.total,
        })).sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))

    mergedSetsCache.set(cacheKey, result)
    return NextResponse.json({ sets: result })
  } catch (err) {
    console.error('[API /sets]', err)
    return NextResponse.json({ sets: [], error: 'Failed to fetch sets' }, { status: 500 })
  }
}
