/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pokemontcg.io' },
      { protocol: 'https', hostname: 'assets.tcgdex.net' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['cheerio'],
  },
}

export default nextConfig
