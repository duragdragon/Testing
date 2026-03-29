import { Suspense } from 'react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { CardTable } from '@/components/cards/CardTable'
import { CardTableSkeleton } from '@/components/ui/LoadingSpinner'
import { ScoredCard } from '@/lib/types/scored-card'
import { parseSetSlug, getPSAInfoForTcgSet } from '@/lib/utils/set-matcher'

interface SetPopResponse {
  setId: string
  setName: string
  psaSetId?: string
  psaUrl?: string
  hasPSAData: boolean
  fetchedAt: string
  cards: ScoredCard[]
  error?: string
}

async function getSetData(slug: string): Promise<SetPopResponse | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pop/${slug}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function SetDetailContent({ slug }: { slug: string }) {
  const data = await getSetData(slug)

  if (!data || data.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-medium">Failed to load set data</p>
        <p className="text-red-600 text-sm mt-1">Please try refreshing the page.</p>
      </div>
    )
  }

  if (data.cards.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <p className="text-yellow-800 font-medium">No cards found</p>
        <p className="text-yellow-600 text-sm mt-1">This set may not have data available yet.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">
            {data.cards.length} cards
          </p>
          {data.hasPSAData ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Live PSA population data
            </span>
          ) : (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              Scores based on rarity only (no PSA data for this set)
            </span>
          )}
        </div>
        {data.psaUrl && (
          <a
            href={data.psaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
          >
            View on PSA ↗
          </a>
        )}
      </div>
      <CardTable cards={data.cards} />
    </div>
  )
}

export default async function SetDetailPage({ params }: { params: { setSlug: string } }) {
  const slug = params.setSlug
  const { tcgSetId, psaSetId } = parseSetSlug(slug)
  const psaInfo = tcgSetId ? getPSAInfoForTcgSet(tcgSetId) : undefined

  // Need at least a TCG set ID to fetch cards
  if (!tcgSetId && !psaSetId) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <p className="text-gray-500">Invalid set URL.</p>
          <Link href="/sets" className="text-blue-600 hover:underline mt-2 block">Back to Sets</Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/sets" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
          ← Back to Sets
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Cards</h1>
        <p className="text-gray-600">
          {psaInfo
            ? 'Cards sorted by investment score using live PSA population data.'
            : 'Cards sorted by investment score based on rarity and set vintage.'}
        </p>
      </div>

      {psaInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
          <strong>Tip:</strong> Sort by Score to surface the best opportunities. Use Max PSA 10 filter to focus on truly scarce gem mints.
        </div>
      )}

      <Suspense fallback={<CardTableSkeleton />}>
        <SetDetailContent slug={tcgSetId || slug} />
      </Suspense>
    </PageContainer>
  )
}
