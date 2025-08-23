import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletDashboardProps {
  onSectionChange?: (section: string) => void;
}

export default function WalletDashboard({ onSectionChange }: WalletDashboardProps) {
  const { toast } = useToast();

  const { data: tokenConfig } = useQuery<any>({
    queryKey: ['/api/token/config'],
  });

  const { data: balance } = useQuery<any>({
    queryKey: ['/api/user/balance'],
  });

  const { data: tokenBalance } = useQuery<any>({
    queryKey: ['/api/user/token/balance'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: tokenPrice } = useQuery<any>({
    queryKey: ['/api/token/price'],
  });

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: user } = useQuery<any>({
    queryKey: ['/api/auth/user'],
  });

  const { data: presaleTimer } = useQuery<any>({
    queryKey: ['/api/presale/timer'],
    refetchInterval: 2000,
  });

  const isPresaleActive = presaleTimer && presaleTimer.timeRemaining > 0;

  const copyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const formatBalance = (balance: string) => {
    return parseFloat(balance || "0").toFixed(2);
  };

  const formatPrice = (price: string) => {
    return parseFloat(price || "0").toFixed(2);
  };

  const handleDepositClick = () => {
    if (onSectionChange) {
      onSectionChange('deposit');
    }
  };

  return (
    <section className="container mx-auto px-4 py-8">
      {/* Token Balance Card */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 mb-6 border border-gray-200 shadow-lg text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-blue-100 text-sm">Total Balance</p>
            <h2 className="text-3xl font-bold" data-testid="text-balance">
              {formatBalance(tokenBalance?.balance || balance?.balance || "0")}
            </h2>
            <p className="text-sm text-blue-100" data-testid="text-token-symbol">
              {tokenConfig?.tokenSymbol || "TOKEN"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">USD Value</p>
            <p className="text-xl font-semibold text-yellow-300" data-testid="text-usd-value">
              ${formatBalance(balance?.usdValue || "0")}
            </p>
            <p className="text-xs text-green-300 flex items-center justify-end">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{formatPrice(tokenPrice?.priceChange24h || "0")}%
            </p>
          </div>
        </div>
        
        {/* Wallet Address */}
        {user?.walletAddress && (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-100 mb-1">Wallet Address</p>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-white break-all" data-testid="text-wallet-address">
                {user.walletAddress}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyAddress}
                className="ml-2 p-1 hover:bg-white/20 text-yellow-300"
                data-testid="button-copy-address"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleDepositClick}
            className="bg-green-500 hover:bg-green-600 py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors text-white" 
            data-testid="button-deposit"
          >
            <ArrowDown className="h-4 w-4" />
            <span>Deposit</span>
          </Button>
          <Button 
            disabled={isPresaleActive}
            className={`py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors ${
              isPresaleActive 
                ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-black'
            }`}
            data-testid="button-withdrawal"
            title={isPresaleActive ? "Withdrawals will be enabled after presale ends" : "Send tokens to another wallet"}
          >
            <ArrowUp className="h-4 w-4" />
            <span>Withdrawal</span>
          </Button>
        </div>
        
        {isPresaleActive && (
          <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-orange-800 text-center">
              🔒 Withdrawals are disabled during presale period
            </p>
          </div>
        )}
      </div>

      {/* Token Info Card */}
      <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Token Information</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Live Price</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Token Name</p>
            <p className="font-semibold text-gray-800" data-testid="text-token-name">
              {tokenConfig?.tokenName || "Loading..."}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Symbol</p>
            <p className="font-semibold text-gray-800" data-testid="text-symbol">
              {tokenConfig?.tokenSymbol || "TOKEN"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Decimals</p>
            <p className="font-semibold text-gray-800" data-testid="text-decimals">
              {tokenConfig?.decimals || 18}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Price</p>
            <p className="font-semibold text-yellow-600" data-testid="text-price">
              ${formatPrice(tokenPrice?.priceUsd || "0")}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Transactions</h3>
        
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" data-testid={`transaction-${tx.id}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'deposit' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}>
                    {tx.type === 'deposit' ? (
                      <ArrowDown className="h-4 w-4 text-white" />
                    ) : (
                      <ArrowUp className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium capitalize text-gray-800">{tx.type}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'deposit' ? '+' : '-'}{formatBalance(tx.amount)} {tokenConfig?.tokenSymbol || 'TOKEN'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{tx.status}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions found</p>
              <p className="text-sm text-gray-400 mt-2">Your transaction history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}