import { NextResponse } from 'next/server'
import { getAllSets } from '@/lib/api/pokemon-tcg'
import { getPSAInfoForTcgSet } from '@/lib/utils/set-matcher'
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
    const tcgSets = await getAllSets()

    const mergedSets: MergedSet[] = tcgSets
      .map(s => {
        const psaInfo = getPSAInfoForTcgSet(s.id)
        return {
          psaSetId: psaInfo?.psaSetId || '',
          psaSetName: s.name,
          psaUrl: psaInfo?.psaUrl || '',
          tcgSetId: s.id,
          tcgSetName: s.name,
          series: s.series,
          releaseDate: s.releaseDate,
          logoUrl: s.images.logo,
          cardCount: s.total,
          hasPSAData: !!psaInfo,
        }
      })
      .sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))

    mergedSetsCache.set(cacheKey, mergedSets)
    return NextResponse.json({ sets: mergedSets })
  } catch (err) {
    console.error('[API /sets]', err)
    return NextResponse.json({ sets: [], error: 'Failed to fetch sets' }, { status: 500 })
  }
}
