import { NextResponse } from 'next/server'
import { fetchSetPopData } from '@/lib/scrapers/psa-scraper'
import { getSetCards, getMarketPrice } from '@/lib/api/pokemon-tcg'
import { buildScoredCard } from '@/lib/scoring/investment-score'
import { psaSetIdToTcgSetId } from '@/lib/utils/set-matcher'
import { TCGCard } from '@/lib/types/tcg'
import { ScoredCard } from '@/lib/types/scored-card'

export const revalidate = 3600 // 1 hour

export async function GET(
  _request: Request,
  { params }: { params: { setId: string } }
) {
  const { setId } = params

  if (!setId || !/^\d+$/.test(setId)) {
    return NextResponse.json({ error: 'Invalid set ID' }, { status: 400 })
  }

  try {
    // Look up TCG set ID from mapping
    const tcgSetId = psaSetIdToTcgSetId(setId)

    // Fetch PSA pop data and TCG cards in parallel
    const [psaSetPop, tcgCards] = await Promise.all([
      fetchSetPopData(setId),
      tcgSetId ? getSetCards(tcgSetId) : Promise.resolve([] as TCGCard[]),
    ])

    // Build card number → TCG card lookup
    const tcgCardByNumber = new Map<string, TCGCard>()
    for (const card of tcgCards) {
      const num = card.number.replace(/^0+/, '') // normalize "001" → "1"
      tcgCardByNumber.set(num, card)
    }

    // Merge and score each card
    const scoredCards: ScoredCard[] = psaSetPop.cards.map(psaCard => {
      const normalizedNum = psaCard.cardNumber.replace(/^0+/, '')
      const tcgCard = tcgCardByNumber.get(normalizedNum)
        || tcgCardByNumber.get(psaCard.cardNumber)
        || tcgCards.find(c => c.name.toLowerCase() === psaCard.name.toLowerCase())

      const marketPrice = tcgCard ? getMarketPrice(tcgCard) : undefined

      return buildScoredCard(psaCard, psaSetPop.psaSetName, tcgCard, marketPrice)
    })

    // Sort by investment score descending
    scoredCards.sort((a, b) => b.investmentScore - a.investmentScore)

    return NextResponse.json({
      setId,
      setName: psaSetPop.psaSetName,
      fetchedAt: psaSetPop.fetchedAt,
      cards: scoredCards,
    })
  } catch (err) {
    console.error(`[API /pop/${setId}]`, err)
    return NextResponse.json({ error: 'Failed to fetch population data', cards: [] }, { status: 500 })
  }
}
