'use client'

import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ScoredCard, ScoreBand } from '@/lib/types/scored-card'

export default function OpportunitiesPage() {
  const [cards, setCards] = useState<ScoredCard[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [minScore, setMinScore] = useState(60)
  const [filterBand, setFilterBand] = useState<ScoreBand | 'all'>('all')
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      minScore: minScore.toString(),
      limit: limit.toString(),
    })
    fetch(`/api/opportunities?${params}`)
      .then(r => r.json())
      .then(data => {
        setCards(data.cards || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load opportunities. Please try again.')
        setLoading(false)
      })
  }, [minScore, limit])

  const filtered = filterBand === 'all'
    ? cards
    : cards.filter(c => c.scoreBand === filterBand)

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Opportunities</h1>
        <p className="text-gray-600">
          Cards with the highest investment scores across tracked Pokemon sets. Lower PSA 10 population = higher score.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        <strong>Note:</strong> When no PSA population data is available, scores reflect card rarity and set vintage only.
        For precise pop counts, browse individual sets.
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600 font-medium">Min Score:</label>
          <select
            value={minScore}
            onChange={e => setMinScore(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={40}>40+</option>
            <option value={50}>50+</option>
            <option value={60}>60+</option>
            <option value={70}>70+</option>
            <option value={80}>80+</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600 font-medium">Band:</label>
          <select
            value={filterBand}
            onChange={e => setFilterBand(e.target.value as ScoreBand | 'all')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="strong-buy">Strong Buy</option>
            <option value="interesting">Interesting</option>
            <option value="watch">Watch</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600 font-medium">Show:</label>
          <select
            value={limit}
            onChange={e => setLimit(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500 text-sm mt-3">Loading opportunities...</p>
            <p className="text-gray-400 text-xs mt-1">Fetching card data from Pokemon TCG API</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No opportunities found</p>
          <p className="text-sm mt-1">Try lowering the minimum score filter</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Showing {filtered.length} of {total} opportunities
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(card => (
              <OpportunityCard key={card.specId} card={card} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  )
}
