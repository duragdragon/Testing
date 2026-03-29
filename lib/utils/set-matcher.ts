import setIdMapData from '../data/set-id-map.json'
import { TCGSet } from '../types/tcg'

const MAPPINGS = setIdMapData.mappings as Record<string, string>

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1.0

  // Check if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 0.85

  // Count common words
  const wordsA = new Set(na.split(' '))
  const wordsB = new Set(nb.split(' '))
  const common = Array.from(wordsA).filter(w => wordsB.has(w)).length
  const total = Math.max(wordsA.size, wordsB.size)
  return total > 0 ? common / total : 0
}

export function psaSetIdToTcgSetId(psaSetId: string): string | undefined {
  return MAPPINGS[psaSetId]
}

export function findTcgSetForPsaSet(psaSetName: string, allTcgSets: TCGSet[]): TCGSet | undefined {
  // First try exact name match
  const exact = allTcgSets.find(s => normalize(s.name) === normalize(psaSetName))
  if (exact) return exact

  // Then try fuzzy match
  let best: TCGSet | undefined
  let bestScore = 0

  for (const tcgSet of allTcgSets) {
    const score = similarity(psaSetName, tcgSet.name)
    if (score > bestScore && score > 0.6) {
      bestScore = score
      best = tcgSet
    }
  }

  return best
}

export function buildSetSlug(psaSetId: string, tcgSetId?: string): string {
  if (tcgSetId) return `${tcgSetId}--${psaSetId}`
  return `psa-${psaSetId}`
}

export function parseSetSlug(slug: string): { psaSetId: string; tcgSetId?: string } {
  if (slug.startsWith('psa-')) {
    return { psaSetId: slug.replace('psa-', '') }
  }
  const parts = slug.split('--')
  if (parts.length === 2) {
    return { tcgSetId: parts[0], psaSetId: parts[1] }
  }
  // Legacy: try as just psaSetId
  return { psaSetId: slug }
}
