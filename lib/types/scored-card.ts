import { PSAGrades } from './psa'

export type ScoreBand = 'strong-buy' | 'interesting' | 'watch' | 'pass'

export interface ScoreBreakdown {
  scarcityScore: number
  ratioScore: number
  totalPopScore: number
  desirabilityScore: number
  final: number
}

export interface ScoredCard {
  // PSA data
  specId: string
  cardNumber: string
  name: string
  variety: string
  grades: PSAGrades
  psaSetId: string
  psaSetName: string

  // TCG API data (optional — may not match)
  tcgCardId?: string
  imageSmall?: string
  imageLarge?: string
  rarity?: string
  tcgSetId?: string
  tcgSetName?: string
  series?: string
  releaseDate?: string
  marketPrice?: number

  // Computed
  investmentScore: number
  scoreBreakdown: ScoreBreakdown
  scoreBand: ScoreBand
}

export interface MergedSet {
  psaSetId: string
  psaSetName: string
  psaUrl: string
  tcgSetId?: string
  tcgSetName?: string
  series?: string
  releaseDate?: string
  logoUrl?: string
  cardCount?: number
}
