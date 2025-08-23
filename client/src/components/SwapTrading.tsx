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
    return parseFloat(price || "0").toFixed(2);
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
          <Card className="bg-crypto-dark border-white/10">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">
                  {tokenConfig?.tokenSymbol || 'TOKEN'}/USDT
                </CardTitle>
                <div className="text-right">
                  <p className="text-2xl font-bold text-crypto-gold" data-testid="text-current-price">
                    ${formatPrice(tokenPrice?.priceUsd || "0")}
                  </p>
                  <p className="text-sm text-crypto-green flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +{formatPrice(tokenPrice?.priceChange24h || "0")}% (24h)
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chart Placeholder */}
              <div className="bg-crypto-gray/20 rounded-xl h-80 flex items-center justify-center mb-6" data-testid="trading-chart">
                <div className="text-center">
                  <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg font-medium">Trading Chart</p>
                  <p className="text-sm text-gray-500">PancakeSwap Integration</p>
                  <Button 
                    className="mt-4 bg-crypto-blue hover:bg-blue-600"
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
                  <Button size="sm" className="bg-crypto-blue text-white" data-testid="button-timeframe-1h">1H</Button>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" data-testid="button-timeframe-4h">4H</Button>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" data-testid="button-timeframe-1d">1D</Button>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" data-testid="button-timeframe-1w">1W</Button>
                </div>
                <div className="text-sm text-gray-400">
                  Powered by PancakeSwap
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Trading Panel */}
        <div className="space-y-6">
          {/* Price Info */}
          <Card className="bg-crypto-dark border-white/10">
            <CardHeader>
              <CardTitle>Market Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">24h High</span>
                  <span className="font-semibold text-red-400" data-testid="text-24h-high">
                    ${formatPrice(tokenPrice?.high24h || "0")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">24h Low</span>
                  <span className="font-semibold text-crypto-green" data-testid="text-24h-low">
                    ${formatPrice(tokenPrice?.low24h || "0")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">24h Volume</span>
                  <span className="font-semibold" data-testid="text-24h-volume">
                    ${formatPrice(tokenPrice?.volume24h || "0")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Cap</span>
                  <span className="font-semibold" data-testid="text-market-cap">
                    ${formatPrice(tokenPrice?.marketCap || "0")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Swap */}
          <Card className="bg-crypto-dark border-white/10">
            <CardHeader>
              <CardTitle>Quick Swap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">From</label>
                  <div className="flex items-center space-x-2 bg-crypto-gray/50 rounded-lg p-3">
                    <Input
                      type="number"
                      step="0.00000001"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-transparent border-0 text-white"
                      data-testid="input-from-amount"
                    />
                    <div className="bg-crypto-blue px-3 py-1 rounded text-sm font-medium">
                      {tokenConfig?.tokenSymbol || 'TOKEN'}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" className="p-2 bg-crypto-gray hover:bg-crypto-gray/80 rounded-full">
                    <ArrowUpDown className="h-4 w-4 text-crypto-gold" />
                  </Button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">To</label>
                  <div className="flex items-center space-x-2 bg-crypto-gray/50 rounded-lg p-3">
                    <Input
                      type="number"
                      value={toAmount}
                      placeholder="0.0"
                      readOnly
                      className="flex-1 bg-transparent border-0 text-white"
                      data-testid="input-to-amount"
                    />
                    <div className="bg-crypto-green px-3 py-1 rounded text-sm font-medium">
                      USDT
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400 text-center">
                  1 {tokenConfig?.tokenSymbol || 'TOKEN'} = {formatPrice(tokenPrice?.priceUsd || "0")} USDT
                </div>
                
                <Button 
                  onClick={handleSwap}
                  className="w-full bg-crypto-gold hover:bg-yellow-500 text-black py-3 rounded-lg font-semibold transition-colors"
                  data-testid="button-connect-pancakeswap"
                >
                  Connect to PancakeSwap
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* External Link to PancakeSwap */}
          <Card className="bg-crypto-blue/10 border-crypto-blue/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <ExternalLink className="h-5 w-5 text-crypto-blue" />
                <div>
                  <p className="font-medium">Trade on PancakeSwap</p>
                  <p className="text-sm text-gray-400">Access full trading features</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
