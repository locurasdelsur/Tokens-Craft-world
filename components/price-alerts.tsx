"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, TrendingUp, X, Smartphone } from "lucide-react"
import { TokenIcon } from "@/components/token-icon"

interface Token {
  name: string
  symbol: string
  priceUsd: number
  priceChanges: {
    h24: number
    d7: number
    d30: number
  }
  category: string
}

interface PriceAlert {
  id: string
  tokenSymbol: string
  tokenName: string
  category: string
  previousPrice: number
  currentPrice: number
  changePercent: number
  timestamp: Date
  type: "spike" | "surge" | "moon"
  notificationSent?: boolean
}

interface PriceAlertsProps {
  tokens: Token[]
  isVisible: boolean
  onToggle: () => void
}

export function PriceAlerts({ tokens, isVisible, onToggle }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({})
  const [notificationStatus, setNotificationStatus] = useState<Record<string, "sending" | "sent" | "error">>({})
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)

      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission)
        })
      }
    }
  }, [])

  const sendMobileNotification = async (alert: PriceAlert) => {
    try {
      setNotificationStatus((prev) => ({ ...prev, [alert.id]: "sending" }))

      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(`${getAlertTitle(alert.type)} - ${alert.tokenSymbol}`, {
          body: `${alert.tokenName} subió +${alert.changePercent.toFixed(1)}% - Precio: $${alert.currentPrice.toFixed(6)}`,
          icon: `/icons/${alert.tokenSymbol.toLowerCase()}.png`,
          badge: `/icons/${alert.tokenSymbol.toLowerCase()}.png`,
          tag: alert.id,
          requireInteraction: true,
          vibrate: [200, 100, 200],
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        // Auto close after 10 seconds
        setTimeout(() => {
          notification.close()
        }, 10000)

        setNotificationStatus((prev) => ({ ...prev, [alert.id]: "sent" }))
        setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, notificationSent: true } : a)))
      } else {
        // Fallback: Show browser alert if notifications not supported/allowed
        alert(
          `🚀 ${getAlertTitle(alert.type)}\n${alert.tokenName} (${alert.tokenSymbol}) subió +${alert.changePercent.toFixed(1)}%\nPrecio: $${alert.currentPrice.toFixed(6)}`,
        )
        setNotificationStatus((prev) => ({ ...prev, [alert.id]: "sent" }))
        setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, notificationSent: true } : a)))
      }
    } catch (error) {
      console.error("Error sending mobile notification:", error)
      setNotificationStatus((prev) => ({ ...prev, [alert.id]: "error" }))
    }
  }

  useEffect(() => {
    if (tokens.length === 0) return

    const newAlerts: PriceAlert[] = []

    tokens.forEach((token) => {
      const previousPrice = previousPrices[token.symbol]

      if (previousPrice && previousPrice > 0) {
        const changePercent = ((token.priceUsd - previousPrice) / previousPrice) * 100

        // Generate alerts for significant price increases
        if (changePercent >= 10) {
          // 10% or more increase
          let alertType: "spike" | "surge" | "moon" = "spike"

          if (changePercent >= 50) alertType = "moon"
          else if (changePercent >= 25) alertType = "surge"

          const alert: PriceAlert = {
            id: `${token.symbol}-${Date.now()}`,
            tokenSymbol: token.symbol,
            tokenName: token.name,
            category: token.category,
            previousPrice,
            currentPrice: token.priceUsd,
            changePercent,
            timestamp: new Date(),
            type: alertType,
            notificationSent: false,
          }

          newAlerts.push(alert)
        }
      }
    })

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 10)) // Keep only last 10 alerts

      newAlerts.forEach((alert) => {
        sendMobileNotification(alert)
      })
    }

    const newPreviousPrices: Record<string, number> = {}
    tokens.forEach((token) => {
      newPreviousPrices[token.symbol] = token.priceUsd
    })
    setPreviousPrices(newPreviousPrices)
  }, [tokens])

  const removeAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "moon":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "surge":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "spike":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "moon":
        return "🚀"
      case "surge":
        return "📈"
      case "spike":
        return "⬆️"
      default:
        return "📊"
    }
  }

  const getAlertTitle = (type: string) => {
    switch (type) {
      case "moon":
        return "TO THE MOON!"
      case "surge":
        return "GRAN SUBIDA"
      case "spike":
        return "SUBIDA NOTABLE"
      default:
        return "CAMBIO DE PRECIO"
    }
  }

  const getNotificationStatusIcon = (alertId: string, notificationSent?: boolean) => {
    const status = notificationStatus[alertId]

    if (status === "sending") {
      return <Smartphone className="w-3 h-3 text-blue-500 animate-pulse" title="Enviando notificación..." />
    } else if (status === "sent" || notificationSent) {
      return <Smartphone className="w-3 h-3 text-green-500" title="Notificación enviada al móvil" />
    } else if (status === "error") {
      return <Smartphone className="w-3 h-3 text-red-500" title="Error enviando notificación" />
    }

    return null
  }

  if (!isVisible) return null

  return (
    <Card className="fixed top-4 right-4 w-96 max-h-96 overflow-y-auto z-50 shadow-xl border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            Alertas de Precio
            <Smartphone className="w-4 h-4 text-green-600" title="Notificaciones push al móvil" />
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        {notificationPermission !== "granted" && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            📱 Permite notificaciones para recibir alertas en tu móvil
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-4 text-slate-500">
            <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay alertas recientes</p>
            <p className="text-xs mt-1">Las alertas aparecerán cuando los precios suban +10%</p>
            <p className="text-xs mt-2 text-green-600">📱 Notificaciones push al móvil</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.type)} relative`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAlert(alert.id)}
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-60 hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </Button>

              <div className="flex items-start gap-3">
                <TokenIcon symbol={alert.tokenSymbol} category={alert.category} size={32} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getAlertIcon(alert.type)}</span>
                    <span className="font-bold text-sm">{getAlertTitle(alert.type)}</span>
                    {getNotificationStatusIcon(alert.id, alert.notificationSent)}
                  </div>

                  <div className="space-y-1">
                    <div className="font-semibold">
                      {alert.tokenName} ({alert.tokenSymbol})
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-green-600">+{alert.changePercent.toFixed(1)}%</span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div>Precio anterior: ${alert.previousPrice.toFixed(6)}</div>
                      <div>Precio actual: ${alert.currentPrice.toFixed(6)}</div>
                      <div className="text-slate-500">{alert.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
