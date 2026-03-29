import { ScoreBand } from '@/lib/types/scored-card'

interface ScoreBarProps {
  score: number
  band: ScoreBand
  showLabel?: boolean
}

const BAND_COLORS: Record<ScoreBand, string> = {
  'strong-buy': 'bg-green-500',
  'interesting': 'bg-blue-500',
  'watch': 'bg-yellow-400',
  'pass': 'bg-gray-300',
}

export function ScoreBar({ score, band, showLabel = false }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${BAND_COLORS[band]}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 w-7 text-right">{score}</span>
      )}
    </div>
  )
}
