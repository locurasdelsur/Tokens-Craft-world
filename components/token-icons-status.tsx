"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TokenIcon, getTokensWithIcons, getTokensWithoutIcons } from "@/components/token-icon"
import { CheckCircle, XCircle, ImageIcon } from "lucide-react"

interface TokenIconsStatusProps {
  tokens: any[]
}

export function TokenIconsStatus({ tokens }: TokenIconsStatusProps) {
  const tokensWithIcons = getTokensWithIcons()
  const tokensWithoutIcons = getTokensWithoutIcons()

  const availableTokens = tokens.filter((token) => tokensWithIcons.includes(token.symbol))
  const missingTokens = tokens.filter((token) => tokensWithoutIcons.includes(token.symbol))

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <ImageIcon className="w-5 h-5" />
          Estado de Iconos de Tokens
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tokens con iconos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">Tokens con Iconos ({availableTokens.length})</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {availableTokens.map((token) => (
                <div key={token.symbol} className="flex flex-col items-center p-2 bg-white rounded-lg border">
                  <TokenIcon symbol={token.symbol} category={token.category} size={24} />
                  <span className="text-xs font-medium mt-1">{token.symbol}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tokens sin iconos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-orange-800">Tokens sin Iconos ({missingTokens.length})</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {missingTokens.map((token) => (
                <div key={token.symbol} className="flex flex-col items-center p-2 bg-white rounded-lg border">
                  <TokenIcon symbol={token.symbol} category={token.category} size={24} />
                  <span className="text-xs font-medium mt-1">{token.symbol}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-lg border text-center">
            <div className="text-2xl font-bold text-green-600">{availableTokens.length}</div>
            <div className="text-sm text-slate-600">Con Iconos</div>
          </div>
          <div className="bg-white p-3 rounded-lg border text-center">
            <div className="text-2xl font-bold text-orange-600">{missingTokens.length}</div>
            <div className="text-sm text-slate-600">Sin Iconos</div>
          </div>
          <div className="bg-white p-3 rounded-lg border text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((availableTokens.length / tokens.length) * 100)}%
            </div>
            <div className="text-sm text-slate-600">Completado</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-purple-100 rounded-lg">
          <div className="text-sm text-purple-800">
            <strong>📊 Progreso de Iconos:</strong> {availableTokens.length} de {tokens.length} tokens tienen iconos
            personalizados. Los tokens sin iconos usan círculos de colores por categoría como fallback.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
