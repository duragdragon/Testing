'use client'

import { useState, useMemo } from 'react'
import { ScoredCard, ScoreBand } from '@/lib/types/scored-card'
import { ScoreBadge } from '@/components/ui/Badge'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { CardImage } from './CardImage'
import { PopulationBar } from './PopulationBar'
import { formatNumber, formatRatio, formatPrice } from '@/lib/utils/formatters'

type SortKey = 'score' | 'psa10' | 'psa9' | 'total' | 'ratio' | 'name' | 'price'
type SortDir = 'asc' | 'desc'

interface CardTableProps {
  cards: ScoredCard[]
  showSet?: boolean
}

export function CardTable({ cards, showSet = false }: CardTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [maxPsa10, setMaxPsa10] = useState('')
  const [filterBand, setFilterBand] = useState<ScoreBand | 'all'>('all')
  const [search, setSearch] = useState('')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const sorted = useMemo(() => {
    const maxPsa10Num = maxPsa10 ? parseInt(maxPsa10, 10) : Infinity

    const filtered = cards.filter(c => {
      if (c.grades.grade10 > maxPsa10Num) return false
      if (filterBand !== 'all' && c.scoreBand !== filterBand) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })

    return [...filtered].sort((a, b) => {
      let diff = 0
      switch (sortKey) {
        case 'score': diff = a.investmentScore - b.investmentScore; break
        case 'psa10': diff = a.grades.grade10 - b.grades.grade10; break
        case 'psa9': diff = a.grades.grade9 - b.grades.grade9; break
        case 'total': diff = a.grades.total - b.grades.total; break
        case 'ratio': diff = (a.grades.grade10 / Math.max(a.grades.grade9, 1)) - (b.grades.grade10 / Math.max(b.grades.grade9, 1)); break
        case 'name': diff = a.name.localeCompare(b.name); break
        case 'price': diff = (a.marketPrice ?? 0) - (b.marketPrice ?? 0); break
      }
      return sortDir === 'asc' ? diff : -diff
    })
  }, [cards, sortKey, sortDir, maxPsa10, filterBand, search])

  function SortHeader({ col, label }: { col: SortKey, label: string }) {
    const active = sortKey === col
    return (
      <th
        onClick={() => handleSort(col)}
        className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 select-none whitespace-nowrap"
      >
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Search cards..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterBand}
          onChange={e => setFilterBand(e.target.value as ScoreBand | 'all')}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Bands</option>
          <option value="strong-buy">Strong Buy (80+)</option>
          <option value="interesting">Interesting (60–79)</option>
          <option value="watch">Watch (40–59)</option>
          <option value="pass">Pass (&lt;40)</option>
        </select>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600">Max PSA 10:</label>
          <input
            type="number"
            min={0}
            placeholder="Any"
            value={maxPsa10}
            onChange={e => setMaxPsa10(e.target.value)}
            className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-3">{sorted.length} cards</p>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Card</th>
              {showSet && <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Set</th>}
              <SortHeader col="psa10" label="PSA 10" />
              <SortHeader col="psa9" label="PSA 9" />
              <SortHeader col="ratio" label="10/9" />
              <SortHeader col="total" label="Total" />
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">Population</th>
              <SortHeader col="price" label="Price" />
              <SortHeader col="score" label="Score" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={showSet ? 9 : 8} className="px-3 py-8 text-center text-gray-400 text-sm">
                  No cards match the current filters
                </td>
              </tr>
            ) : (
              sorted.map(card => (
                <tr key={card.specId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CardImage src={card.imageSmall} alt={card.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{card.name}</p>
                        <p className="text-xs text-gray-500">#{card.cardNumber}{card.variety ? ` · ${card.variety}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  {showSet && (
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{card.psaSetName}</td>
                  )}
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {formatNumber(card.grades.grade10)}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
                    {formatNumber(card.grades.grade9)}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
                    {formatRatio(card.grades.grade10, card.grades.grade9)}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
                    {formatNumber(card.grades.total)}
                  </td>
                  <td className="px-3 py-2 min-w-[120px]">
                    <PopulationBar grades={card.grades} />
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
                    {formatPrice(card.marketPrice)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <ScoreBadge band={card.scoreBand} score={card.investmentScore} />
                      <ScoreBar score={card.investmentScore} band={card.scoreBand} showLabel={false} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
