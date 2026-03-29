import Link from 'next/link'
import Image from 'next/image'
import { MergedSet } from '@/lib/types/scored-card'
import { buildSetSlug } from '@/lib/utils/set-matcher'

interface SetCardProps {
  set: MergedSet
}

export function SetCard({ set }: SetCardProps) {
  const slug = buildSetSlug(set.psaSetId, set.tcgSetId)
  const canBrowse = !!(set.tcgSetId || set.psaSetId)

  const cardContent = (
    <div className={`group bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center gap-3 transition-all duration-200 ${canBrowse ? 'hover:border-blue-400 hover:shadow-md cursor-pointer' : 'opacity-60'}`}>
      {set.logoUrl ? (
        <div className="h-16 flex items-center justify-center">
          <Image
            src={set.logoUrl}
            alt={set.psaSetName}
            width={120}
            height={60}
            className="object-contain max-h-16"
            unoptimized
          />
        </div>
      ) : (
        <div className="h-16 w-full flex items-center justify-center bg-gray-100 rounded-lg">
          <span className="text-2xl">🃏</span>
        </div>
      )}
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
          {set.tcgSetName || set.psaSetName}
        </p>
        {set.series && (
          <p className="text-xs text-gray-500 mt-0.5">{set.series}</p>
        )}
        {set.releaseDate && (
          <p className="text-xs text-gray-400">{set.releaseDate.split('/')[0]}</p>
        )}
        {set.cardCount && (
          <p className="text-xs text-gray-400">{set.cardCount} cards</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {set.hasPSAData && (
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">PSA</span>
        )}
        {canBrowse && (
          <span className="text-xs text-blue-600 group-hover:text-blue-700 font-medium">
            View Cards →
          </span>
        )}
      </div>
    </div>
  )

  if (!canBrowse) return cardContent

  return <Link href={`/sets/${slug}`}>{cardContent}</Link>
}
