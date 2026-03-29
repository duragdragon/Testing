import { LRUCache } from 'lru-cache'
import { PSASetPop, PSASetInfo } from '../types/psa'
import { TCGSet, TCGCard } from '../types/tcg'
import { ScoredCard, MergedSet } from '../types/scored-card'

export const psaPopCache = new LRUCache<string, PSASetPop>({
  max: 200,
  ttl: 1000 * 60 * 60 * 2, // 2 hours
})

export const psaSetsCache = new LRUCache<string, PSASetInfo[]>({
  max: 1,
  ttl: 1000 * 60 * 60 * 6, // 6 hours
})

export const tcgSetsCache = new LRUCache<string, TCGSet[]>({
  max: 1,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
})

export const tcgCardsCache = new LRUCache<string, TCGCard[]>({
  max: 200,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
})

export const opportunitiesCache = new LRUCache<string, ScoredCard[]>({
  max: 1,
  ttl: 1000 * 60 * 60, // 1 hour
})

export const mergedSetsCache = new LRUCache<string, MergedSet[]>({
  max: 1,
  ttl: 1000 * 60 * 60 * 6, // 6 hours
})
