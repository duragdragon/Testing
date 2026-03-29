import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🃏</span>
            <span className="font-bold text-gray-900 text-lg">PSA Pokemon Finder</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/sets"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Browse Sets
            </Link>
            <Link
              href="/opportunities"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Opportunities
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
