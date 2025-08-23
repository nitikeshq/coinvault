import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Heart, Eye, Share2, ShoppingCart, Gavel, Plus, Edit, Trash2, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NftListing {
  id: string;
  nftId: string;
  ownerId: string;
  price: string;
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  nft: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    rarity: string;
    attributes: any;
    isMinted: boolean;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

interface Bid {
  id: string;
  itemType: string;
  itemId: string;
  bidderId: string;
  amount: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  bidder: {
    id: string;
    name: string;
    email: string;
  };
}

interface UserNft {
  id: string;
  nftId: string;
  userId: string;
  acquiredAt: string;
  nft: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    rarity: string;
    attributes: any;
    isMinted: boolean;
  };
}

export default function NftMarketplace() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedNft, setSelectedNft] = useState<NftListing | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [listingDescription, setListingDescription] = useState("");
  const [selectedUserNft, setSelectedUserNft] = useState<UserNft | null>(null);

  // Fetch token configuration for symbol
  const { data: tokenConfig } = useQuery<{tokenSymbol: string}>({ 
    queryKey: ["/api/token/config"] 
  });
  const tokenSymbol = tokenConfig?.tokenSymbol || "ETH";

  // Fetch NFT listings
  const { data: nftListings = [], isLoading: loadingListings } = useQuery<NftListing[]>({
    queryKey: ["/api/marketplace/nfts"],
  });

  // Fetch user's NFTs
  const { data: userNfts = [], isLoading: loadingUserNfts } = useQuery<UserNft[]>({
    queryKey: ["/api/user/nfts"],
    enabled: !!user,
  });

  // Fetch bids for selected NFT
  const { data: nftBids = [], refetch: refetchBids } = useQuery<Bid[]>({
    queryKey: ["/api/bids/nft", selectedNft?.id],
    enabled: !!selectedNft,
  });

  // Create bid mutation
  const createBidMutation = useMutation({
    mutationFn: async (bidData: { itemType: string; itemId: string; amount: string }) => {
      const response = await apiRequest("POST", "/api/bids", bidData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bid placed successfully!" });
      refetchBids();
      setBidAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place bid",
        variant: "destructive",
      });
    },
  });

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: async (listingData: { nftId: string; price: string; description: string }) => {
      const response = await apiRequest("POST", "/api/marketplace/nfts", listingData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "NFT listed successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/nfts"] });
      setSelectedUserNft(null);
      setListingPrice("");
      setListingDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to list NFT",
        variant: "destructive",
      });
    },
  });

  const handlePlaceBid = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to place bids on NFTs.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedNft || !bidAmount) return;
    
    createBidMutation.mutate({
      itemType: "nft",
      itemId: selectedNft.id,
      amount: bidAmount,
    });
  };

  const handleListNft = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to list your NFTs for sale.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedUserNft || !listingPrice) return;
    
    createListingMutation.mutate({
      nftId: selectedUserNft.nftId,
      price: listingPrice,
      description: listingDescription,
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'bg-yellow-500';
      case 'epic': return 'bg-purple-500';
      case 'rare': return 'bg-blue-500';
      case 'uncommon': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // SEO Configuration
  const seoConfig = {
    title: `NFT Marketplace - Trade Digital Collectibles with ${tokenSymbol} | CryptoWallet Pro`,
    description: `Discover, buy, and sell unique NFTs on our exclusive marketplace. Trade digital collectibles securely with ${tokenSymbol} tokens. ${nftListings.length} NFTs available now.`,
    keywords: ["nft marketplace", "digital collectibles", `${tokenSymbol} nft`, "crypto art", "blockchain collectibles", "nft trading", "digital assets"],
    image: selectedNft?.nft.imageUrl ? (selectedNft.nft.imageUrl.startsWith('http') ? selectedNft.nft.imageUrl : `${window.location.origin}${selectedNft.nft.imageUrl}`) : undefined,
    type: 'website' as const
  };

  // Update SEO when selected NFT changes
  useEffect(() => {
    if (selectedNft) {
      document.title = `${selectedNft.nft.name} - ${selectedNft.price} ${tokenSymbol} | NFT Marketplace`;
    }
  }, [selectedNft, tokenSymbol]);

  // Update document title for SEO
  useEffect(() => {
    document.title = seoConfig.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', seoConfig.description);
    }
  }, [seoConfig.title, seoConfig.description]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">NFT Marketplace</h1>
          <p className="text-gray-300">Discover, collect, and trade unique digital assets</p>
        </div>

        <Tabs defaultValue="marketplace" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger value="marketplace" className="text-white data-[state=active]:bg-purple-600">
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="my-nfts" className="text-white data-[state=active]:bg-purple-600">
              My NFTs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="mt-6">
            {loadingListings ? (
              <div className="text-white text-center py-8">Loading NFTs...</div>
            ) : nftListings.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No NFTs listed for sale</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {nftListings.map((listing) => (
                  <Card key={listing.id} className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors" data-testid={`nft-card-${listing.id}`}>
                    <CardHeader className="p-4">
                      <div className="aspect-square relative overflow-hidden rounded-lg mb-3">
                        <img
                          src={listing.nft.imageUrl.startsWith('/') ? listing.nft.imageUrl : `/NFTS/${listing.nft.imageUrl}`}
                          alt={listing.nft.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-nft.png';
                          }}
                        />
                        <Badge className={`absolute top-2 right-2 ${getRarityColor(listing.nft.rarity)} text-white`}>
                          {listing.nft.rarity}
                        </Badge>
                      </div>
                      <CardTitle className="text-white text-lg truncate">{listing.nft.name}</CardTitle>
                      <CardDescription className="text-gray-400 text-sm line-clamp-2">
                        {listing.description || listing.nft.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Price</p>
                          <p className="text-white font-bold text-lg">{listing.price} {tokenSymbol}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">Owner</p>
                          <p className="text-white text-sm truncate">{listing.owner.name}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={() => setSelectedNft(listing)}
                            data-testid={`view-nft-${listing.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl">{selectedNft?.nft.name}</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Owned by {selectedNft?.owner.name}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedNft && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <img
                                  src={selectedNft.nft.imageUrl.startsWith('/') ? selectedNft.nft.imageUrl : `/NFTS/${selectedNft.nft.imageUrl}`}
                                  alt={selectedNft.nft.name}
                                  className="w-full aspect-square object-cover rounded-lg"
                                />
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Description</h4>
                                  <p className="text-gray-300">{selectedNft.description || selectedNft.nft.description}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Price</h4>
                                  <p className="text-2xl font-bold text-purple-400">{selectedNft.price} {tokenSymbol}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Rarity</h4>
                                  <Badge className={`${getRarityColor(selectedNft.nft.rarity)} text-white`}>
                                    {selectedNft.nft.rarity}
                                  </Badge>
                                </div>
                                {(!user || user.id !== selectedNft.ownerId) && (
                                  <div className="space-y-3">
                                    <h4 className="font-semibold">Place a Bid</h4>
                                    {isAuthenticated ? (
                                      <>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder={`Enter bid amount (${tokenSymbol})`}
                                          value={bidAmount}
                                          onChange={(e) => setBidAmount(e.target.value)}
                                          className="bg-slate-700 border-slate-600 text-white"
                                          data-testid="bid-amount-input"
                                        />
                                        <Button
                                          onClick={handlePlaceBid}
                                          disabled={!bidAmount || createBidMutation.isPending}
                                          className="w-full bg-purple-600 hover:bg-purple-700"
                                          data-testid="place-bid-button"
                                        >
                                          <Gavel className="w-4 h-4 mr-2" />
                                          {createBidMutation.isPending ? "Placing Bid..." : "Place Bid"}
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        onClick={() => window.location.href = '/api/login'}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        data-testid="login-to-bid-button"
                                      >
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Login to Place Bid
                                      </Button>
                                    )}
                                  </div>
                                )}
                                {nftBids.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Current Bids</h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                      {nftBids.map((bid) => (
                                        <div key={bid.id} className="flex justify-between items-center bg-slate-700 p-2 rounded">
                                          <span className="text-sm">{bid.bidder.name}</span>
                                          <span className="font-semibold">{bid.amount} {tokenSymbol}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-nfts" className="mt-6">
            {!user ? (
              <div className="text-gray-400 text-center py-8">Please log in to view your NFTs</div>
            ) : loadingUserNfts ? (
              <div className="text-white text-center py-8">Loading your NFTs...</div>
            ) : userNfts.length === 0 ? (
              <div className="text-gray-400 text-center py-8">You don't own any NFTs yet</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userNfts.map((userNft) => (
                  <Card key={userNft.id} className="bg-slate-800 border-slate-700" data-testid={`my-nft-card-${userNft.id}`}>
                    <CardHeader className="p-4">
                      <div className="aspect-square relative overflow-hidden rounded-lg mb-3">
                        <img
                          src={userNft.nft.imageUrl.startsWith('/') ? userNft.nft.imageUrl : `/NFTS/${userNft.nft.imageUrl}`}
                          alt={userNft.nft.name}
                          className="w-full h-full object-cover"
                        />
                        <Badge className={`absolute top-2 right-2 ${getRarityColor(userNft.nft.rarity)} text-white`}>
                          {userNft.nft.rarity}
                        </Badge>
                      </div>
                      <CardTitle className="text-white text-lg truncate">{userNft.nft.name}</CardTitle>
                      <CardDescription className="text-gray-400 text-sm line-clamp-2">
                        {userNft.nft.description}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => setSelectedUserNft(userNft)}
                            data-testid={`list-nft-${userNft.id}`}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            List for Sale
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700 text-white">
                          <DialogHeader>
                            <DialogTitle>List NFT for Sale</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Set a price for your {selectedUserNft?.nft.name}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedUserNft && (
                            <div className="space-y-4">
                              <div className="flex items-center space-x-4">
                                <img
                                  src={selectedUserNft.nft.imageUrl.startsWith('/') ? selectedUserNft.nft.imageUrl : `/NFTS/${selectedUserNft.nft.imageUrl}`}
                                  alt={selectedUserNft.nft.name}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                                <div>
                                  <h4 className="font-semibold">{selectedUserNft.nft.name}</h4>
                                  <Badge className={`${getRarityColor(selectedUserNft.nft.rarity)} text-white`}>
                                    {selectedUserNft.nft.rarity}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">Price ({tokenSymbol})</label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={listingPrice}
                                  onChange={(e) => setListingPrice(e.target.value)}
                                  className="bg-slate-700 border-slate-600 text-white"
                                  data-testid="listing-price-input"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                                <Input
                                  placeholder="Add a description for your listing..."
                                  value={listingDescription}
                                  onChange={(e) => setListingDescription(e.target.value)}
                                  className="bg-slate-700 border-slate-600 text-white"
                                  data-testid="listing-description-input"
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button
                              onClick={handleListNft}
                              disabled={!listingPrice || createListingMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid="confirm-listing-button"
                            >
                              {createListingMutation.isPending ? "Listing..." : "List NFT"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}