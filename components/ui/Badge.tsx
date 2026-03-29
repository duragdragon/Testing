import { ScoreBand } from '@/lib/types/scored-card'
import { scoreBandLabel } from '@/lib/scoring/investment-score'

interface BadgeProps {
  band: ScoreBand
  score: number
  size?: 'sm' | 'md'
}

const BAND_STYLES: Record<ScoreBand, string> = {
  'strong-buy': 'bg-green-100 text-green-800 border border-green-300',
  'interesting': 'bg-blue-100 text-blue-800 border border-blue-300',
  'watch': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  'pass': 'bg-gray-100 text-gray-600 border border-gray-300',
}

export function ScoreBadge({ band, score, size = 'sm' }: BadgeProps) {
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm font-semibold' : 'px-2 py-0.5 text-xs font-medium'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${sizeClass} ${BAND_STYLES[band]}`}>
      <span className="font-bold">{score}</span>
      <span className="opacity-75">·</span>
      <span>{scoreBandLabel(band)}</span>
    </span>
  )
}

interface RarityBadgeProps {
  rarity?: string
}

export function RarityBadge({ rarity }: RarityBadgeProps) {
  if (!rarity) return null
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
      {rarity}
    </span>
  )
}
