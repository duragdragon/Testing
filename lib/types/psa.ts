export interface PSAGrades {
  auth: number
  grade1: number
  grade15: number
  grade2: number
  grade25: number
  grade3: number
  grade35: number
  grade4: number
  grade45: number
  grade5: number
  grade55: number
  grade6: number
  grade65: number
  grade7: number
  grade75: number
  grade8: number
  grade85: number
  grade9: number
  grade10: number
  total: number
}

export interface PSACardPop {
  specId: string
  cardNumber: string
  name: string
  variety: string
  grades: PSAGrades
  psaSetId: string
}

export interface PSASetPop {
  psaSetId: string
  psaSetName: string
  cards: PSACardPop[]
  fetchedAt: string
}

export interface PSASetInfo {
  psaSetId: string
  psaSetName: string
  psaUrl: string
  cardCount?: number
}
