import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, TrendingUp, ExternalLink } from "lucide-react";

export default function SwapTrading() {
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");

  const { data: tokenConfig } = useQuery<any>({
    queryKey: ['/api/token/config'],
  });

  const { data: tokenPrice } = useQuery<any>({
    queryKey: ['/api/token/price'],
  });

  const formatPrice = (price: string) => {
    const num = parseFloat(price || "0");
    if (num === 0) return "0.00";
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    return num.toFixed(2);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value && tokenPrice?.priceUsd) {
      const usdValue = parseFloat(value) * parseFloat(tokenPrice.priceUsd);
      setToAmount(usdValue.toFixed(2));
    } else {
      setToAmount("");
    }
  };

  const handleSwap = () => {
    // In a real implementation, this would connect to PancakeSwap
    window.open('https://pancakeswap.finance/', '_blank');
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trading Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-gray-800">
                  {tokenConfig?.tokenSymbol || 'TOKEN'}/USDT
                </CardTitle>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600" data-testid="text-current-price">
                    ${formatPrice(tokenPrice?.priceUsd || "0")}
                  </p>
                  <p className="text-sm text-green-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +{formatPrice(tokenPrice?.priceChange24h || "0")}% (24h)
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chart Placeholder */}
              <div className="bg-gray-50 rounded-xl h-80 flex items-center justify-center mb-6 border border-gray-200" data-testid="trading-chart">
                <div className="text-center">
                  <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">Trading Chart</p>
                  <p className="text-sm text-gray-500">PancakeSwap Integration</p>
                  <Button 
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => window.open('https://pancakeswap.finance/', '_blank')}
                    data-testid="button-view-pancakeswap"
                  >
                    View on PancakeSwap
                  </Button>
                </div>
              </div>
              
              {/* Chart Controls */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-blue-600 text-white" data-testid="button-timeframe-1h">1H</Button>
                  <Button size="sm" variant="ghost" className="text-gray-600 hover:text-gray-800" data-testid="button-timeframe-4h">4H</Button>
                  <Button size="sm" variant="ghost" className="text-gray-600 hover:text-gray-800" data-testid="button-timeframe-1d">1D</Button>
                  <Button size="sm" variant="ghost" className="text-gray-600 hover:text-gray-800" data-testid="button-timeframe-1w">1W</Button>
                </div>
                <div className="text-sm text-gray-500">
                  Powered by PancakeSwap
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Trading Panel */}
        <div className="space-y-6">
          {/* Price Info */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Market Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">24h High</span>
                  <span className="font-semibold text-red-600" data-testid="text-24h-high">
                    ${formatPrice(tokenPrice?.high24h || "0")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">24h Low</span>
                  <span className="font-semibold text-green-600" data-testid="text-24h-low">
                    ${formatPrice(tokenPrice?.low24h || "0")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">24h Volume</span>
                  <span className="font-semibold text-gray-800" data-testid="text-24h-volume">
                    ${formatPrice(tokenPrice?.volume24h || "0")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Market Cap</span>
                  <span className="font-semibold text-gray-800" data-testid="text-market-cap">
                    ${formatPrice(tokenPrice?.marketCap || "0")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Swap */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Quick Swap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">From</label>
                  <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <Input
                      type="number"
                      step="0.00000001"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-transparent border-0 text-gray-900"
                      data-testid="input-from-amount"
                    />
                    <div className="bg-blue-600 px-3 py-1 rounded text-sm font-medium text-white">
                      {tokenConfig?.tokenSymbol || 'TOKEN'}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full">
                    <ArrowUpDown className="h-4 w-4 text-yellow-600" />
                  </Button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">To</label>
                  <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <Input
                      type="number"
                      value={toAmount}
                      placeholder="0.0"
                      readOnly
                      className="flex-1 bg-transparent border-0 text-gray-900"
                      data-testid="input-to-amount"
                    />
                    <div className="bg-green-600 px-3 py-1 rounded text-sm font-medium text-white">
                      USDT
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 text-center">
                  1 {tokenConfig?.tokenSymbol || 'TOKEN'} = {formatPrice(tokenPrice?.priceUsd || "0")} USDT
                </div>
                
                <Button 
                  onClick={handleSwap}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-black py-3 rounded-lg font-semibold transition-colors"
                  data-testid="button-connect-pancakeswap"
                >
                  Connect to PancakeSwap
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* External Link to PancakeSwap */}
          <Card className="bg-blue-50 border border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-800">Trade on PancakeSwap</p>
                  <p className="text-sm text-gray-600">Access full trading features</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}