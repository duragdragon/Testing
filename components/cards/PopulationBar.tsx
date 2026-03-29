import { PSAGrades } from '@/lib/types/psa'
import { formatNumber } from '@/lib/utils/formatters'

interface PopulationBarProps {
  grades: PSAGrades
}

export function PopulationBar({ grades }: PopulationBarProps) {
  const total = grades.total || 1
  const segments = [
    { label: '1-7', value: grades.grade1 + grades.grade15 + grades.grade2 + grades.grade25 + grades.grade3 + grades.grade35 + grades.grade4 + grades.grade45 + grades.grade5 + grades.grade55 + grades.grade6 + grades.grade65 + grades.grade7 + grades.grade75, color: 'bg-red-400' },
    { label: '8', value: grades.grade8 + grades.grade85, color: 'bg-orange-400' },
    { label: '9', value: grades.grade9, color: 'bg-yellow-400' },
    { label: '10', value: grades.grade10, color: 'bg-green-500' },
  ]

  return (
    <div className="space-y-1">
      <div className="flex h-3 rounded-full overflow-hidden gap-px bg-gray-200">
        {segments.map(seg => {
          const pct = (seg.value / total) * 100
          if (pct < 0.5) return null
          return (
            <div
              key={seg.label}
              className={`${seg.color} transition-all`}
              style={{ width: `${pct}%` }}
              title={`PSA ${seg.label}: ${formatNumber(seg.value)}`}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>PSA 10: {formatNumber(grades.grade10)}</span>
        <span>PSA 9: {formatNumber(grades.grade9)}</span>
        <span>Total: {formatNumber(grades.total)}</span>
      </div>
    </div>
  )
}
