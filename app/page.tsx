"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Minus, ExternalLink, Bell, BellOff } from "lucide-react"
import { DebugPanel } from "@/components/debug-panel"
import { ManualPriceInput } from "@/components/manual-price-input"
import { TimePeriodSelector } from "@/components/time-period-selector"
import { PriceChangeDebug } from "@/components/price-change-debug"
import { MarketOpportunities } from "@/components/market-opportunities"
import { PriceAlerts } from "@/components/price-alerts"
import Link from "next/link"
import { TokenIcon } from "@/components/token-icon"
import { CompletionStatus } from "@/components/completion-status"
import { PriceChangesDebug } from "@/components/price-changes-debug"

interface Token {
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

export default function RoninTokenDashboard() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<"h24" | "d7" | "d30">("h24")
  const [showAlerts, setShowAlerts] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const getCoinPrice = (): number => {
    const coinToken = tokens.find((token) => token.symbol === "COIN")
    return coinToken?.priceUsd || 0.001 // Fallback price if COIN not found
  }

  const getPriceInCoin = (tokenPriceUsd: number): number => {
    const coinPrice = getCoinPrice()
    if (coinPrice === 0) return 0
    return tokenPriceUsd / coinPrice
  }

  // Función para obtener precios desde nuestra API
  const fetchPrices = async () => {
    setLoading(true)
    try {
      console.log("🔄 Fetching prices from API...")

      const response = await fetch("/api/tokens", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 API Response:", data)

      if (data.tokens) {
        setTokens(data.tokens)
        setMetadata(data.metadata)
        setLastUpdated(new Date())

        const realPrices = data.tokens.filter((t: Token) => !t.isSimulated).length
        const simulatedPrices = data.tokens.filter((t: Token) => t.isSimulated).length

        console.log(`✅ Precios actualizados: ${realPrices} reales, ${simulatedPrices} simulados`)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("❌ Error fetching prices:", error)
      alert(`Error al obtener precios: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(
      () => {
        console.log("🔄 Auto-refreshing prices...")
        fetchPrices()
      },
      2 * 60 * 1000,
    ) // 2 minutes

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Calcular recomendación basada en el período seleccionado
  const getRecommendation = (priceChanges: any, period: "h24" | "d7" | "d30"): "comprar" | "vender" | "mantener" => {
    if (!priceChanges || typeof priceChanges[period] !== "number") {
      return "mantener"
    }

    const change = priceChanges[period]

    // Umbrales diferentes según el período
    const thresholds = {
      h24: { buy: 5, sell: -5 }, // 5% para 24h
      d7: { buy: 15, sell: -15 }, // 15% para 7d
      d30: { buy: 25, sell: -25 }, // 25% para 30d
    }

    const threshold = thresholds[period]

    if (change > threshold.buy) return "comprar"
    if (change < threshold.sell) return "vender"
    return "mantener"
  }

  // Actualizar cantidad
  const updateQuantity = (index: number, quantity: number) => {
    const updatedTokens = [...tokens]
    updatedTokens[index].quantity = quantity
    updatedTokens[index].totalValue = quantity * updatedTokens[index].priceUsd
    updatedTokens[index].recommendation = getRecommendation(updatedTokens[index].priceChanges, selectedPeriod)
    setTokens(updatedTokens)
  }

  // Manejar actualización manual de precios
  const handleManualPriceUpdate = (updatedTokens: Token[]) => {
    setTokens(updatedTokens)
    setLastUpdated(new Date())
  }

  // Actualizar recomendaciones cuando cambia el período
  useEffect(() => {
    if (tokens.length > 0) {
      const updatedTokens = tokens.map((token) => ({
        ...token,
        recommendation: getRecommendation(token.priceChanges, selectedPeriod),
      }))
      setTokens(updatedTokens)
    }
  }, [selectedPeriod])

  // Cargar datos iniciales
  useEffect(() => {
    fetchPrices()
  }, [])

  const getRecommendationBadge = (recommendation: string) => {
    if (recommendation === "comprar") {
      return (
        <Badge className="bg-green-100 text-green-800">
          <TrendingUp className="w-3 h-3 mr-1" />
          Comprar
        </Badge>
      )
    }
    if (recommendation === "vender") {
      return (
        <Badge className="bg-red-100 text-red-800">
          <TrendingDown className="w-3 h-3 mr-1" />
          Vender
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800">
        <Minus className="w-3 h-3 mr-1" />
        Mantener
      </Badge>
    )
  }

  const getPeriodLabel = (period: "h24" | "d7" | "d30") => {
    const labels = {
      h24: "24h",
      d7: "7d",
      d30: "30d",
    }
    return labels[period]
  }

  const getCurrentPriceChange = (token: Token) => {
    if (!token.priceChanges) {
      console.warn(`Token ${token.symbol} no tiene priceChanges`)
      return 0
    }

    const change = token.priceChanges[selectedPeriod]
    if (typeof change !== "number" || isNaN(change)) {
      console.warn(`Token ${token.symbol} tiene cambio inválido para ${selectedPeriod}:`, change)
      return 0
    }

    return change
  }

  const getCurrentBestSwap = (token: Token) => {
    return token.bestSwap?.[selectedPeriod] || "N/A"
  }

  const getPriceChangeForDisplay = (token: Token) => {
    // Prioridad: priceChanges[period] > priceChange24h > diffPercent > 0
    if (
      token.priceChanges &&
      typeof token.priceChanges[selectedPeriod] === "number" &&
      !isNaN(token.priceChanges[selectedPeriod])
    ) {
      return token.priceChanges[selectedPeriod]
    }

    // Fallback para período de 24h
    if (selectedPeriod === "h24") {
      if (typeof token.priceChange24h === "number" && !isNaN(token.priceChange24h)) {
        return token.priceChange24h
      }
      if (typeof token.diffPercent === "number" && !isNaN(token.diffPercent)) {
        return token.diffPercent
      }
    }

    console.warn(`Token ${token.symbol} no tiene datos válidos de cambio de precio para ${selectedPeriod}`)
    return 0
  }

  const formatPriceChange = (change: number) => {
    if (change === 0) return "0.00%"

    const formatted = Math.abs(change).toFixed(2)
    const sign = change > 0 ? "+" : "-"
    return `${sign}${formatted}%`
  }

  const getPriceChangeColor = (change: number) => {
    if (change > 5) return "text-green-700 font-bold"
    if (change > 0) return "text-green-600"
    if (change < -5) return "text-red-700 font-bold"
    if (change < 0) return "text-red-600"
    return "text-slate-600"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <PriceAlerts tokens={tokens} isVisible={showAlerts} onToggle={() => setShowAlerts(!showAlerts)} />

        {/* Encabezado */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-bold text-center">Panel de Tokens - Ronin Swap</CardTitle>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={fetchPrices}
                  disabled={loading}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Actualizar precios
                </Button>
                <ManualPriceInput tokens={tokens} onUpdatePrices={handleManualPriceUpdate} />
                <MarketOpportunities tokens={tokens} />
                <Button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  {showAlerts ? <BellOff className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
                  Alertas
                </Button>
                <Button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`${autoRefresh ? "bg-green-500/20 hover:bg-green-500/30" : "bg-white/20 hover:bg-white/30"} text-white border-white/30`}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
                  Auto (2min)
                </Button>
                <Link href="/app">
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    App
                  </Button>
                </Link>
              </div>
              {lastUpdated && (
                <p className="text-sm text-white/80">Última actualización: {lastUpdated.toLocaleTimeString()}</p>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Selector de Período de Tiempo */}
        <div className="flex justify-center">
          <TimePeriodSelector selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />
        </div>

        {/* Debug específico de cambios de precio */}
        <PriceChangesDebug tokens={tokens} selectedPeriod={selectedPeriod} />

        {/* Estado de Completación del Sistema */}
        <CompletionStatus tokens={tokens} />

        {/* Debug de Cálculo de Precios */}
        <PriceChangeDebug tokens={tokens} selectedPeriod={selectedPeriod} />

        {/* Debug Panel */}
        <DebugPanel tokens={tokens} metadata={metadata} />

        {/* Tabla de tokens */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Actualizando precios...</span>
              </div>
            ) : tokens.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700 min-w-[120px]">Token</TableHead>
                      <TableHead className="font-semibold text-slate-700 min-w-[80px]">Símbolo</TableHead>
                      <TableHead className="font-semibold text-slate-700 min-w-[140px] hidden md:table-cell">
                        Contrato
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 min-w-[100px]">Precio (USD)</TableHead>
                      <TableHead className="font-semibold text-slate-700 min-w-[100px] hidden xl:table-cell">
                        Precio en COIN
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 min-w-[120px]">Cantidad</TableHead>
                      <TableHead className="font-semibold text-slate-700 min-w-[120px]">Valor Total</TableHead>
                      <TableHead className="font-semibold text-slate-700 min-w-[100px] hidden lg:table-cell">
                        Mejor Swap
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 min-w-[100px]">
                        Diferencia ({getPeriodLabel(selectedPeriod)})
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 min-w-[100px]">Recomendación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token, index) => {
                      const currentChange = getPriceChangeForDisplay(token)
                      const currentBestSwap = getCurrentBestSwap(token)
                      const priceInCoin = getPriceInCoin(token.priceUsd)

                      return (
                        <TableRow key={token.contract} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-medium text-slate-900">
                            <div className="flex items-center">
                              <TokenIcon symbol={token.symbol} category={token.category} size={32} className="mr-3" />
                              <div>
                                <span className="font-semibold">{token.name}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {token.category}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-medium text-slate-700">{token.symbol}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                              {`${token.contract.slice(0, 6)}...${token.contract.slice(-4)}`}
                            </code>
                          </TableCell>
                          <TableCell className="font-mono text-slate-700 font-medium">
                            <div className="flex items-center gap-2">
                              ${token.priceUsd.toFixed(6)}
                              {token.source === "manual-input" && (
                                <Badge variant="outline" className="text-xs text-blue-600">
                                  Manual
                                </Badge>
                              )}
                              {token.source?.includes("geckoterminal") && (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  🦎 Gecko
                                </Badge>
                              )}
                              {token.isSimulated && (
                                <Badge variant="outline" className="text-xs text-orange-600">
                                  Simulado
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell font-mono text-slate-600">
                            <div className="flex items-center gap-1">
                              <TokenIcon symbol="COIN" category="utility" size={16} />
                              {priceInCoin.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={token.quantity || ""}
                              onChange={(e) => updateQuantity(index, Number.parseFloat(e.target.value) || 0)}
                              className="w-24 h-8 text-sm"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="font-mono font-bold text-slate-900">
                            ${(token.totalValue || 0).toFixed(4)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="outline" className="text-xs font-medium">
                              {currentBestSwap}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                {(() => {
                                  const change = getPriceChangeForDisplay(token)
                                  return (
                                    <>
                                      <span className={`font-bold text-sm ${getPriceChangeColor(change)}`}>
                                        {formatPriceChange(change)}
                                      </span>
                                      {change > 0 ? (
                                        <TrendingUp className="w-3 h-3 text-green-600" />
                                      ) : change < 0 ? (
                                        <TrendingDown className="w-3 h-3 text-red-600" />
                                      ) : (
                                        <Minus className="w-3 h-3 text-slate-400" />
                                      )}
                                    </>
                                  )
                                })()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs w-fit">
                                  {getPeriodLabel(selectedPeriod)}
                                </Badge>
                                {token.source === "geckoterminal" && selectedPeriod === "h24" && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    Real
                                  </Badge>
                                )}
                                {token.isSimulated && (
                                  <Badge variant="outline" className="text-xs text-orange-600">
                                    Sim
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getRecommendationBadge(token.recommendation || "mantener")}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                No hay datos disponibles. Haz clic en "Actualizar precios" para cargar los tokens.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen */}
        {tokens.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="shadow-md border-0">
              <CardContent className="p-6">
                <div className="text-sm text-slate-600 mb-1">Total en cartera</div>
                <div className="text-2xl font-bold text-slate-900">
                  ${tokens.reduce((sum, token) => sum + (token.totalValue || 0), 0).toFixed(4)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md border-0">
              <CardContent className="p-6">
                <div className="text-sm text-slate-600 mb-1">Tokens con valor</div>
                <div className="text-2xl font-bold text-slate-900">
                  {tokens.filter((token) => (token.quantity || 0) > 0).length}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md border-0">
              <CardContent className="p-6">
                <div className="text-sm text-slate-600 mb-1">Precios manuales</div>
                <div className="text-2xl font-bold text-blue-600">
                  {tokens.filter((token) => token.source === "manual-input").length}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md border-0">
              <CardContent className="p-6">
                <div className="text-sm text-slate-600 mb-1">
                  Recomendaciones de compra ({getPeriodLabel(selectedPeriod)})
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {tokens.filter((token) => token.recommendation === "comprar").length}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md border-0">
              <CardContent className="p-6">
                <div className="text-sm text-slate-600 mb-1">Datos GeckoTerminal</div>
                <div className="text-2xl font-bold text-green-600">
                  {tokens.filter((token) => token.source?.includes("geckoterminal")).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
