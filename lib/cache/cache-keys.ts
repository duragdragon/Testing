export const CacheKeys = {
  psaSetPop: (psaSetId: string) => `psa:pop:${psaSetId}`,
  psaSets: () => `psa:sets:all`,
  tcgSets: () => `tcg:sets:all`,
  tcgSetCards: (setId: string) => `tcg:cards:${setId}`,
  opportunities: () => `opportunities:top100`,
  mergedSets: () => `merged:sets`,
} as const
