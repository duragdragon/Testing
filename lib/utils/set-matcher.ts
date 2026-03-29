import setIdMapData from '../data/set-id-map.json'
import { TCGSet } from '../types/tcg'

interface PSASetInfo {
  psaSetId: string
  psaUrl: string
}

const MAPPINGS = setIdMapData.sets as Record<string, PSASetInfo>

export function getPSAInfoForTcgSet(tcgSetId: string): PSASetInfo | undefined {
  return MAPPINGS[tcgSetId]
}

export function hasPSAData(tcgSetId: string): boolean {
  return tcgSetId in MAPPINGS
}

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
  if (na.includes(nb) || nb.includes(na)) return 0.85
  const wordsA = new Set(na.split(' '))
  const wordsB = new Set(nb.split(' '))
  const common = Array.from(wordsA).filter(w => wordsB.has(w)).length
  const total = Math.max(wordsA.size, wordsB.size)
  return total > 0 ? common / total : 0
}

export function findTcgSetForPsaSet(psaSetName: string, allTcgSets: TCGSet[]): TCGSet | undefined {
  const exact = allTcgSets.find(s => normalize(s.name) === normalize(psaSetName))
  if (exact) return exact

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

// Slug is just the TCG set ID (e.g. "base1", "swsh7")
// For sets with no TCG ID, use "psa-{psaSetId}"
export function buildSetSlug(psaSetId: string, tcgSetId?: string): string {
  if (tcgSetId) return tcgSetId
  return psaSetId ? `psa-${psaSetId}` : 'unknown'
}

export function parseSetSlug(slug: string): { psaSetId?: string; tcgSetId?: string } {
  if (slug.startsWith('psa-')) {
    return { psaSetId: slug.replace('psa-', '') }
  }
  // It's a TCG set ID — look up the PSA info
  const psaInfo = getPSAInfoForTcgSet(slug)
  return { tcgSetId: slug, psaSetId: psaInfo?.psaSetId }
}
