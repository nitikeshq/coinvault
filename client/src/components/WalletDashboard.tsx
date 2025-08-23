import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ArrowDown, ArrowUp, TrendingUp, Share2, Image, Sparkles, ExternalLink, ArrowRightLeft, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { NFTModal } from "@/components/NFTModal";

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
    queryKey: ['/api/me'],
  });

  const { data: referralData } = useQuery<any>({
    queryKey: ['/api/user/referral-code'],
  });

  const { data: referralEarnings = [] } = useQuery<any[]>({
    queryKey: ['/api/user/referral-earnings'],
  });

  const { data: presaleTimer } = useQuery<any>({
    queryKey: ['/api/presale/timer'],
    refetchInterval: 2000,
  });

  const { data: presaleConfig } = useQuery<any>({
    queryKey: ['/api/presale/config'],
  });

  const isPresaleActive = presaleTimer && presaleTimer.timeRemaining > 0;
  const presaleEnded = presaleConfig && new Date() > new Date(presaleConfig.endDate);

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
    const num = parseFloat(price || "0");
    if (num === 0) return "0.00";
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    return num.toFixed(2);
  };

  const calculateUsdValue = (tokenBalance: string, tokenPrice: string) => {
    const balance = parseFloat(tokenBalance || "0");
    const price = parseFloat(tokenPrice || "0");
    const usdValue = balance * price;
    return formatBalance(usdValue.toString());
  };

  const handleDepositClick = () => {
    if (onSectionChange) {
      onSectionChange('deposit');
    }
  };

  const handleSwapClick = () => {
    // Open PancakeSwap with your token/USDT pair when presale ends
    if (tokenConfig?.contractAddress) {
      const pancakeSwapUrl = `https://pancakeswap.finance/swap?outputCurrency=${tokenConfig.contractAddress}&inputCurrency=0x55d398326f99059fF775485246999027B3197955`; // USDT
      window.open(pancakeSwapUrl, '_blank');
    }
  };

  // Sharing functions
  const shareOnTelegram = (text: string, url?: string) => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url || window.location.href)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
  };

  const shareOnTwitter = (text: string, url?: string) => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url || window.location.href)}`;
    window.open(twitterUrl, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const shareReferralCode = (platform: string) => {
    const referralCode = referralData?.referralCode;
    if (!referralCode) return;
    
    const shareText = `Join me on ${tokenConfig?.tokenName || 'CryptoWallet Pro'} using my referral code: ${referralCode}`;
    const currentUrl = window.location.origin;
    
    if (platform === 'telegram') {
      shareOnTelegram(shareText, currentUrl);
    } else if (platform === 'twitter') {
      shareOnTwitter(shareText, currentUrl);
    }
  };

  const calculateTotalReferralEarnings = () => {
    if (!referralEarnings || !Array.isArray(referralEarnings)) {
      return '0.00';
    }
    return referralEarnings.reduce((total, earning) => {
      const earningsAmount = earning?.earningsAmount;
      if (!earningsAmount) return total;
      return total + parseFloat(earningsAmount.toString());
    }, 0).toFixed(2);
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
              ${calculateUsdValue(tokenBalance?.balance || balance?.balance || "0", tokenPrice?.priceUsd || "0")}
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
        <div className={`grid gap-3 ${presaleEnded ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
          
          {presaleEnded && (
            <Button 
              onClick={handleSwapClick}
              className="bg-blue-500 hover:bg-blue-600 py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors text-white"
              data-testid="button-swap"
              title="Swap tokens on PancakeSwap"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>Swap</span>
            </Button>
          )}
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

      {/* Referral Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 mb-6 border border-green-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          Referral Program - Earn 5% Bonus!
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Referral Code */}
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-gray-800 mb-2">Your Referral Code</h4>
            {referralData?.referralCode ? (
              <div className="space-y-3">
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <code className="text-lg font-mono font-bold text-green-700" data-testid="text-referral-code">
                    {referralData.referralCode}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={copyReferralCode}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-copy-referral"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Code
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareReferralCode('telegram')}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    data-testid="button-share-telegram-referral"
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Telegram
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareReferralCode('twitter')}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    data-testid="button-share-twitter-referral"
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Twitter
                  </Button>
                </div>
                
                {/* Referral Landing Page URL */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-2">📋 Referral Landing Page URL:</p>
                  <div className="flex items-center space-x-2">
                    <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono text-blue-800 flex-1 truncate" data-testid="text-referral-url">
                      {referralData?.referralCode ? `${window.location.origin}/register?ref=${referralData.referralCode}` : 'Loading...'}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (referralData?.referralCode) {
                          const referralUrl = `${window.location.origin}/register?ref=${referralData.referralCode}`;
                          navigator.clipboard.writeText(referralUrl);
                          toast({
                            title: "Copied!",
                            description: "Referral landing page URL copied to clipboard",
                          });
                        }
                      }}
                      disabled={!referralData?.referralCode}
                      className="p-2 hover:bg-blue-100"
                      data-testid="button-copy-referral-url"
                    >
                      <Copy className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (referralData?.referralCode) {
                          const referralUrl = `${window.location.origin}/register?ref=${referralData.referralCode}`;
                          window.open(referralUrl, '_blank');
                        }
                      }}
                      disabled={!referralData?.referralCode}
                      className="p-2 hover:bg-green-100"
                      data-testid="button-open-landing"
                    >
                      <ExternalLink className="h-4 w-4 text-green-600" />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Share this link for direct registration with your referral code
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">Loading referral code...</p>
              </div>
            )}
          </div>

          {/* Referral Earnings */}
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-gray-800 mb-2">Referral Earnings</h4>
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600" data-testid="text-total-referral-earnings">
                  ${calculateTotalReferralEarnings()}
                </p>
                <p className="text-sm text-gray-600">Total Earned</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700" data-testid="text-referral-count">
                  {referralEarnings?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Successful Referrals</p>
              </div>
              {referralEarnings?.length > 0 && (
                <div className="max-h-24 overflow-y-auto">
                  <div className="text-xs text-gray-500 space-y-1">
                    {referralEarnings.slice(0, 3).map((earning, index) => (
                      <div key={index} className="flex justify-between">
                        <span>${parseFloat(earning?.earningsAmount || '0').toFixed(2)}</span>
                        <span>{earning?.createdAt ? new Date(earning.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    ))}
                    {referralEarnings?.length > 3 && (
                      <p className="text-center text-gray-400">+{referralEarnings.length - 3} more...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 text-center">
            💰 <strong>How it works:</strong> Share your referral code with friends. When they make their first deposit, you'll earn 5% of their deposit value as bonus tokens!
          </p>
        </div>
      </div>

      {/* User NFTs Section */}
      <UserNFTsSection shareOnTelegram={shareOnTelegram} shareOnTwitter={shareOnTwitter} copyToClipboard={copyToClipboard} />

      {/* User Memes Section */}
      <UserMemesSection shareOnTelegram={shareOnTelegram} shareOnTwitter={shareOnTwitter} copyToClipboard={copyToClipboard} />

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
                    tx.type === 'deposit' || tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'credit' ? '+' : '-'}{formatBalance(tx.amount)} {tokenConfig?.tokenSymbol || 'TOKEN'}
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

// User NFTs Section Component
interface UserNFTsSectionProps {
  shareOnTelegram: (text: string, url?: string) => void;
  shareOnTwitter: (text: string, url?: string) => void;
  copyToClipboard: (text: string) => void;
}

function UserNFTsSection({ shareOnTelegram, shareOnTwitter, copyToClipboard }: UserNFTsSectionProps) {
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const { data: userNfts = [] } = useQuery<any[]>({
    queryKey: ['/api/user/nfts'],
  });

  const handleShareNFT = (platform: string, nft: any) => {
    const shareText = `Check out my ${nft.name} NFT! 🎨\nRarity: ${nft.rarity}\n#NFT #Crypto`;
    if (platform === 'telegram') {
      shareOnTelegram(shareText);
    } else if (platform === 'twitter') {
      shareOnTwitter(shareText);
    }
  };

  const handleCopyNFT = (text: string) => {
    copyToClipboard(text);
  };

  const handleNFTClick = (nft: any) => {
    setSelectedNFT(nft);
    setModalOpen(true);
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      Common: "bg-gray-500",
      Rare: "bg-blue-500",
      Epic: "bg-purple-500", 
      Legendary: "bg-yellow-500"
    };
    return colors[rarity as keyof typeof colors] || "bg-gray-500";
  };

  if (userNfts.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Image className="h-5 w-5 text-purple-600" />
          My NFT Collection
        </h3>
        <Badge variant="secondary">{userNfts.length} NFTs</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userNfts.map((nft: any) => (
          <div key={nft.id} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200 hover:shadow-lg transition-shadow cursor-pointer" 
               data-testid={`nft-card-${nft.id}`}
               onClick={() => handleNFTClick(nft)}>
            {/* NFT Image */}
            <div className="mb-3">
              <img
                src={nft.imageUrl || `https://via.placeholder.com/200x200/6b46c1/ffffff?text=${encodeURIComponent(nft.name)}`}
                alt={nft.name}
                className="w-full h-40 object-cover rounded-lg border border-purple-200"
                loading="lazy"
              />
            </div>
            
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-800">{nft.name}</h4>
              </div>
              <Badge className={`${getRarityColor(nft.rarity)} text-white text-xs`}>
                {nft.rarity || 'Common'}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{nft.description}</p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareNFT('telegram', nft);
                }}
                className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                data-testid={`button-share-nft-${nft.id}`}
              >
                <Share2 className="h-3 w-3" />
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyNFT(`${nft.name} - ${nft.description}`);
                }}
                className="flex items-center gap-1 text-gray-600 border-gray-200 hover:bg-gray-50"
                data-testid={`button-copy-nft-${nft.id}`}
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* NFT Modal */}
      {selectedNFT && (
        <NFTModal
          nft={selectedNFT}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onShare={handleShareNFT}
          onCopy={handleCopyNFT}
        />
      )}
    </div>
  );
}

// User Memes Section Component  
interface UserMemesSectionProps {
  shareOnTelegram: (text: string, url?: string) => void;
  shareOnTwitter: (text: string, url?: string) => void;
  copyToClipboard: (text: string) => void;
}

function UserMemesSection({ shareOnTelegram, shareOnTwitter, copyToClipboard }: UserMemesSectionProps) {
  const { data: userMemes = [] } = useQuery<any[]>({
    queryKey: ['/api/user/memes'],
    refetchInterval: 5000, // Auto-refresh to check for completed generations
  });

  const completedMemes = userMemes.filter((meme: any) => meme.status === 'completed' && meme.imageUrl);

  const handleShareMeme = (meme: any) => {
    const shareText = `Check out my AI-generated meme! 😂 "${meme.prompt}" #Meme #AI #Crypto`;
    if (meme.imageUrl) {
      shareOnTelegram(shareText, meme.imageUrl);
    } else {
      shareOnTelegram(shareText);
    }
  };

  const handleCopyMeme = (meme: any) => {
    const shareText = `AI Meme: "${meme.prompt}" - ${meme.imageUrl || 'Generated meme'}`;
    copyToClipboard(shareText);
  };

  if (completedMemes.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-600" />
          My Generated Memes
        </h3>
        <Badge variant="secondary">{completedMemes.length} Memes</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedMemes.map((meme: any) => (
          <div key={meme.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200" data-testid={`meme-card-${meme.id}`}>
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-800 mb-2">"{meme.prompt}"</p>
              {meme.imageUrl && (
                <div className="relative">
                  <img 
                    src={meme.imageUrl} 
                    alt={meme.prompt}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShareMeme(meme)}
                className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                data-testid={`button-share-meme-${meme.id}`}
              >
                <Share2 className="h-3 w-3" />
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyMeme(meme)}
                className="flex items-center gap-1 text-gray-600 border-gray-200 hover:bg-gray-50"
                data-testid={`button-copy-meme-${meme.id}`}
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
              {meme.imageUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(meme.imageUrl, '_blank')}
                  className="flex items-center gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                  data-testid={`button-view-meme-${meme.id}`}
                >
                  <ExternalLink className="h-3 w-3" />
                  View
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}