import Link from 'next/link'
import { ScoredCard } from '@/lib/types/scored-card'
import { ScoreBadge } from '@/components/ui/Badge'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { CardImage } from '@/components/cards/CardImage'
import { formatNumber, formatPrice } from '@/lib/utils/formatters'
import { buildSetSlug } from '@/lib/utils/set-matcher'

interface OpportunityCardProps {
  card: ScoredCard
}

export function OpportunityCard({ card }: OpportunityCardProps) {
  const setSlug = buildSetSlug(card.psaSetId, card.tcgSetId)
  const canLinkToSet = !!card.psaSetId

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow flex gap-4">
      <CardImage src={card.imageSmall} alt={card.name} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{card.name}</h3>
            <p className="text-xs text-gray-500">
              #{card.cardNumber}
              {card.variety ? ` · ${card.variety}` : ''}
            </p>
          </div>
          <ScoreBadge band={card.scoreBand} score={card.investmentScore} size="md" />
        </div>

        <ScoreBar score={card.investmentScore} band={card.scoreBand} showLabel />

        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500">PSA 10</p>
            <p className="text-sm font-bold text-green-600">{formatNumber(card.grades.grade10)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">PSA 9</p>
            <p className="text-sm font-medium text-gray-700">{formatNumber(card.grades.grade9)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-sm font-medium text-gray-700">{formatNumber(card.grades.total)}</p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">{card.psaSetName}</span>
            {card.series && <span> · {card.series}</span>}
            {card.releaseDate && <span> · {card.releaseDate.split('/')[0]}</span>}
          </div>
          {card.marketPrice && (
            <span className="text-xs font-medium text-gray-700">{formatPrice(card.marketPrice)}</span>
          )}
        </div>

        <div className="mt-2 flex gap-2">
          {canLinkToSet && (
            <Link
              href={`/sets/${setSlug}`}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Set →
            </Link>
          )}
          {card.specId && !card.specId.includes('-') && (
            <a
              href={`https://www.psacard.com/pop/trading-cards/10002/pokemon/${card.psaSetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
            >
              PSA Pop Report ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
