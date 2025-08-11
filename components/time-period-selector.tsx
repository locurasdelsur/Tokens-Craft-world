"use client"

import { Button } from "@/components/ui/button"
import { Clock, Calendar, CalendarDays } from "lucide-react"

interface TimePeriodSelectorProps {
  selectedPeriod: "h24" | "d7" | "d30"
  onPeriodChange: (period: "h24" | "d7" | "d30") => void
}

export function TimePeriodSelector({ selectedPeriod, onPeriodChange }: TimePeriodSelectorProps) {
  const periods = [
    {
      key: "h24" as const,
      label: "24 Horas",
      shortLabel: "24h",
      icon: Clock,
      description: "Cambio en las últimas 24 horas",
    },
    {
      key: "d7" as const,
      label: "1 Semana",
      shortLabel: "7d",
      icon: Calendar,
      description: "Cambio en los últimos 7 días",
    },
    {
      key: "d30" as const,
      label: "1 Mes",
      shortLabel: "30d",
      icon: CalendarDays,
      description: "Cambio en los últimos 30 días",
    },
  ]

  return (
    <div className="flex items-center gap-2 bg-white/50 p-1 rounded-lg border">
      <span className="text-sm font-medium text-slate-600 px-2">Período:</span>
      {periods.map((period) => {
        const Icon = period.icon
        const isSelected = selectedPeriod === period.key

        return (
          <Button
            key={period.key}
            variant={isSelected ? "default" : "ghost"}
            size="sm"
            onClick={() => onPeriodChange(period.key)}
            className={`
              flex items-center gap-1 transition-all duration-200
              ${
                isSelected
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }
            `}
            title={period.description}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{period.label}</span>
            <span className="sm:hidden">{period.shortLabel}</span>
          </Button>
        )
      })}
    </div>
  )
}
