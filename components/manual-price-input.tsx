"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Edit, ExternalLink, Save } from "lucide-react"

interface ManualPriceInputProps {
  tokens: any[]
  onUpdatePrices: (updatedTokens: any[]) => void
}

export function ManualPriceInput({ tokens, onUpdatePrices }: ManualPriceInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editedPrices, setEditedPrices] = useState<{ [key: string]: string }>({})

  const handlePriceChange = (contract: string, price: string) => {
    setEditedPrices((prev) => ({
      ...prev,
      [contract]: price,
    }))
  }

  const handleSave = () => {
    const updatedTokens = tokens.map((token) => {
      const newPrice = editedPrices[token.contract]
      if (newPrice && !isNaN(Number.parseFloat(newPrice))) {
        return {
          ...token,
          priceUsd: Number.parseFloat(newPrice),
          isSimulated: false,
          source: "manual-input",
          lastUpdated: new Date().toISOString(),
        }
      }
      return token
    })

    onUpdatePrices(updatedTokens)
    setIsOpen(false)
    setEditedPrices({})
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
          <Edit className="w-4 h-4 mr-2" />
          Ingresar Precios Manualmente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Actualizar Precios Manualmente
          </DialogTitle>
          <div className="text-sm text-slate-600 mt-2">
            <p>Obtén los precios reales desde:</p>
            <a
              href="https://app.roninchain.com/swap"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              app.roninchain.com/swap
            </a>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {tokens.map((token) => (
            <div key={token.contract} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {token.symbol.slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{token.symbol}</div>
                <div className="text-xs text-slate-500">{token.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">$</span>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder={token.priceUsd.toFixed(6)}
                  value={editedPrices[token.contract] || ""}
                  onChange={(e) => handlePriceChange(token.contract, e.target.value)}
                  className="w-24 h-8 text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-slate-600">{Object.keys(editedPrices).length} precios modificados</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Guardar Precios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
