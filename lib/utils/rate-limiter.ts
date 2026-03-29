const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
]

let userAgentIndex = 0

function getNextUserAgent(): string {
  const ua = USER_AGENTS[userAgentIndex % USER_AGENTS.length]
  userAgentIndex++
  return ua
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

class RateLimiter {
  private lastRequest: Map<string, number> = new Map()
  private minDelayMs: number

  constructor(minDelayMs: number) {
    this.minDelayMs = minDelayMs
  }

  async throttle(domain: string): Promise<void> {
    const now = Date.now()
    const last = this.lastRequest.get(domain) ?? 0
    const elapsed = now - last
    const jitter = Math.floor(Math.random() * 500)
    const delay = Math.max(0, this.minDelayMs + jitter - elapsed)
    if (delay > 0) {
      await sleep(delay)
    }
    this.lastRequest.set(domain, Date.now())
  }

  async throttledFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const domain = new URL(url).hostname
    await this.throttle(domain)
    return fetch(url, options)
  }
}

export const psaRateLimiter = new RateLimiter(2000)
export const tcgRateLimiter = new RateLimiter(200)

export async function fetchPSAWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await psaRateLimiter.throttledFetch(url, {
        headers: {
          'User-Agent': getNextUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.psacard.com/pop',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      })

      if (res.ok) return res

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10)
        await sleep(retryAfter * 1000)
        continue
      }

      if (res.status === 403) {
        throw new Error(`PSA blocked request (403) for ${url}`)
      }

      if (attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000)
        continue
      }

      throw new Error(`PSA request failed with status ${res.status}`)
    } catch (e) {
      if (attempt === maxRetries - 1) throw e
      await sleep(Math.pow(2, attempt) * 1000)
    }
  }
  throw new Error('Max retries exceeded')
}
