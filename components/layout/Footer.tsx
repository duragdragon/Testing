export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>
            Population data sourced from{' '}
            <a
              href="https://www.psacard.com/pop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              PSA Population Report
            </a>
            . Card data from{' '}
            <a
              href="https://pokemontcg.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Pokemon TCG API
            </a>
            .
          </p>
          <p className="text-xs text-gray-400">
            Investment scores are algorithmic suggestions only. Not financial advice. Always do your own research.
          </p>
        </div>
      </div>
    </footer>
  )
}
