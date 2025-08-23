import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, ThumbsDown, TrendingUp, Trophy, Zap, Clock, Star, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTokenInfo } from "@/hooks/useTokenInfo";

export default function MarketSection() {
  const [activeMarket, setActiveMarket] = useState<'nfts' | 'memes'>('nfts');
  const [listingPrice, setListingPrice] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tokenName } = useTokenInfo();

  // NFT Data Queries
  const { data: nftListings = [] } = useQuery<any[]>({
    queryKey: ['/api/marketplace/nft/listings'],
  });

  const { data: platformNFTListings = [] } = useQuery<any[]>({
    queryKey: ['/api/marketplace/nft/platform-listings'],
  });

  const { data: userGeneratedNFTListings = [] } = useQuery<any[]>({
    queryKey: ['/api/marketplace/nft/user-generated-listings'],
  });

  const { data: myNFTs = [] } = useQuery<any[]>({
    queryKey: ['/api/user/nfts'],
  });

  const { data: myListings = [] } = useQuery<any[]>({
    queryKey: ['/api/marketplace/nft/my-listings'],
  });

  // Meme Data Queries with pagination
  const [memePage, setMemePage] = useState(1);
  const memesPerPage = 6;
  
  const { data: memes = [] } = useQuery<any[]>({
    queryKey: ['/api/marketplace/meme/feed', memePage],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/meme/feed?page=${memePage}&limit=${memesPerPage}`);
      if (!response.ok) throw new Error('Failed to fetch memes');
      return response.json();
    },
  });
  
  const { data: allMemesCount = 0 } = useQuery<number>({
    queryKey: ['/api/marketplace/meme/count'],
  });
  
  const totalMemePages = Math.ceil(allMemesCount / memesPerPage);


  const formatBalance = (balance: string | number) => {
    return parseFloat(balance?.toString() || "0").toFixed(2);
  };

  const NFTMarketplace = () => (
    <div className="space-y-6">
      <Tabs defaultValue="platform-nfts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="platform-nfts" data-testid="tab-platform-nfts">
            <Trophy className="h-4 w-4 mr-2" />
            Platform NFTs (Limited)
          </TabsTrigger>
          <TabsTrigger value="user-generated-nfts" data-testid="tab-user-generated-nfts">
            <TrendingUp className="h-4 w-4 mr-2" />
            User NFTs (Unlimited)
          </TabsTrigger>
          <TabsTrigger value="my-nfts" data-testid="tab-my-nfts">
            <Star className="h-4 w-4 mr-2" />
            My NFTs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform-nfts" className="space-y-4">
          <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <h3 className="font-semibold text-gray-800 flex items-center mb-2">
              <Trophy className="h-5 w-5 mr-2 text-purple-600" />
              Platform NFTs - Limited Collection
            </h3>
            <p className="text-sm text-gray-600">
              These are premium NFTs created by the platform admin with detailed traits and limited quantities. Each one is unique and scarce.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformNFTListings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No platform NFTs listed for sale yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Premium limited NFTs will appear here when available
                </p>
              </div>
            ) : (
              platformNFTListings.map((listing: any) => (
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
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline">
                        {listing.nft.rarity}
                      </Badge>
                      <Badge variant="default" className="text-xs bg-purple-500">
                        {tokenName}
                      </Badge>
                    </div>
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
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Sale Details</DialogTitle>
                            </DialogHeader>
                            <SaleDetailsDialog listing={listing.listing} nft={listing.nft} seller={listing.seller} />
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="flex-1"
                              data-testid={`button-bid-${listing.listing.id}`}
                            >
                              <Zap className="h-4 w-4 mr-1" />
                              Place Bid
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Place Bid</DialogTitle>
                            </DialogHeader>
                            <BidDialog listing={listing.listing} nft={listing.nft} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="user-generated-nfts" className="space-y-4">
          <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold text-gray-800 flex items-center mb-2">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              User-Generated NFTs - Unlimited Collection
            </h3>
            <p className="text-sm text-gray-600">
              These NFTs are created by users through AI generation with automatic rarity distribution (50% Common, 30% Rare, 15% Epic, 5% Legendary).
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userGeneratedNFTListings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Star className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No user-generated NFTs listed for sale yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Generate your own unique NFT and list it here
                </p>
              </div>
            ) : (
              userGeneratedNFTListings.map((listing: any) => (
                <Card key={listing.listing.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg mb-4 flex items-center justify-center">
                      {listing.nft.imageUrl ? (
                        <img 
                          src={listing.nft.imageUrl} 
                          alt={listing.nft.name}
                          className="w-full h-full object-cover rounded-lg"
                          data-testid={`user-nft-image-${listing.nft.id}`}
                        />
                      ) : (
                        <Star className="h-12 w-12 text-green-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-2" data-testid={`user-nft-name-${listing.nft.id}`}>
                      {listing.nft.name}
                    </h3>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline">
                        {listing.nft.rarity}
                      </Badge>
                      <Badge variant="default" className="text-xs bg-green-500">
                        User-Generated
                      </Badge>
                    </div>
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
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Sale Details</DialogTitle>
                            </DialogHeader>
                            <SaleDetailsDialog listing={listing.listing} nft={listing.nft} seller={listing.seller} />
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="flex-1"
                              data-testid={`button-bid-user-${listing.listing.id}`}
                            >
                              <Zap className="h-4 w-4 mr-1" />
                              Place Bid
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Place Bid</DialogTitle>
                            </DialogHeader>
                            <BidDialog listing={listing.listing} nft={listing.nft} />
                          </DialogContent>
                        </Dialog>
                      </div>
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
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline">
                          {nft?.rarity || 'Common'}
                        </Badge>
                        {!nft?.isUserGenerated && (
                          <Badge variant="default" className="text-xs bg-purple-500">
                            {tokenName}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="w-full"
                              data-testid={`button-list-${nft?.id || userNft.id}`}
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              List for Sale ($1 fee)
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

  const handleMemePage = (page: number) => {
    if (page >= 1 && page <= totalMemePages) {
      setMemePage(page);
    }
  };

  const MemeMarketplace = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!memes || memes.length === 0 ? (
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
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="text-xs font-medium text-blue-600">
                      @{meme.user?.name || meme.user?.username || 'Anonymous'}
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(meme.generatedAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600" data-testid={`meme-prompt-${meme.id}`}>
                    "{meme.prompt}"
                  </p>
                  {meme.overlayText && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      Text: "{meme.overlayText}"
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-4">
                    <MemeVoteButtons meme={meme} />
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Eye className="h-3 w-3" />
                    <span>{meme.views || 0} views</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {totalMemePages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMemePage(memePage - 1)}
            disabled={memePage <= 1}
            data-testid="button-meme-prev"
          >
            Previous
          </Button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalMemePages) }, (_, i) => {
              const pageNum = memePage <= 3 ? i + 1 : memePage - 2 + i;
              if (pageNum > totalMemePages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === memePage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMemePage(pageNum)}
                  className="w-8 h-8 p-0"
                  data-testid={`button-meme-page-${pageNum}`}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMemePage(memePage + 1)}
            disabled={memePage >= totalMemePages}
            data-testid="button-meme-next"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );

  // NFT Listing Mutation with $1 fee
  const listNFTMutation = useMutation({
    mutationFn: async ({ nftId, minPrice, auctionEndDate }: { nftId: string, minPrice: string, auctionEndDate?: string }) => {
      const response = await fetch('/api/marketplace/nft/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nftId, 
          minPrice: parseFloat(minPrice),
          auctionEndDate,
          listingFee: 1 // $1 worth of tokens
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to list NFT');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/nft/listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/nft/platform-listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/nft/user-generated-listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/nfts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/token/balance'] });
      toast({
        title: "Success!",
        description: data.message || "NFT listed for sale successfully",
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
      const response = await fetch(`/api/marketplace/meme/${memeId}/like`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to like meme');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/meme/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/meme/leaderboard'] });
      toast({
        title: "Liked!",
        description: "You liked this meme",
      });
    },
  });

  // Meme Dislike Mutation
  const dislikeMutation = useMutation({
    mutationFn: async (memeId: string) => {
      const response = await fetch(`/api/marketplace/meme/${memeId}/dislike`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to dislike meme');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/meme/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/meme/leaderboard'] });
      toast({
        title: "Disliked!",
        description: "You disliked this meme",
      });
    },
  });

  // List NFT Dialog Component
  const ListNFTDialog = ({ nft, onClose }: { nft: any, onClose: () => void }) => {
    const [price, setPrice] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = () => {
      if (!price || parseFloat(price) <= 0) {
        toast({
          title: "Invalid Price",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        return;
      }

      if (!endDate) {
        toast({
          title: "End Date Required",
          description: "Please select when the auction should end",
          variant: "destructive",
        });
        return;
      }

      const auctionEndDate = new Date(endDate);
      if (auctionEndDate <= new Date()) {
        toast({
          title: "Invalid End Date",
          description: "Auction end date must be in the future",
          variant: "destructive",
        });
        return;
      }

      // Check if user has enough balance for $1 listing fee
      toast({
        title: "Listing NFT...",
        description: "Processing your NFT listing with $1 fee",
      });

      listNFTMutation.mutate({ 
        nftId: nft.nftId || nft.id, 
        minPrice: price,
        auctionEndDate: auctionEndDate.toISOString()
      });
      onClose();
      setPrice('');
      setEndDate('');
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
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-yellow-800">
              <Zap className="h-4 w-4" />
              <span className="font-medium">Listing Fee: $1.00 worth of tokens</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              This fee will be deducted from your balance when you list the NFT
            </p>
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
          <div className="space-y-2">
            <Label htmlFor="endDate">Auction End Date & Time</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            />
            <p className="text-xs text-gray-500">
              When the auction ends, the highest bidder will automatically win the NFT
            </p>
          </div>
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

  // Bidding Mutation
  const bidMutation = useMutation({
    mutationFn: async ({ listingId, bidAmount }: { listingId: string, bidAmount: string }) => {
      const response = await fetch('/api/marketplace/nft/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, bidAmount: parseFloat(bidAmount) }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place bid');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/nft/listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/nft/platform-listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/nft/user-generated-listings'] });
      toast({
        title: "Success!",
        description: "Your bid has been placed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place bid",
        variant: "destructive",
      });
    }
  });

  // Bid Dialog Component
  const BidDialog = ({ listing, nft, onClose }: { listing: any, nft: any, onClose?: () => void }) => {
    const [bidAmount, setBidAmount] = useState('');

    const handleSubmit = () => {
      const currentHighestBid = parseFloat(listing.currentHighestBid || "0");
      const minPrice = parseFloat(listing.minPrice);
      const requiredBid = Math.max(currentHighestBid + 0.01, minPrice);
      
      if (!bidAmount || parseFloat(bidAmount) < requiredBid) {
        toast({
          title: "Invalid Bid Amount",
          description: `Bid must be at least $${requiredBid.toFixed(2)}`,
          variant: "destructive",
        });
        return;
      }

      bidMutation.mutate({ 
        listingId: listing.id, 
        bidAmount 
      });
      setBidAmount('');
      if (onClose) onClose();
    };

    const currentHighestBid = parseFloat(listing.currentHighestBid || "0");
    const minPrice = parseFloat(listing.minPrice);
    const requiredBid = Math.max(currentHighestBid + 0.01, minPrice);

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
            {nft?.imageUrl ? (
              <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Star className="h-8 w-8 text-purple-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{nft?.name}</h3>
            <Badge variant="outline">{nft?.rarity || 'Common'}</Badge>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current Highest Bid:</span>
            <span className="font-medium">${currentHighestBid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Minimum Bid Required:</span>
            <span className="font-medium text-green-600">${requiredBid.toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-500">
            Platform fee: $1.00 (will be deducted from your balance)
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bidAmount">Your Bid Amount ($)</Label>
          <Input
            id="bidAmount"
            type="number"
            step="0.01"
            min={requiredBid}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder={`Enter at least $${requiredBid.toFixed(2)}`}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={bidMutation.isPending}
          >
            {bidMutation.isPending ? 'Placing Bid...' : 'Place Bid'}
          </Button>
        </div>
      </div>
    );
  };

  // Sale Details Dialog Component  
  const SaleDetailsDialog = ({ listing, nft, seller }: { listing: any, nft: any, seller: any }) => {
    const { data: listingBids = [] } = useQuery<any[]>({
      queryKey: [`/api/marketplace/nft/listing/${listing.id}/bids`],
    });

    const auctionEndDate = listing.auctionEndDate ? new Date(listing.auctionEndDate) : null;
    const isExpired = auctionEndDate && auctionEndDate <= new Date();

    return (
      <div className="space-y-6">
        {/* NFT Info */}
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
            {nft?.imageUrl ? (
              <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Star className="h-10 w-10 text-purple-400" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{nft?.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{nft?.rarity || 'Common'}</Badge>
              <Badge variant="secondary">
                {nft?.isUserGenerated ? 'User-Generated' : 'Limited Platform'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">Sold by: {seller?.name}</p>
          </div>
        </div>

        {/* Auction Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm text-gray-500">Minimum Price</span>
            <p className="font-semibold">${parseFloat(listing.minPrice).toFixed(2)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Current Highest Bid</span>
            <p className="font-semibold text-green-600">
              ${parseFloat(listing.currentHighestBid || "0").toFixed(2)}
            </p>
          </div>
          {auctionEndDate && (
            <>
              <div>
                <span className="text-sm text-gray-500">Auction Status</span>
                <p className={`font-semibold ${isExpired ? 'text-red-600' : 'text-blue-600'}`}>
                  {isExpired ? 'ENDED' : 'ACTIVE'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">
                  {isExpired ? 'Ended On' : 'Ends On'}
                </span>
                <p className="font-semibold">
                  {auctionEndDate.toLocaleDateString()} {auctionEndDate.toLocaleTimeString()}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Bid History */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            Bid History
          </h4>
          {listingBids.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No bids placed yet</p>
              <p className="text-sm">Be the first to bid on this NFT!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {listingBids.map((bidItem: any, index: number) => (
                <div
                  key={bidItem.bid.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    index === 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{bidItem.bidder.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(bidItem.bid.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${index === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      ${parseFloat(bidItem.bid.bidAmount).toFixed(2)}
                    </p>
                    {index === 0 && (
                      <Badge variant="default" className="text-xs">Highest Bid</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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