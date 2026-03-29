import { NextResponse } from 'next/server'
import { getPSAInfoForTcgSet } from '@/lib/utils/set-matcher'

export async function GET(
  _req: Request,
  { params }: { params: { setId: string } }
) {
  const psaInfo = getPSAInfoForTcgSet(params.setId)
  if (!psaInfo) {
    return NextResponse.json({ error: `No PSA mapping for set "${params.setId}"` }, { status: 404 })
  }

  try {
    const res = await fetch(psaInfo.psaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.psacard.com/pop',
      },
    })

    const html = await res.text()

    // Check for __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    let nextData = null
    if (nextDataMatch) {
      try { nextData = JSON.parse(nextDataMatch[1]) } catch { /* ignore */ }
    }

    // Find all table-like structures
    const tableCount = (html.match(/<table/g) || []).length
    const trCount = (html.match(/<tr/g) || []).length

    return NextResponse.json({
      psaUrl: psaInfo.psaUrl,
      httpStatus: res.status,
      htmlLength: html.length,
      htmlPreview: html.slice(0, 3000),
      hasNextData: !!nextDataMatch,
      nextDataKeys: nextData ? Object.keys(nextData?.props?.pageProps || {}) : [],
      nextDataPreview: nextData ? JSON.stringify(nextData?.props?.pageProps).slice(0, 2000) : null,
      tableCount,
      trCount,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
