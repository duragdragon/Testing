export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size]
  return (
    <div className={`${sizeClass} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`} />
  )
}

export function CardTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-lg" />
      ))}
    </div>
  )
}

export function SetGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl" />
      ))}
    </div>
  )
}
