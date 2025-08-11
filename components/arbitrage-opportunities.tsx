"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calculator,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react"

interface ArbitrageOpportunity {
  fromToken: any
  toToken: any
  directSwapResult: number // Cantidad de tokens que obtienes con swap directo
  sellBuyResult: number // Cantidad de tokens que obtienes vendiendo y comprando
  advantage: number // Diferencia en porcentaje
  advantageType: "direct-swap" | "sell-buy" | "equal"
  netGain: number // Ganancia neta en porcentaje
  isProfit: boolean
  recommendation: "strong-advantage" | "advantage" | "neutral" | "avoid"
  swapFees: {
    directSwap: number
    sellBuy: number
  }
}

interface ArbitrageOpportunitiesProps {
  tokens: any[]
  selectedPeriod: "h24" | "d7" | "d30"
}

export function ArbitrageOpportunities({ tokens, selectedPeriod }: ArbitrageOpportunitiesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const SWAP_FEE_RATE = 0.0101 // 1.01%
  const INVESTMENT_AMOUNT = 100 // $100 USD como base para cálculos

  const calculateArbitrageOpportunities = () => {
    setIsAnalyzing(true)

    const validTokens = tokens.filter((token) => token.priceUsd > 0)
    const opportunities: ArbitrageOpportunity[] = []

    // Comparar cada token con todos los demás
    for (let i = 0; i < validTokens.length; i++) {
      for (let j = 0; j < validTokens.length; j++) {
        if (i !== j) {
          const fromToken = validTokens[i]
          const toToken = validTokens[j]

          // Precios actuales
          const fromPrice = fromToken.priceUsd
          const toPrice = toToken.priceUsd

          // Calcular cuántos tokens FROM puedes comprar con $100
          const fromTokenAmount = INVESTMENT_AMOUNT / fromPrice

          // MÉTODO 1: Swap directo (FROM → TO)
          // Aplicar comisión del 1.01% en el swap directo
          const directSwapAmount = fromTokenAmount * (1 - SWAP_FEE_RATE)
          // Calcular cuántos tokens TO obtienes (asumiendo ratio 1:1 ajustado por precio)
          const directSwapResult = (directSwapAmount * fromPrice) / toPrice

          // MÉTODO 2: Vender y comprar (FROM → USD → TO)
          // Vender FROM tokens a USD (con comisión)
          const usdFromSale = fromTokenAmount * fromPrice * (1 - SWAP_FEE_RATE)
          // Comprar TO tokens con USD (con comisión)
          const sellBuyResult = (usdFromSale * (1 - SWAP_FEE_RATE)) / toPrice

          // Calcular ventaja
          const advantage = ((directSwapResult - sellBuyResult) / sellBuyResult) * 100
          let advantageType: "direct-swap" | "sell-buy" | "equal"

          if (Math.abs(advantage) < 0.1) {
            advantageType = "equal"
          } else if (advantage > 0) {
            advantageType = "direct-swap"
          } else {
            advantageType = "sell-buy"
          }

          // Ganancia neta (diferencia absoluta)
          const netGain = Math.abs(advantage)
          const isProfit = netGain > 0.5 // Mínimo 0.5% de diferencia para considerar rentable

          // Clasificar recomendación
          let recommendation: "strong-advantage" | "advantage" | "neutral" | "avoid"
          if (netGain > 5) recommendation = "strong-advantage"
          else if (netGain > 2) recommendation = "advantage"
          else if (netGain > 0.5) recommendation = "neutral"
          else recommendation = "avoid"

          opportunities.push({
            fromToken,
            toToken,
            directSwapResult,
            sellBuyResult,
            advantage,
            advantageType,
            netGain,
            isProfit,
            recommendation,
            swapFees: {
              directSwap: SWAP_FEE_RATE * 100,
              sellBuy: SWAP_FEE_RATE * 2 * 100, // Dos transacciones
            },
          })
        }
      }
    }

    // Ordenar por ganancia neta descendente
    opportunities.sort((a, b) => b.netGain - a.netGain)

    // Tomar solo las mejores 25 oportunidades
    setOpportunities(opportunities.slice(0, 25))
    setIsAnalyzing(false)
  }

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "strong-advantage":
        return (
          <Badge className="bg-green-600 text-white">
            <TrendingUp className="w-3 h-3 mr-1" />
            Gran Ventaja
          </Badge>
        )
      case "advantage":
        return (
          <Badge className="bg-green-100 text-green-800">
            <TrendingUp className="w-3 h-3 mr-1" />
            Ventaja
          </Badge>
        )
      case "neutral":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Calculator className="w-3 h-3 mr-1" />
            Neutral
          </Badge>
        )
      default:
        return (
          <Badge className="bg-red-100 text-red-800">
            <TrendingDown className="w-3 h-3 mr-1" />
            Sin Ventaja
          </Badge>
        )
    }
  }

  const getAdvantageIcon = (advantageType: string, netGain: number) => {
    if (netGain > 3) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (netGain > 1) return <CheckCircle className="w-4 h-4 text-yellow-600" />
    return <XCircle className="w-4 h-4 text-red-600" />
  }

  const getAdvantageText = (advantageType: string) => {
    switch (advantageType) {
      case "direct-swap":
        return "Swap Directo"
      case "sell-buy":
        return "Vender + Comprar"
      case "equal":
        return "Igual"
      default:
        return "N/A"
    }
  }

  const getAdvantageColor = (advantageType: string) => {
    switch (advantageType) {
      case "direct-swap":
        return "text-green-600"
      case "sell-buy":
        return "text-blue-600"
      case "equal":
        return "text-slate-600"
      default:
        return "text-slate-600"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={calculateArbitrageOpportunities}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Oportunidades
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Análisis de Oportunidades de Swap Actual
            <Badge variant="outline" className="ml-2">
              Base: ${INVESTMENT_AMOUNT} USD
            </Badge>
          </DialogTitle>
          <div className="text-sm text-slate-600 mt-2">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                <Percent className="w-3 h-3" />
                Swap directo: 1.01%
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Vender + Comprar: 2.02%
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Comparando métodos de intercambio
              </div>
            </div>
          </div>
        </DialogHeader>

        {isAnalyzing ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-slate-600">Analizando oportunidades de swap...</p>
            </div>
          </div>
        ) : opportunities.length > 0 ? (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="text-sm text-green-600 mb-1">Ventajas Encontradas</div>
                  <div className="text-2xl font-bold text-green-700">
                    {opportunities.filter((op) => op.isProfit).length}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="text-sm text-blue-600 mb-1">Mayor Ventaja</div>
                  <div className="text-2xl font-bold text-blue-700">+{opportunities[0]?.netGain.toFixed(2)}%</div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="text-sm text-purple-600 mb-1">Swap Directo Mejor</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {opportunities.filter((op) => op.advantageType === "direct-swap").length}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="text-sm text-orange-600 mb-1">Vender+Comprar Mejor</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {opportunities.filter((op) => op.advantageType === "sell-buy").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de Oportunidades */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparación de Métodos de Intercambio</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Intercambio</TableHead>
                        <TableHead className="font-semibold">Swap Directo</TableHead>
                        <TableHead className="font-semibold">Vender + Comprar</TableHead>
                        <TableHead className="font-semibold">Mejor Método</TableHead>
                        <TableHead className="font-semibold">Ventaja</TableHead>
                        <TableHead className="font-semibold">Comisiones</TableHead>
                        <TableHead className="font-semibold">Recomendación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {opportunities.map((opportunity, index) => (
                        <TableRow
                          key={`${opportunity.fromToken.contract}-${opportunity.toToken.contract}`}
                          className="hover:bg-slate-50/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getAdvantageIcon(opportunity.advantageType, opportunity.netGain)}
                              <span className="text-xs text-slate-500">#{index + 1}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-sm">
                                <span className="font-medium">{opportunity.fromToken.symbol}</span>
                                <ArrowRight className="w-3 h-3 inline mx-1 text-slate-400" />
                                <span className="font-medium">{opportunity.toToken.symbol}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div className="font-mono">{opportunity.directSwapResult.toFixed(4)} tokens</div>
                              <div className="text-slate-500">Comisión: 1.01%</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div className="font-mono">{opportunity.sellBuyResult.toFixed(4)} tokens</div>
                              <div className="text-slate-500">Comisión: 2.02%</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getAdvantageColor(opportunity.advantageType)}`}
                            >
                              {getAdvantageText(opportunity.advantageType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span
                                className={`font-bold ${opportunity.netGain > 1 ? "text-green-600" : "text-slate-600"}`}
                              >
                                +{opportunity.netGain.toFixed(2)}%
                              </span>
                              {opportunity.netGain > 3 && <DollarSign className="w-3 h-3 text-green-600" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>Directo: -{opportunity.swapFees.directSwap.toFixed(2)}%</div>
                              <div>V+C: -{opportunity.swapFees.sellBuy.toFixed(2)}%</div>
                            </div>
                          </TableCell>
                          <TableCell>{getRecommendationBadge(opportunity.recommendation)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Explicación */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-2">📊 Cómo interpretar los resultados:</div>
                  <div className="space-y-1 text-xs">
                    <div>
                      • <strong>Swap Directo:</strong> Intercambio directo TOKEN_A → TOKEN_B (comisión: 1.01%)
                    </div>
                    <div>
                      • <strong>Vender + Comprar:</strong> TOKEN_A → USD → TOKEN_B (comisión: 2.02% total)
                    </div>
                    <div>
                      • <strong>Ventaja:</strong> Diferencia porcentual entre ambos métodos
                    </div>
                    <div>
                      • <strong>Gran Ventaja:</strong> &gt; 5% | <strong>Ventaja:</strong> &gt; 2% |{" "}
                      <strong>Neutral:</strong> &gt; 0.5%
                    </div>
                    <div>
                      • <strong>Base de cálculo:</strong> ${INVESTMENT_AMOUNT} USD para comparar métodos
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Calculator className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>Haz clic en "Oportunidades" para analizar las diferencias entre métodos de swap</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
