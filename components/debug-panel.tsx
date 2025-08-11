"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Bug, Wifi, WifiOff, ExternalLink, Activity, AlertTriangle } from "lucide-react"

interface DebugPanelProps {
  tokens: any[]
  metadata?: any
}

export function DebugPanel({ tokens, metadata }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const realPrices = tokens.filter((t) => !t.isSimulated).length
  const simulatedPrices = tokens.filter((t) => t.isSimulated).length
  const geckoTerminalTokens = tokens.filter((t) => t.source?.includes("geckoterminal")).length
  const manualTokens = tokens.filter((t) => t.source === "manual-input").length

  const testAPI = async () => {
    try {
      const response = await fetch("/api/tokens")
      const data = await response.json()
      console.log("🧪 API Test:", data)

      const message = `
API Test: ${response.ok ? "SUCCESS" : "FAILED"}
Real prices: ${data.metadata?.realDataTokens || 0}
Success rate: ${data.metadata?.successRate || "0%"}
API Status: ${data.metadata?.apiStatus || "unknown"}
      `.trim()

      alert(message)
    } catch (error) {
      console.error("🧪 API Test Failed:", error)
      alert(`API Test FAILED: ${error.message}`)
    }
  }

  const testGeckoTerminal = async () => {
    try {
      // Test the networks endpoint first
      const networksResponse = await fetch("https://api.geckoterminal.com/api/v2/networks")
      const networksData = await networksResponse.json()

      console.log("🦎 GeckoTerminal Networks Test:", networksData)

      const roninNetwork = networksData.data?.find(
        (network: any) => network.id === "ronin" || network.attributes?.name?.toLowerCase().includes("ronin"),
      )

      const message = `
GeckoTerminal API: ${networksResponse.ok ? "ACCESSIBLE" : "BLOCKED"}
Networks available: ${networksData.data?.length || 0}
Ronin network found: ${roninNetwork ? "YES" : "NO"}
${roninNetwork ? `Ronin ID: ${roninNetwork.id}` : ""}
      `.trim()

      alert(message)
    } catch (error) {
      console.error("🦎 GeckoTerminal Test Failed:", error)
      alert(`GeckoTerminal Test FAILED: ${error.message}`)
    }
  }

  const getStatusColor = (apiStatus: string) => {
    switch (apiStatus) {
      case "partial-success":
        return "text-yellow-700 border-yellow-300"
      case "error":
        return "text-red-700 border-red-300"
      case "fallback-mode":
        return "text-orange-700 border-orange-300"
      default:
        return "text-green-700 border-green-300"
    }
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-green-800 flex items-center">
            <Bug className="w-4 h-4 mr-2" />
            Panel de Debug - GeckoTerminal API
            {metadata?.apiStatus === "error" && <AlertTriangle className="w-4 h-4 ml-2 text-red-500" />}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-green-600 hover:text-green-800"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-green-700 border-green-300">
                <Wifi className="w-3 h-3 mr-1" />
                GeckoTerminal: {geckoTerminalTokens}
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                <Activity className="w-3 h-3 mr-1" />
                Manual: {manualTokens}
              </Badge>
              <Badge variant="outline" className="text-orange-700 border-orange-300">
                <WifiOff className="w-3 h-3 mr-1" />
                Simulados: {simulatedPrices}
              </Badge>
              {metadata?.apiStatus && (
                <Badge variant="outline" className={getStatusColor(metadata.apiStatus)}>
                  Status: {metadata.apiStatus}
                </Badge>
              )}
            </div>

            {metadata && (
              <div className="text-xs text-green-700 space-y-1 bg-white/50 p-3 rounded">
                <div className="font-medium">Estadísticas de API:</div>
                <div>• Tasa de éxito: {metadata.successRate || "N/A"}</div>
                <div>• Intentos realizados: {metadata.attemptedFetches || metadata.totalTokens}</div>
                <div>• Ronin disponible: {metadata.roninNetworkAvailable ? "Sí" : "No"}</div>
                <div>• Última actualización: {new Date(metadata.lastUpdate).toLocaleString()}</div>
                <div>
                  • Cache expira: {metadata.cacheExpiry ? new Date(metadata.cacheExpiry).toLocaleString() : "N/A"}
                </div>
                <div>• Fuente: {metadata.dataSource || "N/A"}</div>
                {metadata.error && <div className="text-red-600">• Error: {metadata.error}</div>}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={testAPI}
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-100 bg-transparent"
              >
                Probar API Local
              </Button>
              <Button
                onClick={testGeckoTerminal}
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-100 bg-transparent"
              >
                Probar GeckoTerminal
              </Button>
              <a
                href="https://www.geckoterminal.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 px-2 py-1"
              >
                <ExternalLink className="w-3 h-3" />
                Ver GeckoTerminal
              </a>
            </div>

            <div className="text-xs text-green-600 bg-white/30 p-2 rounded">
              <strong>Nota:</strong> Usando múltiples métodos para obtener datos de GeckoTerminal. Si Ronin no está
              disponible, se usan datos simulados realistas.
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
