'use client'

import { useState, useMemo } from 'react'
import { MergedSet } from '@/lib/types/scored-card'
import { SetCard } from './SetCard'

interface SetGridProps {
  sets: MergedSet[]
}

export function SetGrid({ sets }: SetGridProps) {
  const [search, setSearch] = useState('')
  const [selectedSeries, setSelectedSeries] = useState<string>('all')

  const seriesList = useMemo(() => {
    const all = sets.map(s => s.series).filter(Boolean) as string[]
    return ['all', ...Array.from(new Set(all)).sort()]
  }, [sets])

  const filtered = useMemo(() => {
    return sets.filter(s => {
      const matchesSearch = !search
        || (s.tcgSetName || s.psaSetName).toLowerCase().includes(search.toLowerCase())
      const matchesSeries = selectedSeries === 'all' || s.series === selectedSeries
      return matchesSearch && matchesSeries
    })
  }, [sets, search, selectedSeries])

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Search sets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedSeries}
          onChange={e => setSelectedSeries(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {seriesList.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Series' : s}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No sets found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(set => (
            <SetCard key={set.psaSetId || set.tcgSetId} set={set} />
          ))}
        </div>
      )}
    </div>
  )
}
