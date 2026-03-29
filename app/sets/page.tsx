import { Suspense } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { SetGrid } from '@/components/sets/SetGrid'
import { SetGridSkeleton } from '@/components/ui/LoadingSpinner'
import { MergedSet } from '@/lib/types/scored-card'

async function getSets(): Promise<MergedSet[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sets`,
      { next: { revalidate: 21600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.sets || []
  } catch {
    return []
  }
}

async function SetsContent() {
  const sets = await getSets()

  if (sets.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">No sets available</p>
        <p className="text-sm mt-1">Failed to load sets. Please try again.</p>
      </div>
    )
  }

  return <SetGrid sets={sets} />
}

export default function SetsPage() {
  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pokemon Card Sets</h1>
        <p className="text-gray-600">
          Select a set to explore its PSA population data and find cards with low PSA 10 counts.
        </p>
      </div>

      <Suspense fallback={<SetGridSkeleton />}>
        <SetsContent />
      </Suspense>
    </PageContainer>
  )
}
