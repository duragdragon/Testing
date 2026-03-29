import { ScoreBreakdown } from '@/lib/types/scored-card'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { getScoreBand } from '@/lib/scoring/investment-score'

interface ScoreExplainerProps {
  breakdown: ScoreBreakdown
}

export function ScoreExplainer({ breakdown }: ScoreExplainerProps) {
  const components = [
    { label: 'PSA 10 Scarcity', score: breakdown.scarcityScore, weight: '40%', description: 'How rare PSA 10 copies are' },
    { label: '10-to-9 Ratio', score: breakdown.ratioScore, weight: '25%', description: 'How hard it is to get a 10 vs 9' },
    { label: 'Total Pop Scarcity', score: breakdown.totalPopScore, weight: '20%', description: 'Overall submission scarcity' },
    { label: 'Desirability', score: breakdown.desirabilityScore, weight: '15%', description: 'Rarity tier and vintage bonus' },
  ]

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-700 mb-2">Score Breakdown</p>
      {components.map(c => (
        <div key={c.label}>
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-gray-600">{c.label} <span className="text-gray-400">({c.weight})</span></span>
            <span className="font-medium text-gray-800">{c.score}</span>
          </div>
          <ScoreBar score={c.score} band={getScoreBand(c.score)} />
        </div>
      ))}
    </div>
  )
}
