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
import { Sparkles, Image, Coins, Clock, CheckCircle, XCircle } from "lucide-react";

export default function DappsSection() {
  const { toast } = useToast();
  const [memePrompt, setMemePrompt] = useState("");

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
    refetchInterval: 5000, // Auto-refresh to check for completed generations
  });

  const nftMintMutation = useMutation({
    mutationFn: async (nftId: string) => {
      return apiRequest("POST", "/api/nfts/mint", { nftId });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "NFT minted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/nfts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to mint NFT",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const memeGenerationMutation = useMutation({
    mutationFn: async (prompt: string) => {
      return apiRequest("POST", "/api/memes/generate", { prompt });
    },
    onSuccess: () => {
      toast({
        title: "Meme Generation Started!",
        description: "Your meme is being generated...",
      });
      setMemePrompt("");
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

  const handleMintNft = (nftId: string) => {
    nftMintMutation.mutate(nftId);
  };

  const handleGenerateMeme = () => {
    if (!memePrompt.trim()) return;
    memeGenerationMutation.mutate(memePrompt.trim());
  };

  const isNftMintEnabled = dappSettings.some(d => d.appName === 'nft_mint' && d.isEnabled);
  const isMemeGeneratorEnabled = dappSettings.some(d => d.appName === 'meme_generator' && d.isEnabled);

  const nftMintSettings = dappSettings.find(d => d.appName === 'nft_mint');
  const memeGeneratorSettings = dappSettings.find(d => d.appName === 'meme_generator');

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
          Use your CHILL tokens to access exclusive features
        </p>
        
        {/* User Balance */}
        <Card className="max-w-md mx-auto">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">Your CHILL Balance:</span>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {userBalance.toLocaleString()}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={isNftMintEnabled ? "nft-mint" : "meme-generator"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {isNftMintEnabled && (
            <TabsTrigger value="nft-mint" data-testid="tab-nft-mint">
              <Image className="h-4 w-4 mr-2" />
              NFT Mint
            </TabsTrigger>
          )}
          {isMemeGeneratorEnabled && (
            <TabsTrigger value="meme-generator" data-testid="tab-meme-generator">
              <Sparkles className="h-4 w-4 mr-2" />
              Memes Generator
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
                    <span>Mint NFT</span>
                    <Badge variant="outline">{nftCost?.toLocaleString()} CHILL</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    {nftMintSettings?.description}
                  </div>
                  
                  {nftStats && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Minted:</span>
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
                          <div className="font-medium">
                            CHILL NFT #{availableNfts[0]?.tokenId}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {availableNfts[0]?.description}
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleMintNft(availableNfts[0].id)}
                          disabled={nftMintMutation.isPending || userBalance < nftCost}
                          className="w-full"
                          data-testid="button-mint-nft"
                        >
                          {nftMintMutation.isPending ? "Minting..." : `Mint for ${nftCost?.toLocaleString()} CHILL`}
                        </Button>
                        {userBalance < nftCost && (
                          <div className="text-sm text-red-600 text-center">
                            Insufficient CHILL balance
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-600">
                        <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <div>All NFTs have been minted!</div>
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
                              <div className="text-sm text-gray-600">Token #{nft.tokenId}</div>
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
                      <div className="text-sm">Mint your first NFT to get started!</div>
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
                    <Badge variant="outline">{memeCost?.toLocaleString()} CHILL</Badge>
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
                    
                    <Button 
                      onClick={handleGenerateMeme}
                      disabled={memeGenerationMutation.isPending || userBalance < memeCost || !memePrompt.trim()}
                      className="w-full"
                      data-testid="button-generate-meme"
                    >
                      {memeGenerationMutation.isPending ? "Generating..." : `Generate for ${memeCost?.toLocaleString()} CHILL`}
                    </Button>
                    
                    {userBalance < memeCost && (
                      <div className="text-sm text-red-600 text-center">
                        Insufficient CHILL balance
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
      </Tabs>
    </div>
  );
}