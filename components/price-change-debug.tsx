"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Calculator } from "lucide-react"

interface PriceChangeDebugProps {
  tokens: any[]
  selectedPeriod: "h24" | "d7" | "d30"
}

export function PriceChangeDebug({ tokens, selectedPeriod }: PriceChangeDebugProps) {
  const [isOpen, setIsOpen] = useState(false)

  const sampleTokens = tokens.slice(0, 5) // Mostrar solo los primeros 5 tokens

  const getPeriodLabel = (period: "h24" | "d7" | "d30") => {
    const labels = {
      h24: "24 Horas",
      d7: "7 Días",
      d30: "30 Días",
    }
    return labels[period]
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-slate-600"
  }

  const getRecommendationColor = (rec: string) => {
    if (rec === "comprar") return "text-green-700 bg-green-100"
    if (rec === "vender") return "text-red-700 bg-red-100"
    return "text-yellow-700 bg-yellow-100"
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Debug: Cálculo de Diferencias de Precio
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-blue-600 hover:text-blue-800"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="text-sm text-blue-700 bg-white/50 p-3 rounded">
              <div className="font-medium mb-2">Período Seleccionado: {getPeriodLabel(selectedPeriod)}</div>
              <div className="text-xs space-y-1">
                <div>• 24h: Cambios en las últimas 24 horas (umbral: ±5%)</div>
                <div>• 7d: Cambios en los últimos 7 días (umbral: ±15%)</div>
                <div>• 30d: Cambios en los últimos 30 días (umbral: ±25%)</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-medium text-blue-800">Muestra de Cálculos:</div>
              {sampleTokens.map((token, index) => (
                <div key={token.contract} className="bg-white/70 p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{token.symbol}</div>
                    <div className="text-xs text-slate-600">Precio: ${token.priceUsd.toFixed(6)}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-slate-500">24h</div>
                      <div className={`font-bold ${getChangeColor(token.priceChanges?.h24 || 0)}`}>
                        {token.priceChanges?.h24 > 0 ? "+" : ""}
                        {(token.priceChanges?.h24 || 0).toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-500">7d</div>
                      <div className={`font-bold ${getChangeColor(token.priceChanges?.d7 || 0)}`}>
                        {token.priceChanges?.d7 > 0 ? "+" : ""}
                        {(token.priceChanges?.d7 || 0).toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-500">30d</div>
                      <div className={`font-bold ${getChangeColor(token.priceChanges?.d30 || 0)}`}>
                        {token.priceChanges?.d30 > 0 ? "+" : ""}
                        {(token.priceChanges?.d30 || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs">
                      <span className="text-slate-500">Cambio actual ({selectedPeriod}): </span>
                      <span className={`font-bold ${getChangeColor(token.priceChanges?.[selectedPeriod] || 0)}`}>
                        {token.priceChanges?.[selectedPeriod] > 0 ? "+" : ""}
                        {(token.priceChanges?.[selectedPeriod] || 0).toFixed(2)}%
                      </span>
                    </div>
                    <Badge className={`text-xs ${getRecommendationColor(token.recommendation || "mantener")}`}>
                      {token.recommendation || "mantener"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-blue-600 bg-white/30 p-2 rounded">
              <strong>Nota:</strong> Los cambios se calculan usando algoritmos determinísticos basados en el hash del
              nombre del token para generar datos consistentes y realistas cuando no hay datos reales disponibles.
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
