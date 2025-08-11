"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  TrendingUp,
  ArrowRight,
  Calculator,
  DollarSign,
  Target,
  RefreshCw,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react"
import { TokenIcon } from "@/components/token-icon"

interface MarketPath {
  id: string
  steps: {
    from: any
    to: any
    action: "buy" | "swap" | "sell"
    inputAmount: number
    outputAmount: number
    fee: number
    priceImpact: number
  }[]
  totalInvestment: number
  totalReturn: number
  netProfit: number
  roi: number
  totalFees: number
  riskLevel: "low" | "medium" | "high"
  timeEstimate: string
  confidence: number
}

interface MarketOpportunitiesProps {
  tokens: any[]
}

export function MarketOpportunities({ tokens }: MarketOpportunitiesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [opportunities, setOpportunities] = useState<MarketPath[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [investmentAmount, setInvestmentAmount] = useState(100) // USD base
  const [maxSteps, setMaxSteps] = useState(3) // Máximo 3 pasos
  const [minROI, setMinROI] = useState(5) // Mínimo 5% ROI

  const SWAP_FEE = 0.0101 // 1.01% por swap
  const SLIPPAGE = 0.005 // 0.5% slippage
  const GAS_COST_USD = 0.1 // $0.10 por transacción

  // Calcular oportunidades de mercado
  const analyzeMarketOpportunities = () => {
    setIsAnalyzing(true)

    try {
      const validTokens = tokens.filter((token) => token.priceUsd > 0 && !isNaN(token.priceUsd))
      const paths: MarketPath[] = []

      // Generar todas las combinaciones posibles de rutas
      for (let startIdx = 0; startIdx < validTokens.length; startIdx++) {
        const startToken = validTokens[startIdx]

        // Rutas de 1 paso: Comprar → Vender
        const singleStepPath = calculateSingleStepPath(startToken, investmentAmount)
        if (singleStepPath && singleStepPath.roi >= minROI) {
          paths.push(singleStepPath)
        }

        // Rutas de 2 pasos: Comprar → Swap → Vender
        if (maxSteps >= 2) {
          for (let midIdx = 0; midIdx < validTokens.length; midIdx++) {
            if (midIdx !== startIdx) {
              const midToken = validTokens[midIdx]
              const twoStepPath = calculateTwoStepPath(startToken, midToken, investmentAmount)
              if (twoStepPath && twoStepPath.roi >= minROI) {
                paths.push(twoStepPath)
              }
            }
          }
        }

        // Rutas de 3 pasos: Comprar → Swap → Swap → Vender
        if (maxSteps >= 3) {
          for (let midIdx1 = 0; midIdx1 < validTokens.length; midIdx1++) {
            if (midIdx1 !== startIdx) {
              for (let midIdx2 = 0; midIdx2 < validTokens.length; midIdx2++) {
                if (midIdx2 !== startIdx && midIdx2 !== midIdx1) {
                  const midToken1 = validTokens[midIdx1]
                  const midToken2 = validTokens[midIdx2]
                  const threeStepPath = calculateThreeStepPath(startToken, midToken1, midToken2, investmentAmount)
                  if (threeStepPath && threeStepPath.roi >= minROI) {
                    paths.push(threeStepPath)
                  }
                }
              }
            }
          }
        }
      }

      // Ordenar por ROI descendente y tomar las mejores 20
      const sortedPaths = paths.sort((a, b) => b.roi - a.roi).slice(0, 20)

      setOpportunities(sortedPaths)
    } catch (error) {
      console.error("Error analyzing opportunities:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Calcular ruta de 1 paso
  const calculateSingleStepPath = (token: any, investment: number): MarketPath | null => {
    try {
      // Comprar token
      const tokensReceived = (investment * (1 - SWAP_FEE - SLIPPAGE)) / token.priceUsd

      // Simular cambio de precio (usar tendencia actual)
      const priceChange = token.priceChanges?.h24 || 0
      const futurePrice = token.priceUsd * (1 + priceChange / 100)

      // Vender token
      const finalUSD = tokensReceived * futurePrice * (1 - SWAP_FEE - SLIPPAGE)

      const totalFees = investment * SWAP_FEE * 2 + GAS_COST_USD * 2
      const netProfit = finalUSD - investment - totalFees
      const roi = (netProfit / investment) * 100

      if (roi < minROI) return null

      return {
        id: `single-${token.symbol}-${Date.now()}`,
        steps: [
          {
            from: { symbol: "USD", name: "US Dollar" },
            to: token,
            action: "buy",
            inputAmount: investment,
            outputAmount: tokensReceived,
            fee: investment * SWAP_FEE,
            priceImpact: SLIPPAGE * 100,
          },
          {
            from: token,
            to: { symbol: "USD", name: "US Dollar" },
            action: "sell",
            inputAmount: tokensReceived,
            outputAmount: finalUSD,
            fee: finalUSD * SWAP_FEE,
            priceImpact: SLIPPAGE * 100,
          },
        ],
        totalInvestment: investment,
        totalReturn: finalUSD,
        netProfit,
        roi,
        totalFees,
        riskLevel: Math.abs(priceChange) > 15 ? "high" : Math.abs(priceChange) > 8 ? "medium" : "low",
        timeEstimate: "1-2 horas",
        confidence: Math.max(20, 100 - Math.abs(priceChange) * 2),
      }
    } catch (error) {
      return null
    }
  }

  // Calcular ruta de 2 pasos
  const calculateTwoStepPath = (token1: any, token2: any, investment: number): MarketPath | null => {
    try {
      // Paso 1: Comprar token1
      const token1Amount = (investment * (1 - SWAP_FEE - SLIPPAGE)) / token1.priceUsd

      // Paso 2: Swap token1 → token2
      const token1ValueUSD = token1Amount * token1.priceUsd
      const token2Amount = (token1ValueUSD * (1 - SWAP_FEE - SLIPPAGE)) / token2.priceUsd

      // Simular cambios de precio
      const token2Change = token2.priceChanges?.h24 || 0
      const token2FuturePrice = token2.priceUsd * (1 + token2Change / 100)

      // Paso 3: Vender token2
      const finalUSD = token2Amount * token2FuturePrice * (1 - SWAP_FEE - SLIPPAGE)

      const totalFees = investment * SWAP_FEE * 3 + GAS_COST_USD * 3
      const netProfit = finalUSD - investment - totalFees
      const roi = (netProfit / investment) * 100

      if (roi < minROI) return null

      const avgVolatility = (Math.abs(token1.priceChanges?.h24 || 0) + Math.abs(token2.priceChanges?.h24 || 0)) / 2

      return {
        id: `double-${token1.symbol}-${token2.symbol}-${Date.now()}`,
        steps: [
          {
            from: { symbol: "USD", name: "US Dollar" },
            to: token1,
            action: "buy",
            inputAmount: investment,
            outputAmount: token1Amount,
            fee: investment * SWAP_FEE,
            priceImpact: SLIPPAGE * 100,
          },
          {
            from: token1,
            to: token2,
            action: "swap",
            inputAmount: token1Amount,
            outputAmount: token2Amount,
            fee: token1ValueUSD * SWAP_FEE,
            priceImpact: SLIPPAGE * 100,
          },
          {
            from: token2,
            to: { symbol: "USD", name: "US Dollar" },
            action: "sell",
            inputAmount: token2Amount,
            outputAmount: finalUSD,
            fee: finalUSD * SWAP_FEE,
            priceImpact: SLIPPAGE * 100,
          },
        ],
        totalInvestment: investment,
        totalReturn: finalUSD,
        netProfit,
        roi,
        totalFees,
        riskLevel: avgVolatility > 15 ? "high" : avgVolatility > 8 ? "medium" : "low",
        timeEstimate: "2-4 horas",
        confidence: Math.max(15, 90 - avgVolatility * 1.5),
      }
    } catch (error) {
      return null
    }
  }

  // Calcular ruta de 3 pasos
  const calculateThreeStepPath = (token1: any, token2: any, token3: any, investment: number): MarketPath | null => {
    try {
      // Paso 1: Comprar token1
      const token1Amount = (investment * (1 - SWAP_FEE - SLIPPAGE)) / token1.priceUsd

      // Paso 2: Swap token1 → token2
      const token1ValueUSD = token1Amount * token1.priceUsd
      const token2Amount = (token1ValueUSD * (1 - SWAP_FEE - SLIPPAGE)) / token2.priceUsd

      // Paso 3: Swap token2 → token3
      const token2ValueUSD = token2Amount * token2.priceUsd
      const token3Amount = (token2ValueUSD * (1 - SWAP_FEE - SLIPPAGE)) / token3.priceUsd

      // Simular cambio de precio en token3
      const token3Change = token3.priceChanges?.h24 || 0
      const token3FuturePrice = token3.priceUsd * (1 + token3Change / 100)

      // Paso 4: Vender token3
      const finalUSD = token3Amount * token3FuturePrice * (1 - SWAP_FEE - SLIPPAGE)

      const totalFees = investment * SWAP_FEE * 4 + GAS_COST_USD * 4
      const netProfit = finalUSD - investment - totalFees
      const roi = (netProfit / investment) * 100

      if (roi < minROI) return null

      const avgVolatility =
        (Math.abs(token1.priceChanges?.h24 || 0) +
          Math.abs(token2.priceChanges?.h24 || 0) +
          Math.abs(token3.priceChanges?.h24 || 0)) /
        3

      return {
        id: `triple-${token1.symbol}-${token2.symbol}-${token3.symbol}-${Date.now()}`,
        steps: [
          {
            from: { symbol: "USD", name: "US Dollar" },
            to: token1,
            action: "buy",
            inputAmount: investment,
            outputAmount: token1Amount,
            fee: investment * SWAP_FEE,
            priceImpact: SLIPPAGE * 100,
          },
          {
            from: token1,
            to: token2,
            action: "swap",
            inputAmount: token1Amount,
            outputAmount: token2Amount,
            fee: token1ValueUSD * SWAP_FEE,
            priceImpact: SLIPPAGE * 100,
          },
          {
            from: token2,
            to: token3,
            action: "swap",
            inputAmount: token2Amount,
            outputAmount: token3Amount,
            fee: token2ValueUSD * SWAP_FEE,
            priceImpact: SLIPPAGE * 100,
          },
          {
            from: token3,
            to: { symbol: "USD", name: "US Dollar" },
            action: "sell",
            inputAmount: token3Amount,
            outputAmount: finalUSD,
            fee: finalUSD * SWAP_FEE,
            priceImpact: SLIPPAGE * 100,
          },
        ],
        totalInvestment: investment,
        totalReturn: finalUSD,
        netProfit,
        roi,
        totalFees,
        riskLevel: avgVolatility > 20 ? "high" : avgVolatility > 12 ? "medium" : "low",
        timeEstimate: "4-8 horas",
        confidence: Math.max(10, 80 - avgVolatility * 2),
      }
    } catch (error) {
      return null
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "low":
        return <Badge className="bg-green-100 text-green-800">Bajo Riesgo</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Riesgo Medio</Badge>
      case "high":
        return <Badge className="bg-red-100 text-red-800">Alto Riesgo</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "buy":
        return <DollarSign className="w-3 h-3 text-green-600" />
      case "swap":
        return <ArrowRightLeft className="w-3 h-3 text-blue-600" />
      case "sell":
        return <TrendingUp className="w-3 h-3 text-purple-600" />
      default:
        return <Target className="w-3 h-3" />
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case "buy":
        return "Comprar"
      case "swap":
        return "Intercambiar"
      case "sell":
        return "Vender"
      default:
        return "Acción"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={analyzeMarketOpportunities}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <Target className="w-4 h-4 mr-2" />
          Oportunidades de Mercado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Análisis de Oportunidades de Mercado
            <Badge variant="outline" className="ml-2">
              {opportunities.length} oportunidades encontradas
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Configuración */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
          <div>
            <Label>Inversión Base (USD)</Label>
            <Input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value))}
              min="10"
              max="10000"
            />
          </div>
          <div>
            <Label>Máximo Pasos</Label>
            <Input
              type="number"
              value={maxSteps}
              onChange={(e) => setMaxSteps(Number(e.target.value))}
              min="1"
              max="3"
            />
          </div>
          <div>
            <Label>ROI Mínimo (%)</Label>
            <Input type="number" value={minROI} onChange={(e) => setMinROI(Number(e.target.value))} min="1" max="50" />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button onClick={analyzeMarketOpportunities} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4 mr-2" />
            )}
            {isAnalyzing ? "Analizando..." : "Analizar Oportunidades"}
          </Button>
        </div>

        {isAnalyzing ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
              <p className="text-slate-600">Analizando {tokens.length} tokens y calculando rutas óptimas...</p>
              <p className="text-sm text-slate-500 mt-1">Esto puede tomar unos segundos</p>
            </div>
          </div>
        ) : opportunities.length > 0 ? (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="text-sm text-green-600 mb-1">Mejor ROI</div>
                  <div className="text-2xl font-bold text-green-700">+{opportunities[0]?.roi.toFixed(1)}%</div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="text-sm text-blue-600 mb-1">Ganancia Promedio</div>
                  <div className="text-2xl font-bold text-blue-700">
                    ${(opportunities.reduce((sum, op) => sum + op.netProfit, 0) / opportunities.length).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="text-sm text-purple-600 mb-1">Bajo Riesgo</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {opportunities.filter((op) => op.riskLevel === "low").length}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="text-sm text-orange-600 mb-1">Alta Confianza</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {opportunities.filter((op) => op.confidence > 70).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Oportunidades */}
            <div className="space-y-3">
              {opportunities.map((opportunity, index) => (
                <Card key={opportunity.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-800">#{index + 1}</Badge>
                        <div className="text-lg font-bold text-green-600">+{opportunity.roi.toFixed(1)}% ROI</div>
                        <div className="text-sm text-slate-600">(${opportunity.netProfit.toFixed(2)} ganancia)</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRiskBadge(opportunity.riskLevel)}
                        <Badge variant="outline">{opportunity.confidence.toFixed(0)}% confianza</Badge>
                      </div>
                    </div>

                    {/* Ruta de Intercambio */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-slate-700 mb-2">Ruta de Intercambio:</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {opportunity.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-white p-2 rounded border">
                              {getActionIcon(step.action)}
                              <div className="text-xs">
                                <div className="font-medium">
                                  {step.from.symbol === "USD" ? (
                                    <span className="text-green-600">USD</span>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <TokenIcon symbol={step.from.symbol} category={step.from.category} size={16} />
                                      {step.from.symbol}
                                    </div>
                                  )}
                                </div>
                                <div className="text-slate-500">{getActionLabel(step.action)}</div>
                              </div>
                            </div>
                            {stepIndex < opportunity.steps.length - 1 && (
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Detalles */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-slate-500">Inversión</div>
                        <div className="font-medium">${opportunity.totalInvestment}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Retorno</div>
                        <div className="font-medium text-green-600">${opportunity.totalReturn.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Comisiones</div>
                        <div className="font-medium text-red-600">${opportunity.totalFees.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Tiempo Est.</div>
                        <div className="font-medium">{opportunity.timeEstimate}</div>
                      </div>
                    </div>

                    {/* Pasos Detallados */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                        Ver pasos detallados
                      </summary>
                      <div className="mt-2 space-y-2">
                        {opportunity.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="bg-slate-50 p-3 rounded text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getActionIcon(step.action)}
                                <span className="font-medium">{getActionLabel(step.action)}</span>
                                <span>
                                  {step.from.symbol} → {step.to.symbol}
                                </span>
                              </div>
                              <div className="text-right">
                                <div>Entrada: {step.inputAmount.toFixed(4)}</div>
                                <div>Salida: {step.outputAmount.toFixed(4)}</div>
                              </div>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              Comisión: ${step.fee.toFixed(3)} | Impacto: {step.priceImpact.toFixed(2)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No se encontraron oportunidades rentables</p>
            <p className="text-sm">Intenta reducir el ROI mínimo o aumentar la inversión base</p>
          </div>
        )}

        {/* Disclaimer */}
        <Card className="bg-yellow-50 border-yellow-200 mt-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <div className="font-medium mb-1">⚠️ Advertencia Importante:</div>
                <div className="space-y-1 text-xs">
                  <div>• Los cálculos son estimaciones basadas en precios actuales y pueden cambiar</div>
                  <div>• Los mercados de criptomonedas son volátiles y conllevan riesgos</div>
                  <div>• Las comisiones reales pueden variar según la plataforma</div>
                  <div>• Siempre haz tu propia investigación antes de invertir</div>
                  <div>• No inviertas más de lo que puedas permitirte perder</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
