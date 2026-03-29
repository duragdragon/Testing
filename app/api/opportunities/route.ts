import { NextResponse } from 'next/server'
import { getAllSets } from '@/lib/api/pokemon-tcg'
import { getSetCards, getMarketPrice } from '@/lib/api/pokemon-tcg'
import { buildScoredCard } from '@/lib/scoring/investment-score'
import { opportunitiesCache } from '@/lib/cache/memory-cache'
import { CacheKeys } from '@/lib/cache/cache-keys'
import { ScoredCard } from '@/lib/types/scored-card'

export const revalidate = 3600 // 1 hour

// Key vintage/popular sets to scan for opportunities
// These are TCG API set IDs for sets with strong collector demand
const TRACKED_TCG_SETS = [
  'base1',     // Base Set
  'jungle',    // Jungle
  'fossil',    // Fossil
  'base4',     // Base Set 2
  'neo1',      // Neo Genesis
  'neo2',      // Neo Discovery
  'neo4',      // Neo Destiny
  'ecard1',    // Expedition Base Set
  'ex1',       // Ruby & Sapphire
  'dp1',       // Diamond & Pearl
  'pl1',       // Platinum
  'hgss1',     // HeartGold & SoulSilver
  'bw1',       // Black & White
  'xy1',       // XY
  'sm1',       // Sun & Moon
  'swsh1',     // Sword & Shield
  'sv1',       // Scarlet & Violet
  'sv3pt5',    // 151
  'sv4',       // Paradox Rift
  'sv6pt5',    // Shrouded Fable
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const minScore = parseInt(searchParams.get('minScore') ?? '60', 10)
  const series = searchParams.get('series')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)

  const cacheKey = CacheKeys.opportunities()
  let allScoredCards = opportunitiesCache.get(cacheKey)

  if (!allScoredCards) {
    try {
      const tcgSets = await getAllSets()

      // Build set name lookup
      const setById = new Map(tcgSets.map(s => [s.id, s]))

      // Fetch all tracked sets in parallel (chunked to avoid overwhelming)
      const CHUNK_SIZE = 5
      const results: ScoredCard[] = []

      for (let i = 0; i < TRACKED_TCG_SETS.length; i += CHUNK_SIZE) {
        const chunk = TRACKED_TCG_SETS.slice(i, i + CHUNK_SIZE)

        const chunkResults = await Promise.all(
          chunk.map(async (tcgSetId) => {
            const tcgSet = setById.get(tcgSetId)
            if (!tcgSet) return []

            try {
              const cards = await getSetCards(tcgSetId)

              // For opportunities, we score purely on TCG data as a proxy
              // (no PSA pop data — that requires knowing PSA set IDs)
              // Score based on rarity + set vintage as a discovery mechanism
              return cards.map(card => {
                const marketPrice = getMarketPrice(card)
                // Use minimal PSA data (0 pop = unknown = high score)
                return buildScoredCard(
                  {
                    specId: card.id,
                    cardNumber: card.number,
                    name: card.name,
                    variety: '',
                    grades: {
                      auth: 0, grade1: 0, grade15: 0, grade2: 0, grade25: 0,
                      grade3: 0, grade35: 0, grade4: 0, grade45: 0, grade5: 0,
                      grade55: 0, grade6: 0, grade65: 0, grade7: 0, grade75: 0,
                      grade8: 0, grade85: 0, grade9: 0, grade10: 0, total: 0,
                    },
                    psaSetId: '',
                  },
                  tcgSet.name,
                  card,
                  marketPrice
                )
              })
            } catch {
              return []
            }
          })
        )

        for (const cards of chunkResults) {
          results.push(...cards)
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
