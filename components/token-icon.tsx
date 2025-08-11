"use client"

import Image from "next/image"

interface TokenIconProps {
  symbol: string
  size?: number
  className?: string
  category?: string
}

// Mapeo COMPLETO de todos los símbolos de tokens a sus iconos
const TOKEN_ICONS: { [key: string]: string } = {
  // Tokens básicos - verificados y corregidos
  COIN: "/icons/coin.png",
  EARTH: "/icons/earth.png",
  WATER: "/icons/water.png",
  FIRE: "/icons/fire.png",
  MUD: "/icons/mud.png",
  CLAY: "/icons/clay.png",
  SAND: "/icons/sand.png",
  COPPER: "/icons/copper.png",
  SEAWATER: "/icons/seawater.png",
  ALGAE: "/icons/algae.png",

  // Tokens crafted y químicos
  CERAMICS: "/icons/ceramics.png",
  O2: "/icons/oxygen.png", // OXYGEN se mapea a O2
  STONE: "/icons/stone.png",
  HEAT: "/icons/heat.png",
  LAVA: "/icons/lava.png",
  GAS: "/icons/gas.png", // ✅ AHORA COMPLETO
  CEMENT: "/icons/cement.png",
  GLASS: "/icons/glass.png",
  STEAM: "/icons/steam.png",
  STEEL: "/icons/steel.png",
  FUEL: "/icons/fuel.png",
  ACID: "/icons/acid.png",
  SULFUR: "/icons/sulfur.png",
  ENERGY: "/icons/energy.png",
  SCREWS: "/icons/screws.png",
  OIL: "/icons/oil.png",
  PLASTICS: "/icons/plastics.png",
  FIBERGLASS: "/icons/fiberglass.png",
  H2: "/icons/hydrogen.png", // HYDROGEN se mapea a H2
  DYNAMITE: "/icons/dynamite.png",
}

// Función para obtener color de categoría como fallback
const getCategoryColor = (category: string) => {
  const colors = {
    utility: "bg-blue-500",
    resource: "bg-green-500",
    metal: "bg-gray-500",
    organic: "bg-emerald-500",
    crafted: "bg-purple-500",
    gas: "bg-cyan-500",
    energy: "bg-yellow-500",
    chemical: "bg-red-500",
    explosive: "bg-orange-500",
  }
  return colors[category] || "bg-slate-500"
}

export function TokenIcon({ symbol, size = 32, className = "", category = "resource" }: TokenIconProps) {
  const iconPath = TOKEN_ICONS[symbol]

  if (iconPath) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <Image
          src={iconPath || "/placeholder.svg"}
          alt={`${symbol} icon`}
          width={size}
          height={size}
          className="rounded-lg object-cover"
          onError={(e) => {
            // Fallback si la imagen no carga
            console.warn(`Failed to load icon for ${symbol}`)
          }}
        />
      </div>
    )
  }

  // Fallback: círculo con iniciales si no hay icono disponible
  return (
    <div
      className={`${getCategoryColor(category)} rounded-lg flex items-center justify-center text-white text-xs font-bold ${className}`}
      style={{ width: size, height: size }}
    >
      {symbol.slice(0, 2)}
    </div>
  )
}

// Función helper para verificar si un token tiene icono
export function hasTokenIcon(symbol: string): boolean {
  return TOKEN_ICONS[symbol] !== undefined
}

// Función helper para obtener estadísticas de iconos
export function getIconStats() {
  const totalTokens = Object.keys(TOKEN_ICONS).length
  const tokensWithIcons = Object.values(TOKEN_ICONS).filter((path) => path !== null).length
  const tokensWithoutIcons = totalTokens - tokensWithIcons

  return {
    total: totalTokens,
    withIcons: tokensWithIcons,
    withoutIcons: tokensWithoutIcons,
    completionPercentage: Math.round((tokensWithIcons / totalTokens) * 100),
  }
}

export function getTokensWithIcons(): string[] {
  return Object.keys(TOKEN_ICONS).filter((symbol) => TOKEN_ICONS[symbol] !== null)
}

export function getTokensWithoutIcons(allTokens: string[]): string[] {
  return allTokens.filter((symbol) => !TOKEN_ICONS[symbol])
}
