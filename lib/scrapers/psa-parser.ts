import * as cheerio from 'cheerio'
import { PSACardPop, PSAGrades, PSASetInfo } from '../types/psa'

function parseGradeInt(val: string | undefined): number {
  if (!val) return 0
  const cleaned = val.replace(/,/g, '').trim()
  const n = parseInt(cleaned, 10)
  return isNaN(n) ? 0 : n
}

function emptyGrades(): PSAGrades {
  return {
    auth: 0, grade1: 0, grade15: 0, grade2: 0, grade25: 0,
    grade3: 0, grade35: 0, grade4: 0, grade45: 0, grade5: 0,
    grade55: 0, grade6: 0, grade65: 0, grade7: 0, grade75: 0,
    grade8: 0, grade85: 0, grade9: 0, grade10: 0, total: 0,
  }
}

// Column order in PSA pop report table:
// Card # | Name | Variety | AUTH | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5 | 5.5 | 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9 | 10 | Total
const GRADE_COLUMN_MAP: Record<number, keyof PSAGrades> = {
  3: 'auth',
  4: 'grade1',
  5: 'grade15',
  6: 'grade2',
  7: 'grade25',
  8: 'grade3',
  9: 'grade35',
  10: 'grade4',
  11: 'grade45',
  12: 'grade5',
  13: 'grade55',
  14: 'grade6',
  15: 'grade65',
  16: 'grade7',
  17: 'grade75',
  18: 'grade8',
  19: 'grade85',
  20: 'grade9',
  21: 'grade10',
  22: 'total',
}

export function parseSetPopFromHTML(html: string, psaSetId: string): { cards: PSACardPop[], setName: string } {
  // First, try to extract JSON data embedded in the page
  const jsonResult = tryParseNextData(html, psaSetId)
  if (jsonResult) return jsonResult

  // Fallback to DOM parsing
  return parseSetPopFromDOM(html, psaSetId)
}

function tryParseNextData(html: string, psaSetId: string): { cards: PSACardPop[], setName: string } | null {
  try {
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!match) return null

    const data = JSON.parse(match[1])

    // Navigate the Next.js page props to find pop data
    const pageProps = data?.props?.pageProps
    if (!pageProps) return null

    // PSA might store pop report data in various keys — try common ones
    const popData = pageProps.popReport || pageProps.data || pageProps.cards
    if (!Array.isArray(popData)) return null

    const setName = pageProps.setName || pageProps.title || 'Unknown Set'

    const cards: PSACardPop[] = popData
      .map((item: Record<string, unknown>) => {
        const grades = emptyGrades()

        // Map from PSA's JSON property names to our grade structure
        grades.auth = Number(item.popAuth || item.AUTH || 0)
        grades.grade1 = Number(item.pop1 || item.GRD1 || 0)
        grades.grade15 = Number(item.pop15 || item.GRD1H || 0)
        grades.grade2 = Number(item.pop2 || item.GRD2 || 0)
        grades.grade25 = Number(item.pop25 || item.GRD2H || 0)
        grades.grade3 = Number(item.pop3 || item.GRD3 || 0)
        grades.grade35 = Number(item.pop35 || item.GRD3H || 0)
        grades.grade4 = Number(item.pop4 || item.GRD4 || 0)
        grades.grade45 = Number(item.pop45 || item.GRD4H || 0)
        grades.grade5 = Number(item.pop5 || item.GRD5 || 0)
        grades.grade55 = Number(item.pop55 || item.GRD5H || 0)
        grades.grade6 = Number(item.pop6 || item.GRD6 || 0)
        grades.grade65 = Number(item.pop65 || item.GRD6H || 0)
        grades.grade7 = Number(item.pop7 || item.GRD7 || 0)
        grades.grade75 = Number(item.pop75 || item.GRD7H || 0)
        grades.grade8 = Number(item.pop8 || item.GRD8 || 0)
        grades.grade85 = Number(item.pop85 || item.GRD8H || 0)
        grades.grade9 = Number(item.pop9 || item.GRD9 || 0)
        grades.grade10 = Number(item.pop10 || item.GRD10 || 0)
        grades.total = Number(item.popTotal || item.total || 0)

        if (grades.total === 0) {
          grades.total = Object.values(grades).reduce((a, b) => a + b, 0)
        }

        return {
          specId: String(item.specId || item.SpecID || item.id || ''),
          cardNumber: String(item.cardNo || item.cardNumber || item.CardNo || ''),
          name: String(item.name || item.cardName || item.Name || ''),
          variety: String(item.variety || item.Variety || ''),
          grades,
          psaSetId,
        } as PSACardPop
      })
      .filter((c: PSACardPop) => c.name && c.name !== 'undefined')

    if (cards.length > 0) {
      return { cards, setName: String(setName) }
    }
  } catch {
    // ignore parse errors, fall through to DOM parsing
  }
  return null
}

