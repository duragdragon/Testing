import { NextResponse } from 'next/server'
import { fetchSetPopData } from '@/lib/scrapers/psa-scraper'
import { getSetCards, getMarketPrice } from '@/lib/api/pokemon-tcg'
import { buildScoredCard } from '@/lib/scoring/investment-score'
import { getPSAInfoForTcgSet } from '@/lib/utils/set-matcher'
import { TCGCard } from '@/lib/types/tcg'
import { ScoredCard } from '@/lib/types/scored-card'

export const revalidate = 3600 // 1 hour

export async function GET(
  _request: Request,
  { params }: { params: { setId: string } }
) {
  const tcgSetId = params.setId

  if (!tcgSetId) {
    return NextResponse.json({ error: 'Invalid set ID' }, { status: 400 })
  }

  const psaInfo = getPSAInfoForTcgSet(tcgSetId)

  try {
    // Fetch PSA pop data and TCG cards in parallel
    const [psaSetPop, tcgCards] = await Promise.all([
      psaInfo ? fetchSetPopData(tcgSetId) : Promise.resolve({ psaSetId: '', psaSetName: '', cards: [], fetchedAt: new Date().toISOString() }),
      getSetCards(tcgSetId),
    ])

    // Build card number → TCG card lookup
    const tcgCardByNumber = new Map<string, TCGCard>()
    for (const card of tcgCards) {
      const num = card.number.replace(/^0+/, '')
      tcgCardByNumber.set(num, card)
      tcgCardByNumber.set(card.number, card) // also store original
    }

    const setName = psaSetPop.psaSetName || tcgCards[0]?.set.name || tcgSetId

    let scoredCards: ScoredCard[]

    if (psaSetPop.cards.length > 0) {
      // We have real PSA data — merge with TCG
      scoredCards = psaSetPop.cards.map(psaCard => {
        const normalizedNum = psaCard.cardNumber.replace(/^0+/, '')
        const tcgCard = tcgCardByNumber.get(normalizedNum)
          || tcgCardByNumber.get(psaCard.cardNumber)
          || tcgCards.find(c => c.name.toLowerCase() === psaCard.name.toLowerCase())

        const marketPrice = tcgCard ? getMarketPrice(tcgCard) : undefined
        return buildScoredCard(psaCard, setName, tcgCard, marketPrice)
      })
    } else {
      // No PSA data — score from TCG cards only (rarity + vintage based)
      scoredCards = tcgCards.map(card => {
        const marketPrice = getMarketPrice(card)
        return buildScoredCard(
          {
            specId: card.id,
            cardNumber: card.number,
            name: card.name,
            variety: '',
            grades: { auth: 0, grade1: 0, grade15: 0, grade2: 0, grade25: 0, grade3: 0, grade35: 0, grade4: 0, grade45: 0, grade5: 0, grade55: 0, grade6: 0, grade65: 0, grade7: 0, grade75: 0, grade8: 0, grade85: 0, grade9: 0, grade10: 0, total: 0 },
            psaSetId: psaInfo?.psaSetId || '',
          },
          setName,
          card,
          marketPrice
        )
      })
    }

    scoredCards.sort((a, b) => b.investmentScore - a.investmentScore)

    return NextResponse.json({
      setId: tcgSetId,
      setName,
      psaSetId: psaInfo?.psaSetId,
      psaUrl: psaInfo?.psaUrl,
      hasPSAData: psaSetPop.cards.length > 0,
      fetchedAt: psaSetPop.fetchedAt,
      cards: scoredCards,
    })
  } catch (err) {
    console.error(`[API /pop/${tcgSetId}]`, err)
    return NextResponse.json({ error: 'Failed to fetch data', cards: [] }, { status: 500 })
  }
}
