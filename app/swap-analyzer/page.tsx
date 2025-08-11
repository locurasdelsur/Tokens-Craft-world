import type React from "react"
import { TokenIcon } from "@/components/token-icon"
import type { Opportunity } from "@/types"

interface SwapAnalyzerPageProps {
  opportunities?: Opportunity[]
}

const SwapAnalyzerPage: React.FC<SwapAnalyzerPageProps> = ({ opportunities = [] }) => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Swap Analyzer</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 border">From Token</th>
            <th className="p-2 border">To Token</th>
            <th className="p-2 border">Category</th>
            <th className="p-2 border">Profit</th>
          </tr>
        </thead>
        <tbody>
          {opportunities && opportunities.length > 0 ? (
            opportunities.map((opportunity, index) => (
              <tr key={index} className="bg-gray-100 hover:bg-gray-200">
                <td className="p-2 border flex items-center">
                  <TokenIcon
                    symbol={opportunity.fromToken.symbol}
                    category={opportunity.fromToken.category}
                    size={24}
                  />
                  <span className="ml-2">{opportunity.fromToken.symbol}</span>
                </td>
                <td className="p-2 border flex items-center">
                  <TokenIcon symbol={opportunity.toToken.symbol} category={opportunity.toToken.category} size={24} />
                  <span className="ml-2">{opportunity.toToken.symbol}</span>
                </td>
                <td className="p-2 border">{opportunity.category}</td>
                <td className="p-2 border">{opportunity.profit.toFixed(2)}%</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                No opportunities available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default SwapAnalyzerPage
