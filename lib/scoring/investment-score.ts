import { PSACardPop } from '../types/psa'
import { TCGCard } from '../types/tcg'
import { ScoredCard, ScoreBreakdown, ScoreBand } from '../types/scored-card'

interface ScoringInput {
  psa10Count: number
  psa9Count: number
  totalGraded: number
  rarity?: string
  releaseDate?: string
}

const RARITY_BONUSES: Record<string, number> = {
  'Special Illustration Rare': 25,
  'Hyper Rare': 25,
  'Illustration Rare': 22,
  'Ultra Rare': 20,
  'Full Art Trainer': 20,
  'Rare Rainbow': 18,
  'Rare Holo VMAX': 15,
  'Rare Holo VSTAR': 15,
  'Rare Holo V': 12,
  'Rare Holo EX': 12,
  'Rare Holo GX': 12,
  'Rare Holo': 10,
  'Rare': 5,
}

function getRarityBonus(rarity?: string): number {
  if (!rarity) return 0
  // Exact match first
  if (rarity in RARITY_BONUSES) return RARITY_BONUSES[rarity]
  // Partial match
  for (const [key, bonus] of Object.entries(RARITY_BONUSES)) {
    if (rarity.toLowerCase().includes(key.toLowerCase())) return bonus
  }
  return 0
}

function getVintageBonus(releaseDate?: string): number {
  if (!releaseDate) return 0
  const year = parseInt(releaseDate.split('/')[0], 10)
  if (isNaN(year)) return 0
  if (year <= 2000) return 15  // Base Set era
  if (year <= 2003) return 10  // Early sets
  if (year <= 2010) return 5   // Mid-era
  return 0
}

function calcScarcityScore(psa10Count: number): number {
  if (psa10Count === 0) return 100
  return Math.max(0, Math.round(100 - Math.log10(psa10Count + 1) * 30))
}

function calcRatioScore(psa10Count: number, psa9Count: number): number {
  const ratio = psa10Count / Math.max(psa9Count, 1)
  return Math.max(0, Math.round(100 - ratio * 100))
}

function calcTotalPopScore(totalGraded: number): number {
  if (totalGraded === 0) return 100
  return Math.max(0, Math.round(100 - Math.log10(totalGraded + 1) * 20))
}

function calcDesirabilityScore(rarity?: string, releaseDate?: string): number {
  const rarityBonus = getRarityBonus(rarity)
  const vintageBonus = getVintageBonus(releaseDate)
  return Math.min(100, rarityBonus + vintageBonus)
}

export function calculateInvestmentScore(input: ScoringInput): ScoreBreakdown {
  const scarcityScore = calcScarcityScore(input.psa10Count)
  const ratioScore = calcRatioScore(input.psa10Count, input.psa9Count)
  const totalPopScore = calcTotalPopScore(input.totalGraded)
  const desirabilityScore = calcDesirabilityScore(input.rarity, input.releaseDate)

  const final = Math.round(
    scarcityScore * 0.40 +
    ratioScore * 0.25 +
    totalPopScore * 0.20 +
    desirabilityScore * 0.15
  )

  return { scarcityScore, ratioScore, totalPopScore, desirabilityScore, final }
}

export function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return 'strong-buy'
  if (score >= 60) return 'interesting'
  if (score >= 40) return 'watch'
  return 'pass'
}

export function scoreBandLabel(band: ScoreBand): string {
  switch (band) {
    case 'strong-buy': return 'Strong Buy'
    case 'interesting': return 'Interesting'
    case 'watch': return 'Watch'
    case 'pass': return 'Pass'
  }
}

export function buildScoredCard(
  psaCard: PSACardPop,
  psaSetName: string,
  tcgCard?: TCGCard,
  marketPrice?: number
): ScoredCard {
  const breakdown = calculateInvestmentScore({
    psa10Count: psaCard.grades.grade10,
    psa9Count: psaCard.grades.grade9,
    totalGraded: psaCard.grades.total,
    rarity: tcgCard?.rarity,
    releaseDate: tcgCard?.set.releaseDate,
  })

  return {
    specId: psaCard.specId,
    cardNumber: psaCard.cardNumber,
    name: psaCard.name,
    variety: psaCard.variety,
    grades: psaCard.grades,
    psaSetId: psaCard.psaSetId,
    psaSetName,
    tcgCardId: tcgCard?.id,
    imageSmall: tcgCard?.images.small,
    imageLarge: tcgCard?.images.large,
    rarity: tcgCard?.rarity,
    tcgSetId: tcgCard?.set.id,
    tcgSetName: tcgCard?.set.name,
    series: tcgCard?.set.series,
    releaseDate: tcgCard?.set.releaseDate,
    marketPrice,
    investmentScore: breakdown.final,
    scoreBreakdown: breakdown,
    scoreBand: getScoreBand(breakdown.final),
  }
}
