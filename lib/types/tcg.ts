export interface TCGSetImages {
  symbol: string
  logo: string
}

export interface TCGSet {
  id: string
  name: string
  series: string
  printedTotal: number
  total: number
  releaseDate: string
  images: TCGSetImages
}

export interface TCGCardImages {
  small: string
  large: string
}

export interface TCGPrice {
  low?: number
  mid?: number
  high?: number
  market?: number
}

export interface TCGCardPrices {
  normal?: TCGPrice
  holofoil?: TCGPrice
  reverseHolofoil?: TCGPrice
  '1stEditionHolofoil'?: TCGPrice
}

export interface TCGCard {
  id: string
  name: string
  number: string
  rarity?: string
  images: TCGCardImages
  set: TCGSet
  tcgplayer?: {
    prices?: TCGCardPrices
  }
}

export interface TCGSetsResponse {
  data: TCGSet[]
  page: number
  pageSize: number
  count: number
  totalCount: number
}

export interface TCGCardsResponse {
  data: TCGCard[]
  page: number
  pageSize: number
  count: number
  totalCount: number
}
