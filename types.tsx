export interface Opportunity {
  id: string
  type: "arbitrage" | "swap" | "liquidity"
  tokenFrom: string
  tokenTo: string
  route: string[]
  investmentUsd: number
  expectedReturnUsd: number
  roi: number
  risk: "low" | "medium" | "high"
  confidence: number
  estimatedTimeMinutes: number
  fees: {
    gas: number
    swap: number
    slippage: number
    total: number
  }
  steps: {
    action: string
    from: string
    to: string
    amount: number
    price: number
    fee: number
  }[]
  createdAt: Date
  expiresAt: Date
}

export interface Token {
  name: string
  symbol: string
  contract: string
  category: string
  decimals: number
  priceUsd: number
  priceChanges: {
    h24: number
    d7: number
    d30: number
  }
  bestSwap: {
    h24: string
    d7: string
    d30: string
  }
  diffPercent: number
  conversionRate: number
  quantity?: number
  totalValue?: number
  recommendation?: "comprar" | "vender" | "mantener"
  priceChange24h?: number
  volume24h?: number
  liquidity?: number
  marketCap?: number
  txns24h?: number
  lastUpdated?: string
  isSimulated?: boolean
  source?: string
}

export interface PriceAlert {
  id: string
  tokenSymbol: string
  tokenName: string
  category: string
  previousPrice: number
  currentPrice: number
  changePercent: number
  timestamp: Date
  type: "spike" | "surge" | "moon"
}
