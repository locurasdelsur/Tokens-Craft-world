"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle } from "lucide-react"
import { TokenIcon, getIconStats } from "@/components/token-icon"

// Lista completa de tokens del sistema para verificación
const ALL_RONIN_TOKENS = [
  "COIN",
  "EARTH",
  "WATER",
  "FIRE",
  "MUD",
  "CLAY",
  "SAND",
  "COPPER",
  "SEAWATER",
  "ALGAE",
  "CERAMICS",
  "O2",
  "STONE",
  "HEAT",
  "LAVA",
  "GAS",
  "CEMENT",
  "GLASS",
  "STEAM",
  "STEEL",
  "FUEL",
  "ACID",
  "SULFUR",
  "ENERGY",
  "SCREWS",
  "OIL",
  "PLASTICS",
  "FIBERGLASS",
  "H2",
  "DYNAMITE",
]

interface TokenVerificationProps {
  tokens: any[]
}

export function TokenVerification({ tokens }: TokenVerificationProps) {
  const stats = getIconStats()

  // Verificar que todos los tokens del sistema tienen iconos
  const missingIcons = ALL_RONIN_TOKENS.filter((symbol) => {
    const token = tokens.find((t) => t.symbol === symbol)
    return !token || !token.symbol
  })

  const allIconsComplete = stats.withoutIcons === 0

  return (
    <Card className={`${allIconsComplete ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {allIconsComplete ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          )}
          Verificación de Iconos de Tokens
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-sm text-slate-600">Total Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.withIcons}</div>
            <div className="text-sm text-slate-600">Con Iconos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.withoutIcons}</div>
            <div className="text-sm text-slate-600">Sin Iconos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.completionPercentage}%</div>
            <div className="text-sm text-slate-600">Completado</div>
          </div>
        </div>

        {allIconsComplete ? (
          <div className="bg-green-100 p-3 rounded-lg">
            <div className="text-green-800 font-medium">
              ✅ ¡Perfecto! Todos los tokens tienen iconos personalizados
            </div>
            <div className="text-green-700 text-sm mt-1">
              Sistema de iconos 100% completo con {stats.total} iconos únicos
            </div>
          </div>
        ) : (
          <div className="bg-yellow-100 p-3 rounded-lg">
            <div className="text-yellow-800 font-medium">⚠️ Faltan {stats.withoutIcons} iconos por completar</div>
            <div className="text-yellow-700 text-sm mt-1">
              {stats.completionPercentage}% del sistema de iconos está completo
            </div>
          </div>
        )}

        {/* Muestra de iconos */}
        <div className="mt-4">
          <div className="text-sm font-medium text-slate-700 mb-2">Muestra de Iconos Disponibles:</div>
          <div className="flex flex-wrap gap-2">
            {tokens.slice(0, 10).map((token) => (
              <div key={token.symbol} className="flex items-center gap-1 bg-white p-2 rounded border">
                <TokenIcon symbol={token.symbol} category={token.category} size={20} />
                <span className="text-xs font-medium">{token.symbol}</span>
              </div>
            ))}
            {tokens.length > 10 && (
              <div className="flex items-center justify-center bg-slate-100 p-2 rounded border text-xs text-slate-600">
                +{tokens.length - 10} más
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
