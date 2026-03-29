import Image from 'next/image'

interface CardImageProps {
  src?: string
  alt: string
  size?: 'sm' | 'md'
}

export function CardImage({ src, alt, size = 'sm' }: CardImageProps) {
  const dims = size === 'md' ? { width: 100, height: 140 } : { width: 40, height: 56 }

  if (!src) {
    return (
      <div
        style={{ width: dims.width, height: dims.height }}
        className="bg-gray-100 rounded flex items-center justify-center flex-shrink-0"
      >
        <span className="text-gray-400 text-xs">🃏</span>
      </div>
    )
  }

  return (
    <div style={{ width: dims.width, height: dims.height }} className="flex-shrink-0 relative">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain rounded"
        unoptimized
        sizes={`${dims.width}px`}
      />
    </div>
  )
}
