import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, ThumbsDown, TrendingUp, Trophy, Zap, Clock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function MarketSection() {
  const [activeMarket, setActiveMarket] = useState<'nfts' | 'memes'>('nfts');
  const [listingPrice, setListingPrice] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // NFT Data Queries
  const { data: nftListings = [] } = useQuery<any[]>({
    queryKey: ['/api/marketplace/nft/listings'],
  });

  const { data: myNFTs = [] } = useQuery<any[]>({
    queryKey: ['/api/user/nfts'],
  });

  const { data: myListings = [] } = useQuery<any[]>({
    queryKey: ['/api/marketplace/nft/my-listings'],
  });

  // Meme Data Queries  
  const { data: memes = [] } = useQuery<any[]>({
    queryKey: ['/api/user/memes'],
  });

  const { data: memeLeaderboard = [] } = useQuery<any[]>({
    queryKey: ['/api/marketplace/meme/leaderboard'],
  });

  const formatBalance = (balance: string | number) => {
    return parseFloat(balance?.toString() || "0").toFixed(2);
  };

  const NFTMarketplace = () => (
    <div className="space-y-6">
      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="listings" data-testid="tab-listed-nfts">
            <TrendingUp className="h-4 w-4 mr-2" />
            Listed for Sale NFTs
          </TabsTrigger>
          <TabsTrigger value="my-nfts" data-testid="tab-my-nfts">
            <Star className="h-4 w-4 mr-2" />
            My NFTs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nftListings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No NFTs listed for sale yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  List your NFTs to start trading in the marketplace
                </p>
              </div>
            ) : (
              nftListings.map((listing: any) => (
                <Card key={listing.listing.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-4 flex items-center justify-center">
                      {listing.nft.imageUrl ? (
                        <img 
                          src={listing.nft.imageUrl} 
                          alt={listing.nft.name}
                          className="w-full h-full object-cover rounded-lg"
                          data-testid={`nft-image-${listing.nft.id}`}
                        />
                      ) : (
                        <Star className="h-12 w-12 text-purple-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-2" data-testid={`nft-name-${listing.nft.id}`}>
                      {listing.nft.name}
                    </h3>
                    <Badge variant="outline" className="mb-2">
                      {listing.nft.rarity}
                    </Badge>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Min Price:</span>
                        <span className="font-medium">${formatBalance(listing.listing.minPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Highest Bid:</span>
                        <span className="font-medium text-green-600">
                          ${formatBalance(listing.listing.currentHighestBid || "0")}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        data-testid={`button-bid-${listing.listing.id}`}
                        onClick={() => {
                          toast({
                            title: "Bidding Feature",
                            description: "Bidding system will be implemented with $1 platform fee",
                          });
                        }}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Place Bid ($1 fee)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-nfts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myNFTs.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Star className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">You don't own any NFTs yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Generate your first NFT to start building your collection
                </p>
              </div>
            ) : (
              myNFTs.map((userNft: any) => {
                const nft = userNft.nft || userNft; // Handle both nested and flat structure
                return (
                  <Card key={userNft.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-4 flex items-center justify-center">
                        {nft?.imageUrl ? (
                          <img 
                            src={nft.imageUrl} 
                            alt={nft.name || 'NFT'}
                            className="w-full h-full object-cover rounded-lg"
                            data-testid={`owned-nft-image-${nft.id || userNft.id}`}
                          />
                        ) : (
                          <Star className="h-12 w-12 text-purple-400" />
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-2" data-testid={`owned-nft-name-${nft?.id || userNft.id}`}>
                        {nft?.name || `NFT #${nft?.tokenId || userNft.id?.slice(-4)}`}
                      </h3>
                      <Badge variant="outline" className="mb-2">
                        {nft?.rarity || 'Common'}
                      </Badge>
                      <div className="space-y-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="w-full"
                              data-testid={`button-list-${nft?.id || userNft.id}`}
                              onClick={() => setSelectedNFT(userNft)}
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              List for Sale
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>List NFT for Sale</DialogTitle>
                            </DialogHeader>
                            <ListNFTDialog nft={userNft} onClose={() => setSelectedNFT(null)} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const MemeMarketplace = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Heart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No memes generated yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Generate your first meme to participate in the meme marketplace
            </p>
          </div>
        ) : (
          memes.map((meme: any) => (
            <Card key={meme.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="aspect-square bg-gradient-to-br from-pink-100 to-yellow-100 rounded-lg mb-4 flex items-center justify-center">
                  {meme.imageUrl ? (
                    <img 
                      src={meme.imageUrl} 
                      alt="Generated Meme"
                      className="w-full h-full object-cover rounded-lg"
                      data-testid={`meme-image-${meme.id}`}
                    />
                  ) : (
                    <Heart className="h-12 w-12 text-pink-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4" data-testid={`meme-prompt-${meme.id}`}>
                  "{meme.prompt}"
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-4">
                    <MemeVoteButtons meme={meme} />
                  </div>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(meme.generatedAt).toLocaleDateString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Leaderboard Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            Meme Leaderboard
            <Badge variant="outline" className="ml-2">
              Future Bonus Rewards!
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon!</h3>
            <p className="text-gray-600 mb-4">
              Most liked and most disliked meme creators will receive special bonuses
              after the presale ends.
            </p>
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">
                🎁 Surprise Box Awaits Top Meme Creators!
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Generate amazing memes and get community votes for exclusive rewards
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // NFT Listing Mutation
  const listNFTMutation = useMutation({
    mutationFn: async ({ nftId, minPrice }: { nftId: string, minPrice: string }) => {
      return apiRequest(`/api/marketplace/nft/list`, {
        method: 'POST',
        body: JSON.stringify({ nftId, minPrice: parseFloat(minPrice) }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/nft/listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/nfts'] });
      toast({
        title: "Success!",
        description: "NFT listed for sale successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to list NFT for sale",
        variant: "destructive",
      });
    }
  });

  // Meme Like Mutation
  const likeMutation = useMutation({
    mutationFn: async (memeId: string) => {
      return apiRequest(`/api/marketplace/meme/${memeId}/like`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/memes'] });
      toast({
        title: "Liked!",
        description: "You liked this meme",
      });
    },
  });

  // Meme Dislike Mutation
  const dislikeMutation = useMutation({
    mutationFn: async (memeId: string) => {
      return apiRequest(`/api/marketplace/meme/${memeId}/dislike`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/memes'] });
      toast({
        title: "Disliked!",
        description: "You disliked this meme",
      });
    },
  });

  // List NFT Dialog Component
  const ListNFTDialog = ({ nft, onClose }: { nft: any, onClose: () => void }) => {
    const [price, setPrice] = useState('');

    const handleSubmit = () => {
      if (!price || parseFloat(price) <= 0) {
        toast({
          title: "Invalid Price",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        return;
      }

      listNFTMutation.mutate({ 
        nftId: nft.nftId || nft.id, 
        minPrice: price 
      });
      onClose();
      setPrice('');
    };

    const nftData = nft.nft || nft;
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
            {nftData?.imageUrl ? (
              <img src={nftData.imageUrl} alt={nftData.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Star className="h-8 w-8 text-purple-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{nftData?.name || `NFT #${nftData?.tokenId}`}</h3>
            <Badge variant="outline">{nftData?.rarity || 'Common'}</Badge>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Minimum Price ($)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter minimum price"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={listNFTMutation.isPending}
          >
            {listNFTMutation.isPending ? 'Listing...' : 'List NFT'}
          </Button>
        </div>
      </div>
    );
  };

  // Meme Vote Buttons Component
  const MemeVoteButtons = ({ meme }: { meme: any }) => {
    return (
      <>
        <Button 
          size="sm" 
          variant="outline"
          data-testid={`button-like-${meme.id}`}
          onClick={() => likeMutation.mutate(meme.id)}
          disabled={likeMutation.isPending}
        >
          <Heart className="h-4 w-4 mr-1" />
          {meme.likeCount || 0}
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          data-testid={`button-dislike-${meme.id}`}
          onClick={() => dislikeMutation.mutate(meme.id)}
          disabled={dislikeMutation.isPending}
        >
          <ThumbsDown className="h-4 w-4 mr-1" />
          {meme.dislikeCount || 0}
        </Button>
      </>
    );
  };

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Market</h1>
        <div className="flex space-x-2">
          <Button
            variant={activeMarket === 'nfts' ? 'default' : 'outline'}
            onClick={() => setActiveMarket('nfts')}
            data-testid="button-nft-market"
          >
            <Star className="h-4 w-4 mr-2" />
            NFTs
          </Button>
          <Button
            variant={activeMarket === 'memes' ? 'default' : 'outline'}
            onClick={() => setActiveMarket('memes')}
            data-testid="button-meme-market"
          >
            <Heart className="h-4 w-4 mr-2" />
            Memes
          </Button>
        </div>
      </div>

      {activeMarket === 'nfts' ? <NFTMarketplace /> : <MemeMarketplace />}
    </div>
  );
}