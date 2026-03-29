import { Suspense } from 'react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { CardTable } from '@/components/cards/CardTable'
import { CardTableSkeleton } from '@/components/ui/LoadingSpinner'
import { ScoredCard } from '@/lib/types/scored-card'
import { parseSetSlug } from '@/lib/utils/set-matcher'

interface SetPopResponse {
  setId: string
  setName: string
  fetchedAt: string
  cards: ScoredCard[]
  error?: string
}

async function getSetPopData(psaSetId: string): Promise<SetPopResponse | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pop/${psaSetId}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function SetDetailContent({ psaSetId }: { psaSetId: string }) {
  const data = await getSetPopData(psaSetId)

  if (!data || data.error || data.cards.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <p className="text-yellow-800 font-medium">No population data available</p>
        <p className="text-yellow-700 text-sm mt-1">
          {data?.error
            ? 'Failed to fetch PSA population data for this set.'
            : 'This set has no cards in the PSA population report yet.'}
        </p>
        <p className="text-yellow-600 text-xs mt-2">
          PSA data is fetched live — try refreshing, or the set may not be in the pop report.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {data.cards.length} cards · Last updated {new Date(data.fetchedAt).toLocaleDateString()}
        </p>
        <a
          href={`https://www.psacard.com/pop/trading-cards/10002/pokemon/${psaSetId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
        >
          View on PSA ↗
        </a>
      </div>
      <CardTable cards={data.cards} />
    </div>
  )
}

export default async function SetDetailPage({ params }: { params: { setSlug: string } }) {
  const { psaSetId, tcgSetId } = parseSetSlug(params.setSlug)

  if (!psaSetId) {
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Set Population Report
        </h1>
        <p className="text-gray-600">
          Cards sorted by investment score. Lower PSA 10 populations = higher potential value.
          {tcgSetId && <span className="text-gray-400 ml-2">TCG: {tcgSetId}</span>}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <strong>How to use:</strong> Sort by Score to see the best opportunities. Filter by Max PSA 10 to find truly scarce cards. Lower PSA 10 count with high desirability = stronger investment potential.
      </div>

      <Suspense fallback={<CardTableSkeleton />}>
        <SetDetailContent psaSetId={psaSetId} />
      </Suspense>
    </PageContainer>
  )
}
