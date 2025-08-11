export interface DexScreenerPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd: string
  txns: {
    m5: { buys: number; sells: number }
    h1: { buys: number; sells: number }
    h6: { buys: number; sells: number }
    h24: { buys: number; sells: number }
  }
  volume: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  priceChange: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
  liquidity?: {
    usd?: number
    base?: number
    quote?: number
  }
  fdv?: number
  marketCap?: number
}

export class DexScreenerAPI {
  private static readonly BASE_URL = "https://api.dexscreener.com/latest/dex"
  private static readonly RATE_LIMIT_DELAY = 200 // ms between requests

  static async getTokenPairs(tokenAddress: string): Promise<DexScreenerPair[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/tokens/${tokenAddress}`)

      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`)
      }

      const data = await response.json()
      return data.pairs || []
    } catch (error) {
      console.error(`Error fetching token data for ${tokenAddress}:`, error)
      return []
    }
  }

  static async searchPairs(query: string): Promise<DexScreenerPair[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/search/?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`)
      }

      const data = await response.json()
      return data.pairs || []
    } catch (error) {
      console.error(`Error searching for ${query}:`, error)
      return []
    }
  }

  static getRoninPair(pairs: DexScreenerPair[]): DexScreenerPair | null {
    return pairs.find((pair) => pair.chainId === "ronin") || null
  }

  static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
