import { NextResponse } from 'next/server'
import { getAllSets, getSetCards, getMarketPrice } from '@/lib/api/pokemon-tcg'
import { getCardsWithFewestTens, getGrade9Count, GMCard } from '@/lib/api/gradedmetrics'
import { buildScoredCard } from '@/lib/scoring/investment-score'
import { opportunitiesCache } from '@/lib/cache/memory-cache'
import { CacheKeys } from '@/lib/cache/cache-keys'
import { ScoredCard } from '@/lib/types/scored-card'
import { TCGCard } from '@/lib/types/tcg'
import { PSAGrades } from '@/lib/types/psa'
import gmSetMapData from '@/lib/data/gradedmetrics-set-map.json'

export const revalidate = 3600

// Build reverse map: GM set code → TCG set ID
const GM_SET_MAP = gmSetMapData.sets as Record<string, string>
const TCG_BY_GM: Record<string, string> = {}
for (const [tcgId, gmCode] of Object.entries(GM_SET_MAP)) {
  TCG_BY_GM[gmCode] = tcgId
}

function buildGrades(psa10: number, psa9: number, total: number): PSAGrades {
  return {
    auth: 0, grade1: 0, grade15: 0, grade2: 0, grade25: 0,
    grade3: 0, grade35: 0, grade4: 0, grade45: 0, grade5: 0,
    grade55: 0, grade6: 0, grade65: 0, grade7: 0, grade75: 0,
    grade8: 0, grade85: 0,
    grade9: psa9,
    grade10: psa10,
    total,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const minScore = parseInt(searchParams.get('minScore') ?? '60', 10)
  const series = searchParams.get('series')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)

  const cacheKey = CacheKeys.opportunities()
  let allScoredCards = opportunitiesCache.get(cacheKey)

  if (!allScoredCards) {
    try {
      // Fetch fewest-tens cards (globally low PSA 10 population)
      const [fewestTens, tcgSets] = await Promise.all([
        getCardsWithFewestTens(),
        getAllSets(),
      ])

      const tcgSetById = new Map(tcgSets.map(s => [s.id, s]))

      // Group fewest-tens cards by GM set code
      const cardsByGmSet = new Map<string, GMCard[]>()
      for (const card of fewestTens) {
        const gmSetCode = card.s
        if (!gmSetCode) continue
        const tcgSetId = TCG_BY_GM[gmSetCode]
        if (!tcgSetId) continue // skip sets we don't have TCG mapping for
        if (!cardsByGmSet.has(gmSetCode)) cardsByGmSet.set(gmSetCode, [])
        cardsByGmSet.get(gmSetCode)!.push(card)
      }

      // Fetch TCG cards for each relevant set
      const gmSetCodes = Array.from(cardsByGmSet.keys())
      const tcgCardsBySet = new Map<string, Map<string, TCGCard>>()

      const CHUNK_SIZE = 5
      for (let i = 0; i < gmSetCodes.length; i += CHUNK_SIZE) {
        const chunk = gmSetCodes.slice(i, i + CHUNK_SIZE)
        await Promise.all(chunk.map(async (gmCode) => {
          const tcgSetId = TCG_BY_GM[gmCode]
          try {
            const cards = await getSetCards(tcgSetId)
            const byNumber = new Map<string, TCGCard>()
            const byName = new Map<string, TCGCard>()
            for (const c of cards) {
              byNumber.set(c.number.replace(/^0+/, ''), c)
              byNumber.set(c.number, c)
              byName.set(c.name.toLowerCase(), c)
            }
            tcgCardsBySet.set(gmCode, byNumber)
            // Also store name map with a prefix to avoid key collision
            tcgCardsBySet.set(`${gmCode}:name`, byName)
          } catch {
            // skip sets that fail
          }
        }))
      }

      // Build scored cards from fewest-tens data
      const results: ScoredCard[] = []
      for (const [gmCode, gmCards] of cardsByGmSet) {
        const tcgSetId = TCG_BY_GM[gmCode]
        const tcgSet = tcgSetById.get(tcgSetId)
        const setName = tcgSet?.name ?? tcgSetId

        const byNumber = tcgCardsBySet.get(gmCode)
        const byName = tcgCardsBySet.get(`${gmCode}:name`)

        for (const gmCard of gmCards) {
          if (gmCard._) continue // skip archived

          const cardNum = String(gmCard.e ?? '').replace(/^0+/, '')
          const tcgCard = byNumber?.get(cardNum)
            ?? byName?.get(gmCard.n?.toLowerCase() ?? '')

          const psa10 = gmCard.ps ?? 0
          const psa9 = getGrade9Count(gmCard)
          const total = gmCard.t ?? 0

          const scored = buildScoredCard(
            {
              specId: gmCard.i,
              cardNumber: String(gmCard.e ?? ''),
              name: gmCard.n ?? '',
              variety: gmCard.x?.join(', ') ?? '',
              grades: buildGrades(psa10, psa9, total),
              psaSetId: gmCode,
            },
            setName,
            tcgCard,
            tcgCard ? getMarketPrice(tcgCard) : undefined
          )
          results.push(scored)
        }
      }

      allScoredCards = results
      opportunitiesCache.set(cacheKey, allScoredCards)
    } catch (err) {
      console.error('[API /opportunities]', err)
      return NextResponse.json({ cards: [], error: 'Failed to compute opportunities' }, { status: 500 })
    }
  }

  // Apply filters
  let filtered = allScoredCards.filter(c => c.investmentScore >= minScore)

  if (series) {
    filtered = filtered.filter(c => c.series?.toLowerCase() === series.toLowerCase())
  }

  filtered.sort((a, b) => b.investmentScore - a.investmentScore)

  return NextResponse.json({
    cards: filtered.slice(0, limit),
    total: filtered.length,
  })
}
