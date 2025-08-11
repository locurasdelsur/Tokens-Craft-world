"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Bell,
  BellRing,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Settings,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { TokenIcon } from "@/components/token-icon"

interface Alert {
  id: string
  name: string
  type: "price_increase" | "price_decrease" | "volume_spike" | "arbitrage_opportunity" | "crafting_profit"
  token?: string
  condition: string
  threshold: number
  isActive: boolean
  lastTriggered?: Date
  triggerCount: number
  createdAt: Date
}

interface AlertTrigger {
  id: string
  alertId: string
  token: string
  currentValue: number
  threshold: number
  message: string
  timestamp: Date
  isRead: boolean
}

export default function AlertsPage() {
  const [tokens, setTokens] = useState<any[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [triggeredAlerts, setTriggeredAlerts] = useState<AlertTrigger[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newAlert, setNewAlert] = useState({
    name: "",
    type: "price_increase" as const,
    token: "",
    threshold: 0,
  })

  // Crear alertas por defecto para todos los tokens
  const createDefaultAlerts = (tokens: any[]) => {
    const defaultAlertTypes = [
      { type: "price_increase", threshold: 10, name: "Subida 10%" },
      { type: "price_decrease", threshold: 10, name: "Bajada 10%" },
      { type: "volume_spike", threshold: 50000, name: "Volumen Alto" },
      { type: "arbitrage_opportunity", threshold: 5, name: "Arbitraje 5%" },
      { type: "crafting_profit", threshold: 15, name: "Crafting 15%" },
    ]

    const newAlerts: Alert[] = []
    let createdCount = 0

    tokens.forEach((token) => {
      defaultAlertTypes.forEach((alertType) => {
        const alertId = `default-${token.symbol}-${alertType.type}`

        // Verificar si ya existe esta alerta
        const existingAlert = alerts.find((a) => a.id === alertId)
        if (!existingAlert) {
          const alert: Alert = {
            id: alertId,
            name: `${token.symbol} - ${alertType.name}`,
            type: alertType.type as any,
            token: token.symbol,
            condition: getConditionText(alertType.type, alertType.threshold),
            threshold: alertType.threshold,
            isActive: true,
            triggerCount: 0,
            createdAt: new Date(),
          }
          newAlerts.push(alert)
          createdCount++
        }
      })
    })

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...prev, ...newAlerts])
      console.log(`✅ Creadas ${createdCount} alertas por defecto para ${tokens.length} tokens`)
    }
  }

  // Actualizar la función fetchTokens
  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/tokens")
      const data = await response.json()
      if (data.tokens) {
        setTokens(data.tokens)

        // Crear alertas por defecto si es la primera carga
        if (alerts.length === 0) {
          setTimeout(() => createDefaultAlerts(data.tokens), 100)
        }

        checkAlerts(data.tokens)
      }
    } catch (error) {
      console.error("Error loading tokens:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar alertas contra los datos actuales
  const checkAlerts = (currentTokens: any[]) => {
    const newTriggeredAlerts: AlertTrigger[] = []

    currentTokens.forEach((token) => {
      const defaultAlertTypes = [
        { type: "price_increase", threshold: 10, name: "Subida 10%" },
        { type: "price_decrease", threshold: 10, name: "Bajada 10%" },
        { type: "volume_spike", threshold: 50000, name: "Volumen Alto" },
        { type: "arbitrage_opportunity", threshold: 5, name: "Arbitraje 5%" },
        { type: "crafting_profit", threshold: 15, name: "Crafting 15%" },
      ]

      defaultAlertTypes.forEach((alertType) => {
        const alertId = `default-${token.symbol}-${alertType.type}`
        const alert = alerts.find((a) => a.id === alertId)
        if (!alert || !alert.isActive) return

        let shouldTrigger = false
        let currentValue = 0
        let message = ""

        switch (alert.type) {
          case "price_increase":
            currentValue = token.priceChanges?.h24 || 0
            shouldTrigger = currentValue >= alert.threshold
            message = `${token.symbol} subió ${currentValue.toFixed(2)}% (umbral: ${alert.threshold}%)`
            break

          case "price_decrease":
            currentValue = token.priceChanges?.h24 || 0
            shouldTrigger = currentValue <= -Math.abs(alert.threshold)
            message = `${token.symbol} bajó ${Math.abs(currentValue).toFixed(2)}% (umbral: ${alert.threshold}%)`
            break

          case "volume_spike":
            currentValue = token.volume24h || 0
            shouldTrigger = currentValue >= alert.threshold
            message = `${token.symbol} volumen: $${currentValue.toLocaleString()} (umbral: $${alert.threshold.toLocaleString()})`
            break

          case "arbitrage_opportunity":
            // Simular oportunidad de arbitraje basada en volatilidad
            const volatility = Math.abs(token.priceChanges?.h24 || 0)
            currentValue = volatility
            shouldTrigger = volatility >= alert.threshold
            message = `Oportunidad de arbitraje en ${token.symbol}: ${volatility.toFixed(2)}% volatilidad`
            break

          case "crafting_profit":
            // Simular rentabilidad de crafting basada en precio y categoría
            const craftingProfit = token.category === "crafted" ? (token.priceChanges?.h24 || 0) * 1.5 : 0
            currentValue = craftingProfit
            shouldTrigger = craftingProfit >= alert.threshold
            message = `Oportunidad de crafting con ${token.symbol}: ${craftingProfit.toFixed(2)}% ganancia estimada`
            break
        }

        if (shouldTrigger) {
          newTriggeredAlerts.push({
            id: `trigger-${Date.now()}-${alert.id}`,
            alertId: alert.id,
            token: token.symbol,
            currentValue,
            threshold: alert.threshold,
            message,
            timestamp: new Date(),
            isRead: false,
          })

          // Actualizar contador de la alerta
          setAlerts((prev) =>
            prev.map((a) =>
              a.id === alert.id ? { ...a, triggerCount: a.triggerCount + 1, lastTriggered: new Date() } : a,
            ),
          )
        }
      })
    })

    if (newTriggeredAlerts.length > 0) {
      setTriggeredAlerts((prev) => [...prev, ...newTriggeredAlerts].slice(0, 50)) // Mantener solo las últimas 50
    }
  }

  // Crear nueva alerta
  const createAlert = () => {
    if (!newAlert.name || !newAlert.token || newAlert.threshold === 0) {
      alert("Por favor completa todos los campos")
      return
    }

    const alert: Alert = {
      id: `alert-${Date.now()}`,
      name: newAlert.name,
      type: newAlert.type,
      token: newAlert.token,
      condition: getConditionText(newAlert.type, newAlert.threshold),
      threshold: newAlert.threshold,
      isActive: true,
      triggerCount: 0,
      createdAt: new Date(),
    }

    setAlerts((prev) => [alert, ...prev])
    setNewAlert({ name: "", type: "price_increase", token: "", threshold: 0 })
  }

  // Eliminar alerta
  const deleteAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    setTriggeredAlerts((prev) => prev.filter((t) => t.alertId !== alertId))
  }

  // Toggle alerta activa/inactiva
  const toggleAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, isActive: !a.isActive } : a)))
  }

  // Marcar alerta como leída
  const markAsRead = (triggerId: string) => {
    setTriggeredAlerts((prev) => prev.map((t) => (t.id === triggerId ? { ...t, isRead: true } : t)))
  }

  // Obtener texto de condición
  const getConditionText = (type: string, threshold: number) => {
    switch (type) {
      case "price_increase":
        return `Precio sube ≥ ${threshold}%`
      case "price_decrease":
        return `Precio baja ≤ ${threshold}%`
      case "volume_spike":
        return `Volumen ≥ $${threshold.toLocaleString()}`
      case "arbitrage_opportunity":
        return `Volatilidad ≥ ${threshold}%`
      case "crafting_profit":
        return `Ganancia crafting ≥ ${threshold}%`
      default:
        return "Condición desconocida"
    }
  }

  // Obtener icono de tipo de alerta
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "price_increase":
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case "price_decrease":
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case "volume_spike":
        return <DollarSign className="w-4 h-4 text-blue-600" />
      case "arbitrage_opportunity":
        return <Target className="w-4 h-4 text-purple-600" />
      case "crafting_profit":
        return <Settings className="w-4 h-4 text-orange-600" />
      default:
        return <Bell className="w-4 h-4 text-slate-600" />
    }
  }

  // Obtener nombre del tipo de alerta
  const getAlertTypeName = (type: string) => {
    const names = {
      price_increase: "Subida de Precio",
      price_decrease: "Bajada de Precio",
      volume_spike: "Pico de Volumen",
      arbitrage_opportunity: "Oportunidad de Arbitraje",
      crafting_profit: "Ganancia de Crafting",
    }
    return names[type] || "Desconocido"
  }

  useEffect(() => {
    fetchTokens()
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchTokens, 30000)
    return () => clearInterval(interval)
  }, [alerts])

  const unreadAlerts = triggeredAlerts.filter((t) => !t.isRead).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" className="text-white hover:bg-white/20">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                </Link>
                <div>
                  <CardTitle className="text-3xl font-bold">Sistema de Alertas</CardTitle>
                  <p className="text-orange-100 mt-1">Notificaciones inteligentes para oportunidades de trading</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-orange-100">Alertas Activas</div>
                  <div className="text-xl font-bold">{alerts.filter((a) => a.isActive).length}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-orange-100">Sin Leer</div>
                  <div className="text-xl font-bold flex items-center gap-1">
                    {unreadAlerts}
                    {unreadAlerts > 0 && <BellRing className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Alertas por Defecto */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Bell className="w-5 h-5" />
                Alertas por Defecto Activas
              </CardTitle>
              <Button
                onClick={() => createDefaultAlerts(tokens)}
                variant="outline"
                size="sm"
                className="text-blue-700 border-blue-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Regenerar Alertas por Defecto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-sm">Subida de Precio</span>
                </div>
                <div className="text-xs text-slate-600">
                  {alerts.filter((a) => a.type === "price_increase" && a.id.startsWith("default-")).length} tokens
                  monitoreados
                </div>
                <div className="text-xs text-slate-500">Umbral: ≥10% en 24h</div>
              </div>

              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-sm">Bajada de Precio</span>
                </div>
                <div className="text-xs text-slate-600">
                  {alerts.filter((a) => a.type === "price_decrease" && a.id.startsWith("default-")).length} tokens
                  monitoreados
                </div>
                <div className="text-xs text-slate-500">Umbral: ≤-10% en 24h</div>
              </div>

              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">Pico de Volumen</span>
                </div>
                <div className="text-xs text-slate-600">
                  {alerts.filter((a) => a.type === "volume_spike" && a.id.startsWith("default-")).length} tokens
                  monitoreados
                </div>
                <div className="text-xs text-slate-500">Umbral: ≥$50,000</div>
              </div>

              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm">Oportunidad Arbitraje</span>
                </div>
                <div className="text-xs text-slate-600">
                  {alerts.filter((a) => a.type === "arbitrage_opportunity" && a.id.startsWith("default-")).length}{" "}
                  tokens monitoreados
                </div>
                <div className="text-xs text-slate-500">Umbral: ≥5% volatilidad</div>
              </div>

              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-sm">Ganancia Crafting</span>
                </div>
                <div className="text-xs text-slate-600">
                  {alerts.filter((a) => a.type === "crafting_profit" && a.id.startsWith("default-")).length} tokens
                  monitoreados
                </div>
                <div className="text-xs text-slate-500">Umbral: ≥15% ganancia</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>📊 Sistema Automático:</strong> Se crean alertas por defecto para todos los {tokens.length}{" "}
                tokens del panel. Total de alertas por defecto activas:{" "}
                <strong>{alerts.filter((a) => a.id.startsWith("default-")).length}</strong>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crear Nueva Alerta */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Crear Nueva Alerta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre de la Alerta</Label>
                <Input
                  placeholder="Ej: COIN subida 10%"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Tipo de Alerta</Label>
                <Select value={newAlert.type} onValueChange={(value: any) => setNewAlert({ ...newAlert, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_increase">Subida de Precio</SelectItem>
                    <SelectItem value="price_decrease">Bajada de Precio</SelectItem>
                    <SelectItem value="volume_spike">Pico de Volumen</SelectItem>
                    <SelectItem value="arbitrage_opportunity">Oportunidad de Arbitraje</SelectItem>
                    <SelectItem value="crafting_profit">Ganancia de Crafting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Token</Label>
                <Select value={newAlert.token} onValueChange={(value) => setNewAlert({ ...newAlert, token: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar token" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <TokenIcon symbol={token.symbol} category={token.category} size={24} className="mr-2" />
                        {token.symbol} - {token.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Umbral{" "}
                  {newAlert.type.includes("price") ||
                  newAlert.type.includes("profit") ||
                  newAlert.type.includes("arbitrage")
                    ? "(%)"
                    : "($)"}
                </Label>
                <Input
                  type="number"
                  step={newAlert.type === "volume_spike" ? "1000" : "0.1"}
                  placeholder={newAlert.type === "volume_spike" ? "10000" : "5.0"}
                  value={newAlert.threshold || ""}
                  onChange={(e) => setNewAlert({ ...newAlert, threshold: Number(e.target.value) })}
                />
              </div>

              <Button onClick={createAlert} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Crear Alerta
              </Button>
            </CardContent>
          </Card>

          {/* Alertas Disparadas */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="w-5 h-5" />
                Alertas Disparadas ({unreadAlerts} sin leer)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">Cargando alertas...</div>
              ) : triggeredAlerts.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {triggeredAlerts.map((trigger) => (
                    <div
                      key={trigger.id}
                      className={`p-4 rounded-lg border transition-all ${
                        trigger.isRead ? "bg-slate-50 border-slate-200" : "bg-yellow-50 border-yellow-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getAlertTypeIcon(alerts.find((a) => a.id === trigger.alertId)?.type || "price_increase")}
                            <span className="font-medium text-slate-900">{trigger.message}</span>
                            {!trigger.isRead && <Badge className="bg-red-500 text-white text-xs">Nuevo</Badge>}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {trigger.timestamp.toLocaleString()}
                            </span>
                            <span>Valor: {trigger.currentValue.toFixed(2)}</span>
                            <span>Umbral: {trigger.threshold}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!trigger.isRead && (
                            <Button size="sm" variant="outline" onClick={() => markAsRead(trigger.id)}>
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No hay alertas disparadas aún</p>
                  <p className="text-sm">Crea alertas para recibir notificaciones</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Alertas Configuradas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Alertas Configuradas ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Condición</TableHead>
                      <TableHead>Disparada</TableHead>
                      <TableHead>Creada</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={alert.isActive} onCheckedChange={() => toggleAlert(alert.id)} />
                            {alert.isActive ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{alert.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAlertTypeIcon(alert.type)}
                            <span className="text-sm">{getAlertTypeName(alert.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{alert.token}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{alert.condition}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{alert.triggerCount} veces</div>
                            {alert.lastTriggered && (
                              <div className="text-xs text-slate-500">
                                Última: {alert.lastTriggered.toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">{alert.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => deleteAlert(alert.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No tienes alertas configuradas</p>
                <p className="text-sm">Crea tu primera alerta para comenzar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-slate-600 mb-1">Total Alertas</div>
              <div className="text-2xl font-bold text-slate-900">{alerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-slate-600 mb-1">Alertas Activas</div>
              <div className="text-2xl font-bold text-green-600">{alerts.filter((a) => a.isActive).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-slate-600 mb-1">Disparadas Hoy</div>
              <div className="text-2xl font-bold text-orange-600">
                {triggeredAlerts.filter((t) => t.timestamp.toDateString() === new Date().toDateString()).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-slate-600 mb-1">Sin Leer</div>
              <div className="text-2xl font-bold text-red-600">{unreadAlerts}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
