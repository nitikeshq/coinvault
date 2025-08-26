import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { Sparkles, Image, Coins, Clock, CheckCircle, XCircle } from "lucide-react";

// Rarity color mapping
const rarityColors = {
  Common: "bg-gray-500",
  Rare: "bg-blue-500", 
  Epic: "bg-purple-500",
  Legendary: "bg-yellow-500"
};

const getRarityColor = (rarity: string) => {
  return rarityColors[rarity as keyof typeof rarityColors] || "bg-gray-500";
};

export default function DappsSection() {
  const { toast } = useToast();
  const [memePrompt, setMemePrompt] = useState("");
  const [memeOverlayText, setMemeOverlayText] = useState("");
  const [nftTheme, setNftTheme] = useState("");
  const [nftStyle, setNftStyle] = useState("");
  const [stakeType, setStakeType] = useState("token");
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeDuration, setStakeDuration] = useState(30);
  const [selectedNftForStaking, setSelectedNftForStaking] = useState("");
  const { tokenSymbol } = useTokenInfo();

  // Fetch enabled dapps
  const { data: dappSettings = [] } = useQuery<any[]>({
    queryKey: ["/api/dapps/settings"],
  });

  // Fetch user balance
  const { data: balance } = useQuery<any>({
    queryKey: ["/api/user/balance"],
  });

  // Fetch NFT stats
  const { data: nftStats } = useQuery<any>({
    queryKey: ["/api/nfts/stats"],
  });

  // Fetch available NFTs
  const { data: availableNfts = [] } = useQuery<any[]>({
    queryKey: ["/api/nfts/available"],
  });

  // Fetch user NFTs
  const { data: userNfts = [] } = useQuery<any[]>({
    queryKey: ["/api/user/nfts"],
  });

  // Fetch user memes
  const { data: userMemes = [] } = useQuery<any[]>({
    queryKey: ["/api/user/memes"],
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: (data) => {
      // Only poll if there are pending memes, otherwise check every 2 minutes
      const hasPending = Array.isArray(data) && data.some((meme: any) => meme.status === 'pending' || meme.status === 'processing');
      return hasPending ? 30000 : 120000; // 30s if pending, 2min if all complete
    },
  });

  // Fetch user stakings
  const { data: userStakings = [] } = useQuery<any[]>({
    queryKey: ["/api/user/stakings"],
  });

  const nftBuyMutation = useMutation({
    mutationFn: async (nftId: string) => {
      return apiRequest("POST", "/api/nfts/buy", { nftId });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "NFT purchased successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/nfts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to purchase NFT",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const memeGenerationMutation = useMutation({
    mutationFn: async ({ prompt, overlayText }: { prompt: string; overlayText: string }) => {
      return apiRequest("POST", "/api/memes/generate", { prompt, overlayText });
    },
    onSuccess: () => {
      toast({
        title: "Meme Generation Started!",
        description: "Your meme is being generated...",
      });
      setMemePrompt("");
      setMemeOverlayText("");
      queryClient.invalidateQueries({ queryKey: ["/api/user/memes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate meme",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const nftGenerationMutation = useMutation({
    mutationFn: async ({ theme, style }: { theme: string; style: string }) => {
      return apiRequest("POST", "/api/nfts/generate", { theme, style });
    },
    onSuccess: () => {
      toast({
        title: "NFT Generation Started!",
        description: "Your unique NFT is being created...",
      });
      setNftTheme("");
      setNftStyle("");
      queryClient.invalidateQueries({ queryKey: ["/api/user/nfts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate NFT",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stakingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/staking/create", data);
    },
    onSuccess: () => {
      toast({
        title: "Staking Created!",
        description: "Your tokens/NFT have been staked successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stakings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      setStakeAmount("");
      setSelectedNftForStaking("");
    },
    onError: (error: any) => {
      toast({
        title: "Staking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unstakeMutation = useMutation({
    mutationFn: async (stakingId: string) => {
      return apiRequest("POST", `/api/staking/unstake/${stakingId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Unstaked Successfully!",
        description: "Your tokens and rewards have been returned!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stakings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Unstaking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBuyNft = (nftId: string) => {
    nftBuyMutation.mutate(nftId);
  };

  const handleGenerateMeme = () => {
    if (!memePrompt.trim()) return;
    memeGenerationMutation.mutate({ prompt: memePrompt.trim(), overlayText: memeOverlayText.trim() });
  };

  const handleGenerateNft = () => {
    if (!nftTheme.trim()) return;
    nftGenerationMutation.mutate({ theme: nftTheme.trim(), style: nftStyle });
  };

  const handleStake = () => {
    if (stakeType === 'token' && (!stakeAmount || parseFloat(stakeAmount) <= 0)) return;
    if (stakeType === 'nft' && !selectedNftForStaking) return;

    stakingMutation.mutate({
      stakeType,
      tokenAmount: stakeType === 'token' ? stakeAmount : undefined,
      nftId: stakeType === 'nft' ? selectedNftForStaking : undefined,
      stakeDurationDays: stakeDuration
    });
  };

  const isNftMintEnabled = dappSettings.some(d => d.appName === 'nft_mint' && d.isEnabled);
  const isMemeGeneratorEnabled = dappSettings.some(d => d.appName === 'meme_generator' && d.isEnabled);
  const isStakingEnabled = dappSettings.some(d => d.appName === 'staking' && d.isEnabled);

  const nftMintSettings = dappSettings.find(d => d.appName === 'nft_mint');
  const memeGeneratorSettings = dappSettings.find(d => d.appName === 'meme_generator');
  const stakingSettings = dappSettings.find(d => d.appName === 'staking');

  const userBalance = parseFloat(balance?.balance || '0');
  const nftCost = parseFloat(nftMintSettings?.cost || '0');
  const memeCost = parseFloat(memeGeneratorSettings?.cost || '0');

  if (dappSettings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <Sparkles className="h-16 w-16 text-purple-400" />
            <h2 className="text-xl font-bold text-center">No Dapps Available</h2>
            <p className="text-gray-600 text-center">
              All decentralized apps are currently disabled. Please check back later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Decentralized Apps
        </h1>
        <p className="text-gray-700 text-lg">
          Use your {tokenSymbol} tokens to access exclusive features
        </p>
        
        {/* User Balance */}
        <Card className="max-w-md mx-auto">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">Your {tokenSymbol} Balance:</span>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {userBalance.toLocaleString()}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={isNftMintEnabled ? "nft-mint" : isMemeGeneratorEnabled ? "meme-generator" : "staking"} className="w-full">
        <TabsList className={`grid w-full ${[isNftMintEnabled, isMemeGeneratorEnabled, isStakingEnabled].filter(Boolean).length === 4 ? 'grid-cols-4' : [isNftMintEnabled, isMemeGeneratorEnabled, isStakingEnabled].filter(Boolean).length === 3 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {isNftMintEnabled && (
            <TabsTrigger value="nft-mint" data-testid="tab-nft-mint">
              <Image className="h-4 w-4 mr-2" />
              NFT Store
            </TabsTrigger>
          )}
          {isNftMintEnabled && (
            <TabsTrigger value="nft-generator" data-testid="tab-nft-generator">
              <Sparkles className="h-4 w-4 mr-2" />
              NFT Generator
            </TabsTrigger>
          )}
          {isMemeGeneratorEnabled && (
            <TabsTrigger value="meme-generator" data-testid="tab-meme-generator">
              <Sparkles className="h-4 w-4 mr-2" />
              Memes Generator
            </TabsTrigger>
          )}
          {isStakingEnabled && (
            <TabsTrigger value="staking" data-testid="tab-staking">
              <Clock className="h-4 w-4 mr-2" />
              Staking
            </TabsTrigger>
          )}
        </TabsList>

        {/* NFT Mint Tab */}
        {isNftMintEnabled && (
          <TabsContent value="nft-mint" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* NFT Mint Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Image className="h-5 w-5" />
                    <span>Buy NFT</span>
                    <Badge variant="outline">{nftCost?.toLocaleString()} {tokenSymbol}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    {nftMintSettings?.description}
                  </div>
                  
                  {nftStats && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sold:</span>
                        <span>{nftStats.mintedNfts || 0} / {nftStats.totalNfts || 0}</span>
                      </div>
                      <Progress 
                        value={((nftStats.mintedNfts || 0) / (nftStats.totalNfts || 1)) * 100} 
                        className="h-2"
                      />
                      <div className="text-sm text-gray-600">
                        Available: {nftStats.availableNfts || 0} NFTs
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    {availableNfts.length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Next Available NFT:</div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">
                              {tokenSymbol} NFT #{availableNfts[0]?.tokenId}
                            </div>
                            <Badge 
                              className={`${getRarityColor(availableNfts[0]?.rarity || 'Common')} text-white text-xs`}
                            >
                              {availableNfts[0]?.rarity || 'Common'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {availableNfts[0]?.description}
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleBuyNft(availableNfts[0].id)}
                          disabled={nftBuyMutation.isPending || userBalance < nftCost}
                          className="w-full"
                          data-testid="button-buy-nft"
                        >
                          {nftBuyMutation.isPending ? "Purchasing..." : `Buy for ${nftCost?.toLocaleString()} ${tokenSymbol}`}
                        </Button>
                        {userBalance < nftCost && (
                          <div className="text-sm text-red-600 text-center">
                            Insufficient {tokenSymbol} balance
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-600">
                        <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <div>All NFTs have been sold!</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* User NFTs */}
              <Card>
                <CardHeader>
                  <CardTitle>Your NFT Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  {userNfts.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {userNfts.map((nft: any) => (
                        <div key={nft.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{nft.name}</div>
                              <Badge 
                                className={`${getRarityColor(nft.rarity || 'Common')} text-white text-xs mt-1`}
                              >
                                {nft.rarity || 'Common'}
                              </Badge>
                            </div>
                            <Badge variant="secondary">Owned</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <div>No NFTs owned yet</div>
                      <div className="text-sm">Buy your first NFT to get started!</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* NFT Generator Tab */}
        {isNftMintEnabled && (
          <TabsContent value="nft-generator" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* NFT Generation Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Generate NFT</span>
                    <Badge variant="outline">{nftCost?.toLocaleString()} {tokenSymbol}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Create your own unique NFT with AI-powered artwork and metadata generation.
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nft-theme">NFT Theme</Label>
                      <Input
                        id="nft-theme"
                        placeholder="e.g., Cyberpunk warrior, Magic crystal, Space explorer..."
                        value={nftTheme}
                        onChange={(e) => setNftTheme(e.target.value)}
                        data-testid="input-nft-theme"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="nft-style">Style (Optional)</Label>
                      <select
                        id="nft-style"
                        value={nftStyle}
                        onChange={(e) => setNftStyle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        data-testid="select-nft-style"
                      >
                        <option value="">Choose style...</option>
                        <option value="anime">Anime</option>
                        <option value="realistic">Realistic</option>
                        <option value="cartoon">Cartoon</option>
                        <option value="abstract">Abstract</option>
                        <option value="pixel-art">Pixel Art</option>
                        <option value="fantasy">Fantasy</option>
                      </select>
                    </div>
                    
                    <Button 
                      onClick={handleGenerateNft}
                      disabled={nftGenerationMutation.isPending || userBalance < nftCost || !nftTheme.trim()}
                      className="w-full"
                      data-testid="button-generate-nft"
                    >
                      {nftGenerationMutation.isPending ? "Generating..." : `Generate NFT for ${nftCost?.toLocaleString()} ${tokenSymbol}`}
                    </Button>
                    
                    {userBalance < nftCost && (
                      <div className="text-sm text-red-600 text-center">
                        Insufficient {tokenSymbol} balance
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Generated NFTs */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Generated NFTs</CardTitle>
                </CardHeader>
                <CardContent>
                  {userNfts.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {userNfts.filter((nft: any) => nft.isUserGenerated).map((nft: any) => (
                        <div key={nft.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{nft.name}</div>
                              <div className="text-sm text-gray-600 mt-1">{nft.description}</div>
                              <Badge 
                                className={`${getRarityColor(nft.rarity || 'Common')} text-white text-xs mt-2`}
                              >
                                {nft.rarity || 'Common'}
                              </Badge>
                            </div>
                            <Badge variant="secondary">Generated</Badge>
                          </div>
                          {nft.imageUrl && (
                            <div className="mt-2">
                              <img 
                                src={nft.imageUrl} 
                                alt={nft.name}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <div>No generated NFTs yet</div>
                      <div className="text-sm">Create your first unique NFT!</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Meme Generator Tab */}
        {isMemeGeneratorEnabled && (
          <TabsContent value="meme-generator" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Meme Generation Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Generate Meme</span>
                    <Badge variant="outline">{memeCost?.toLocaleString()} {tokenSymbol}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    {memeGeneratorSettings?.description}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="meme-prompt">Meme Description</Label>
                      <Input
                        id="meme-prompt"
                        placeholder="Describe your meme idea..."
                        value={memePrompt}
                        onChange={(e) => setMemePrompt(e.target.value)}
                        data-testid="input-meme-prompt"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="meme-overlay-text">Type your text here (it will be shown in the image)</Label>
                      <Input
                        id="meme-overlay-text"
                        placeholder="Optional: Text to display on the meme image..."
                        value={memeOverlayText}
                        onChange={(e) => setMemeOverlayText(e.target.value)}
                        data-testid="input-meme-overlay-text"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleGenerateMeme}
                      disabled={memeGenerationMutation.isPending || userBalance < memeCost || !memePrompt.trim()}
                      className="w-full"
                      data-testid="button-generate-meme"
                    >
                      {memeGenerationMutation.isPending ? "Generating..." : `Generate for ${memeCost?.toLocaleString()} ${tokenSymbol}`}
                    </Button>
                    
                    {userBalance < memeCost && (
                      <div className="text-sm text-red-600 text-center">
                        Insufficient {tokenSymbol} balance
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Generated Memes */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Generated Memes</CardTitle>
                </CardHeader>
                <CardContent>
                  {userMemes.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {userMemes.map((meme: any) => (
                        <div key={meme.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <div className="font-medium text-sm mb-1">"{meme.prompt}"</div>
                              {meme.overlayText && (
                                <div className="text-xs text-blue-600 mb-1 font-medium">
                                  Text on image: "{meme.overlayText}"
                                </div>
                              )}
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                {meme.status === 'completed' ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span>Completed</span>
                                  </>
                                ) : meme.status === 'failed' ? (
                                  <>
                                    <XCircle className="h-3 w-3 text-red-600" />
                                    <span>Failed</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 text-yellow-600" />
                                    <span>Generating...</span>
                                  </>
                                )}
                              </div>
                              {meme.status === 'failed' && meme.errorMessage && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                                  <div className="font-medium mb-1">Generation Failed:</div>
                                  <div>{meme.errorMessage}</div>
                                  <div className="mt-1 text-red-500">Your tokens have been refunded.</div>
                                </div>
                              )}
                              {meme.imageUrl && (
                                <div className="mt-2">
                                  <img 
                                    src={meme.imageUrl} 
                                    alt={meme.prompt}
                                    className="w-24 h-24 rounded object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <div>No memes generated yet</div>
                      <div className="text-sm">Create your first AI meme!</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Staking Tab */}
        {isStakingEnabled && (
          <TabsContent value="staking" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Staking Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Create Stake</span>
                    <Badge variant="outline">Earn Rewards</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    {stakingSettings?.description}
                  </div>
                  
                  {/* Stake Type Selection */}
                  <div>
                    <Label htmlFor="stake-type">Stake Type</Label>
                    <select
                      id="stake-type"
                      value={stakeType}
                      onChange={(e) => setStakeType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      data-testid="select-stake-type"
                    >
                      <option value="token">Token Staking</option>
                      <option value="nft">NFT Staking</option>
                    </select>
                  </div>

                  {/* Token Amount Input */}
                  {stakeType === 'token' && (
                    <div>
                      <Label htmlFor="stake-amount">Amount to Stake</Label>
                      <Input
                        id="stake-amount"
                        type="number"
                        step="0.00000001"
                        min="0"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder={`Amount in ${tokenSymbol}`}
                        className="w-full"
                        data-testid="input-stake-amount"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Available: {userBalance.toLocaleString()} {tokenSymbol}
                      </div>
                    </div>
                  )}

                  {/* NFT Selection */}
                  {stakeType === 'nft' && (
                    <div>
                      <Label htmlFor="stake-nft">Select NFT to Stake</Label>
                      <select
                        id="stake-nft"
                        value={selectedNftForStaking}
                        onChange={(e) => setSelectedNftForStaking(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        data-testid="select-stake-nft"
                      >
                        <option value="">Choose NFT...</option>
                        {userNfts.map((nft: any) => (
                          <option key={nft.id} value={nft.id}>
                            {nft.name} - {nft.rarity}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-gray-500 mt-1">
                        You own {userNfts.length} NFTs
                      </div>
                    </div>
                  )}

                  {/* Duration Selection */}
                  <div>
                    <Label htmlFor="stake-duration">Staking Duration</Label>
                    <select
                      id="stake-duration"
                      value={stakeDuration}
                      onChange={(e) => setStakeDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      data-testid="select-stake-duration"
                    >
                      <option value={30}>30 Days (5% APY)</option>
                      <option value={60}>60 Days (8% APY)</option>
                      <option value={90}>90 Days (12% APY)</option>
                      <option value={180}>180 Days (18% APY)</option>
                      <option value={365}>365 Days (25% APY)</option>
                    </select>
                  </div>

                  <Button 
                    onClick={handleStake}
                    disabled={stakingMutation.isPending || 
                      (stakeType === 'token' && (!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > userBalance)) ||
                      (stakeType === 'nft' && !selectedNftForStaking)
                    }
                    className="w-full"
                    data-testid="button-create-stake"
                  >
                    {stakingMutation.isPending ? "Creating Stake..." : "Create Stake"}
                  </Button>
                  
                  {stakeType === 'token' && parseFloat(stakeAmount) > userBalance && (
                    <div className="text-sm text-red-600 text-center">
                      Insufficient {tokenSymbol} balance
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Stakes */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Active Stakes</CardTitle>
                </CardHeader>
                <CardContent>
                  {userStakings.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {userStakings.filter((stake: any) => stake.staking.isActive).map((stake: any) => {
                        const daysRemaining = Math.ceil((new Date(stake.staking.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isExpired = daysRemaining <= 0;
                        
                        return (
                          <div key={stake.staking.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium">
                                  {stake.staking.stakeType === 'token' ? 
                                    `${parseFloat(stake.staking.tokenAmount).toLocaleString()} ${tokenSymbol}` :
                                    stake.nft?.name || 'NFT Stake'
                                  }
                                </div>
                                <div className="text-sm text-gray-600">
                                  Duration: {stake.staking.stakeDurationDays} days
                                </div>
                                <div className="text-sm text-gray-600">
                                  APY: {(parseFloat(stake.staking.rewardRate) * 365 * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600">
                                  {isExpired ? 'Ready to unstake' : `${daysRemaining} days remaining`}
                                </div>
                                <div className="text-sm text-green-600">
                                  Rewards: {parseFloat(stake.staking.totalRewards || '0').toLocaleString()} {tokenSymbol}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Badge variant={isExpired ? "default" : "secondary"}>
                                  {isExpired ? "Ready" : "Active"}
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => unstakeMutation.mutate(stake.staking.id)}
                                  disabled={unstakeMutation.isPending}
                                  className="text-xs"
                                  data-testid={`button-unstake-${stake.staking.id}`}
                                >
                                  {unstakeMutation.isPending ? "..." : "Unstake"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <div>No active stakes</div>
                      <div className="text-sm">Create your first stake to earn rewards!</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}