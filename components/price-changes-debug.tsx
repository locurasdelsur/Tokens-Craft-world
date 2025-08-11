"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react"

interface PriceChangesDebugProps {
  tokens: any[]
  selectedPeriod: "h24" | "d7" | "d30"
}

export function PriceChangesDebug({ tokens, selectedPeriod }: PriceChangesDebugProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Analizar los datos de cambios de precio
  const analysis = {
    totalTokens: tokens.length,
    tokensWithValidChanges: tokens.filter((t) => t.priceChanges && typeof t.priceChanges[selectedPeriod] === "number")
      .length,
    tokensWithoutChanges: tokens.filter((t) => !t.priceChanges || typeof t.priceChanges[selectedPeriod] !== "number")
      .length,
    averageChange: 0,
    maxPositive: 0,
    maxNegative: 0,
    realDataTokens: tokens.filter((t) => !t.isSimulated && t.priceChanges?.[selectedPeriod]).length,
    simulatedTokens: tokens.filter((t) => t.isSimulated && t.priceChanges?.[selectedPeriod]).length,
  }

  // Calcular estadísticas
  const validChanges = tokens
    .filter((t) => t.priceChanges && typeof t.priceChanges[selectedPeriod] === "number")
    .map((t) => t.priceChanges[selectedPeriod])

  if (validChanges.length > 0) {
    analysis.averageChange = validChanges.reduce((sum, change) => sum + change, 0) / validChanges.length
    analysis.maxPositive = Math.max(...validChanges.filter((c) => c > 0), 0)
    analysis.maxNegative = Math.min(...validChanges.filter((c) => c < 0), 0)
  }

  const getPeriodLabel = (period: "h24" | "d7" | "d30") => {
    const labels = { h24: "24 Horas", d7: "7 Días", d30: "30 Días" }
    return labels[period]
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-slate-600"
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Debug: Cambios de Precio - {getPeriodLabel(selectedPeriod)}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-orange-600 hover:text-orange-800"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded border">
                <div className="text-sm text-slate-600">Total Tokens</div>
                <div className="text-xl font-bold">{analysis.totalTokens}</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-sm text-slate-600">Con Cambios Válidos</div>
                <div className="text-xl font-bold text-green-600">{analysis.tokensWithValidChanges}</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-sm text-slate-600">Sin Cambios</div>
                <div className="text-xl font-bold text-red-600">{analysis.tokensWithoutChanges}</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-sm text-slate-600">Promedio</div>
                <div className={`text-xl font-bold ${getChangeColor(analysis.averageChange)}`}>
                  {analysis.averageChange > 0 ? "+" : ""}
                  {analysis.averageChange.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Rangos de Cambio */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-100 p-3 rounded border border-green-200">
                <div className="text-sm text-green-700">Mayor Subida</div>
                <div className="text-xl font-bold text-green-600">+{analysis.maxPositive.toFixed(2)}%</div>
              </div>
              <div className="bg-red-100 p-3 rounded border border-red-200">
                <div className="text-sm text-red-700">Mayor Bajada</div>
                <div className="text-xl font-bold text-red-600">{analysis.maxNegative.toFixed(2)}%</div>
              </div>
            </div>

            {/* Fuentes de Datos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-100 p-3 rounded border border-blue-200">
                <div className="text-sm text-blue-700">Datos Reales</div>
                <div className="text-xl font-bold text-blue-600">{analysis.realDataTokens}</div>
              </div>
              <div className="bg-yellow-100 p-3 rounded border border-yellow-200">
                <div className="text-sm text-yellow-700">Datos Simulados</div>
                <div className="text-xl font-bold text-yellow-600">{analysis.simulatedTokens}</div>
              </div>
            </div>

            {/* Muestra de Tokens con Problemas */}
            {analysis.tokensWithoutChanges > 0 && (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <div className="font-medium text-red-800 mb-2">
                  Tokens sin cambios válidos ({analysis.tokensWithoutChanges}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {tokens
                    .filter((t) => !t.priceChanges || typeof t.priceChanges[selectedPeriod] !== "number")
                    .slice(0, 10)
                    .map((token) => (
                      <Badge key={token.symbol} variant="outline" className="text-red-600 border-red-300">
                        {token.symbol}
                      </Badge>
                    ))}
                  {analysis.tokensWithoutChanges > 10 && (
                    <Badge variant="outline" className="text-red-600 border-red-300">
                      +{analysis.tokensWithoutChanges - 10} más
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Muestra de Cambios por Token */}
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-slate-800 mb-2">Muestra de Cambios de Precio (primeros 8 tokens):</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {tokens.slice(0, 8).map((token) => (
                  <div key={token.symbol} className="p-2 bg-slate-50 rounded">
                    <div className="font-medium">{token.symbol}</div>
                    <div className="space-y-0.5">
                      <div className={`${getChangeColor(token.priceChanges?.h24 || 0)}`}>
                        24h: {token.priceChanges?.h24?.toFixed(2) || "N/A"}%
                      </div>
                      <div className={`${getChangeColor(token.priceChanges?.d7 || 0)}`}>
                        7d: {token.priceChanges?.d7?.toFixed(2) || "N/A"}%
                      </div>
                      <div className={`${getChangeColor(token.priceChanges?.d30 || 0)}`}>
                        30d: {token.priceChanges?.d30?.toFixed(2) || "N/A"}%
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {token.isSimulated ? "Sim" : "Real"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Información del Sistema */}
            <div className="text-xs text-orange-600 bg-white/50 p-2 rounded">
              <strong>Debug Info:</strong> Período seleccionado: {selectedPeriod} | Tokens válidos:{" "}
              {analysis.tokensWithValidChanges}/{analysis.totalTokens} | Última actualización:{" "}
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
