import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'
import { ScoredCard } from '@/lib/types/scored-card'

async function getFeaturedOpportunities(): Promise<ScoredCard[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/opportunities?minScore=70&limit=6`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.cards || []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const featured = await getFeaturedOpportunities()

  return (
    <PageContainer>
      {/* Hero */}
      <div className="text-center py-16 max-w-3xl mx-auto">
        <div className="text-5xl mb-4">🃏</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Find Undervalued PSA Pokemon Cards
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Discover Pokemon cards with low PSA 10 populations — the rarer the gem mint copy, the higher the potential value. Our investment score helps you identify the best opportunities.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/opportunities"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            View All Opportunities
          </Link>
          <Link
            href="/sets"
            className="px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Browse Sets
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How the Score Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '📊', title: 'PSA 10 Scarcity', desc: 'Cards with fewer PSA 10 copies score higher. A rare gem mint is more valuable.', weight: '40%' },
            { icon: '⚖️', title: '10-to-9 Ratio', desc: "If PSA 9s are plentiful but 10s are scarce, the card is especially hard to grade perfectly.", weight: '25%' },
            { icon: '🔢', title: 'Total Population', desc: 'Low overall submission counts suggest the card is rarely sent in — increasing scarcity.', weight: '20%' },
            { icon: '✨', title: 'Desirability', desc: 'Ultra Rares, Special Illustration Rares, and vintage cards get a desirability bonus.', weight: '15%' },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{item.weight}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Score bands */}
      <div className="mb-16 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Score Bands</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { band: 'Strong Buy', range: '80–100', color: 'bg-green-100 border-green-300 text-green-800', desc: 'Very low pop, high desirability' },
            { band: 'Interesting', range: '60–79', color: 'bg-blue-100 border-blue-300 text-blue-800', desc: 'Worth researching further' },
            { band: 'Watch', range: '40–59', color: 'bg-yellow-100 border-yellow-300 text-yellow-800', desc: 'Monitor for price changes' },
            { band: 'Pass', range: '0–39', color: 'bg-gray-100 border-gray-300 text-gray-600', desc: 'High population or low demand' },
          ].map(item => (
            <div key={item.band} className={`rounded-lg border px-4 py-3 ${item.color}`}>
              <p className="font-semibold text-sm">{item.band}</p>
              <p className="text-xs font-mono">{item.range}</p>
              <p className="text-xs mt-1 opacity-80">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured opportunities */}
      {featured.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Opportunities</h2>
            <Link href="/opportunities" className="text-sm text-blue-600 hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {featured.map(card => (
              <OpportunityCard key={card.specId} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-16 text-center text-xs text-gray-400 max-w-2xl mx-auto">
        Investment scores are algorithmic and based on PSA population data and card rarity. They are not financial advice. Pokemon card values can go up or down. Always do your own research before making purchasing decisions.
      </div>
    </PageContainer>
  )
}