function parseSetPopFromDOM(html: string, psaSetId: string): { cards: PSACardPop[], setName: string } {
  const $ = cheerio.load(html)
  const cards: PSACardPop[] = []

  // Try to get set name from page title or heading
  const setName = $('h1').first().text().trim()
    || $('title').text().replace(' - PSA Population Report', '').trim()
    || 'Unknown Set'

  // Find the population report table — PSA uses class names or data attributes
  const table = $('table').filter((_, el) => {
    const headers = $(el).find('th').map((_, th) => $(th).text().trim()).get()
    return headers.some(h => h === '10' || h === 'PSA 10')
  }).first()

  if (!table.length) {
    // Try alternative: look for any table with grade data
    $('table tr').each((_, row) => {
      const cells = $(row).find('td')
      if (cells.length < 10) return

      const grades = emptyGrades()
      let hasData = false

      cells.each((colIdx, cell) => {
        const gradeKey = GRADE_COLUMN_MAP[colIdx]
        if (gradeKey) {
          const val = parseGradeInt($(cell).text())
          grades[gradeKey] = val
          if (val > 0) hasData = true
        }
      })

      if (!hasData) return

      const specId = $(row).attr('data-spec-id')
        || $(row).find('[data-spec-id]').attr('data-spec-id')
        || `${psaSetId}-${cards.length}`

      cards.push({
        specId,
        cardNumber: $(cells[0]).text().trim(),
        name: $(cells[1]).text().trim(),
        variety: $(cells[2]).text().trim(),
        grades,
        psaSetId,
      })
    })
    return { cards, setName }
  }

  table.find('tbody tr').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 5) return

    const grades = emptyGrades()

    cells.each((colIdx, cell) => {
      const gradeKey = GRADE_COLUMN_MAP[colIdx]
      if (gradeKey) {
        grades[gradeKey] = parseGradeInt($(cell).text())
      }
    })

    const specId = $(row).attr('data-spec-id')
      || $(row).find('a[href*="specid"]').attr('href')?.match(/specid=(\d+)/)?.[1]
      || `${psaSetId}-${cards.length}`

    cards.push({
      specId,
      cardNumber: $(cells[0]).text().trim(),
      name: $(cells[1]).text().trim(),
      variety: $(cells[2]).text().trim(),
      grades,
      psaSetId,
    })
  })

  return { cards, setName }
}

export function parsePSASetsFromHTML(html: string): PSASetInfo[] {
  const sets: PSASetInfo[] = []

  // Try JSON first
  try {
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (match) {
      const data = JSON.parse(match[1])
      const pageProps = data?.props?.pageProps
      const setsData = pageProps?.sets || pageProps?.data || pageProps?.subsets

      if (Array.isArray(setsData)) {
        return setsData.map((s: Record<string, unknown>) => ({
          psaSetId: String(s.setId || s.id || ''),
          psaSetName: String(s.name || s.setName || ''),
          psaUrl: `https://www.psacard.com/pop/trading-cards/10002/pokemon/${s.id || s.setId}`,
          cardCount: Number(s.cardCount || s.count || 0) || undefined,
        })).filter(s => s.psaSetId && s.psaSetName)
      }
    }
  } catch {
    // fall through to DOM
  }

  const $ = cheerio.load(html)

  // PSA set list — look for links to individual sets
  $('a[href*="/pop/trading-cards/"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const match = href.match(/\/pop\/trading-cards\/\d+\/pokemon\/(\d+)/)
    if (!match) return

    const setId = match[1]
    const setName = $(el).text().trim()
    if (!setId || !setName) return

    sets.push({
      psaSetId: setId,
      psaSetName: setName,
      psaUrl: `https://www.psacard.com${href}`,
    })
  })

  return sets
}
