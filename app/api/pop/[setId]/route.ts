import { NextResponse } from 'next/server'
import { getGMSetCards, getGrade9Count } from '@/lib/api/gradedmetrics'
import { getSetCards, getMarketPrice } from '@/lib/api/pokemon-tcg'
import { buildScoredCard } from '@/lib/scoring/investment-score'
import { TCGCard } from '@/lib/types/tcg'
import { ScoredCard } from '@/lib/types/scored-card'
import { PSAGrades } from '@/lib/types/psa'
import gmSetMapData from '@/lib/data/gradedmetrics-set-map.json'

export const revalidate = 3600

const GM_SET_MAP = gmSetMapData.sets as Record<string, string>

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

export async function GET(
  _request: Request,
  { params }: { params: { setId: string } }
) {
  const tcgSetId = params.setId
  if (!tcgSetId) return NextResponse.json({ error: 'Invalid set ID' }, { status: 400 })

  const gmSetCode = GM_SET_MAP[tcgSetId]

  try {
    const [gmCards, tcgCards] = await Promise.all([
      gmSetCode ? getGMSetCards(gmSetCode) : Promise.resolve([]),
      getSetCards(tcgSetId),
    ])

    const tcgByNumber = new Map<string, TCGCard>()
    const tcgByName = new Map<string, TCGCard>()
    for (const card of tcgCards) {
      tcgByNumber.set(card.number.replace(/^0+/, ''), card)
      tcgByNumber.set(card.number, card)
      tcgByName.set(card.name.toLowerCase(), card)
    }

    const setName = tcgCards[0]?.set.name ?? tcgSetId
    const hasPSAData = gmCards.length > 0

    let scoredCards: ScoredCard[]

    if (hasPSAData) {
      scoredCards = gmCards
        .filter(c => !c._) // skip archived
        .map(gmCard => {
          const cardNum = String(gmCard.e ?? '').replace(/^0+/, '')
          const tcgCard = tcgByNumber.get(cardNum)
            ?? tcgByName.get(gmCard.n?.toLowerCase() ?? '')

          const psa10 = gmCard.ps ?? 0
          const psa9 = getGrade9Count(gmCard)
          const total = gmCard.t ?? 0

          return buildScoredCard(
            {
              specId: gmCard.i,
              cardNumber: String(gmCard.e ?? ''),
              name: gmCard.n ?? '',
              variety: gmCard.x?.join(', ') ?? '',
              grades: buildGrades(psa10, psa9, total),
              psaSetId: gmSetCode ?? '',
            },
            setName,
            tcgCard,
            tcgCard ? getMarketPrice(tcgCard) : undefined
          )
        })
    } else {
      // No GradedMetrics data — score from TCG cards only
      scoredCards = tcgCards.map(card => buildScoredCard(
        {
          specId: card.id,
          cardNumber: card.number,
          name: card.name,
          variety: '',
          grades: buildGrades(0, 0, 0),
          psaSetId: '',
        },
        setName,
        card,
        getMarketPrice(card)
      ))
    }

    scoredCards.sort((a, b) => b.investmentScore - a.investmentScore)

    return NextResponse.json({
      setId: tcgSetId,
      setName,
      gmSetCode,
      hasPSAData,
      cards: scoredCards,
    })
  } catch (err) {
    console.error(`[API /pop/${tcgSetId}]`, err)
    return NextResponse.json({ error: 'Failed to fetch data', cards: [] }, { status: 500 })
  }
}
