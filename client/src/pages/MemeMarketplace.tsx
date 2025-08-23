import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Heart, Eye, Share2, Download, ShoppingCart, Gavel, Plus, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MemeListing {
  id: string;
  memeId: string;
  ownerId: string;
  price: string;
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  meme: {
    id: string;
    prompt: string;
    style: string;
    generatedDescription: string;
    imageUrl: string;
    status: string;
    cost: string;
    createdAt: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

interface MemeStats {
  id: string;
  memeId: string;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  downloadCount: number;
  updatedAt: string;
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

interface UserMeme {
  id: string;
  prompt: string;
  style: string;
  generatedDescription: string;
  imageUrl: string;
  status: string;
  cost: string;
  createdAt: string;
}

export default function MemeMarketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMeme, setSelectedMeme] = useState<MemeListing | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [listingDescription, setListingDescription] = useState("");
  const [selectedUserMeme, setSelectedUserMeme] = useState<UserMeme | null>(null);
  const [memeStats, setMemeStats] = useState<Record<string, MemeStats>>({});

  // Fetch Meme listings
  const { data: memeListings = [], isLoading: loadingListings } = useQuery<MemeListing[]>({
    queryKey: ["/api/marketplace/memes"],
  });

  // Fetch user's memes
  const { data: userMemes = [], isLoading: loadingUserMemes } = useQuery<UserMeme[]>({
    queryKey: ["/api/user/memes"],
    enabled: !!user,
  });

  // Fetch bids for selected meme
  const { data: memeBids = [], refetch: refetchBids } = useQuery<Bid[]>({
    queryKey: ["/api/bids/meme", selectedMeme?.id],
    enabled: !!selectedMeme,
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
    mutationFn: async (listingData: { memeId: string; price: string; description: string }) => {
      const response = await apiRequest("POST", "/api/marketplace/memes", listingData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Meme listed successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/memes"] });
      setSelectedUserMeme(null);
      setListingPrice("");
      setListingDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to list meme",
        variant: "destructive",
      });
    },
  });

  // Social interaction mutations
  const recordViewMutation = useMutation({
    mutationFn: async (memeId: string) => {
      await apiRequest("POST", `/api/memes/${memeId}/view`);
    },
  });

  const recordShareMutation = useMutation({
    mutationFn: async (memeId: string) => {
      await apiRequest("POST", `/api/memes/${memeId}/share`);
    },
    onSuccess: () => {
      toast({ title: "Shared!", description: "Share recorded successfully" });
    },
  });

  const recordDownloadMutation = useMutation({
    mutationFn: async (memeId: string) => {
      await apiRequest("POST", `/api/memes/${memeId}/download`);
    },
    onSuccess: () => {
      toast({ title: "Downloaded!", description: "Download recorded successfully" });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (memeId: string) => {
      const response = await apiRequest("POST", `/api/memes/${memeId}/like`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: data.liked ? "Liked!" : "Unliked!", 
        description: data.message 
      });
      // Refresh stats
      fetchMemeStats(selectedMeme?.memeId || "");
    },
  });

  const fetchMemeStats = async (memeId: string) => {
    try {
      const response = await apiRequest("GET", `/api/memes/${memeId}/stats`);
      const stats = await response.json();
      setMemeStats(prev => ({ ...prev, [memeId]: stats }));
    } catch (error) {
      console.error("Failed to fetch meme stats:", error);
    }
  };

  const handlePlaceBid = () => {
    if (!selectedMeme || !bidAmount) return;
    
    createBidMutation.mutate({
      itemType: "meme",
      itemId: selectedMeme.id,
      amount: bidAmount,
    });
  };

  const handleListMeme = () => {
    if (!selectedUserMeme || !listingPrice) return;
    
    createListingMutation.mutate({
      memeId: selectedUserMeme.id,
      price: listingPrice,
      description: listingDescription,
    });
  };

  const handleViewMeme = (meme: MemeListing) => {
    setSelectedMeme(meme);
    recordViewMutation.mutate(meme.memeId);
    fetchMemeStats(meme.memeId);
  };

  const handleShare = (memeId: string) => {
    recordShareMutation.mutate(memeId);
    // Copy share URL to clipboard
    const shareUrl = `${window.location.origin}/public/meme/${memeId}`;
    navigator.clipboard.writeText(shareUrl);
  };

  const handleDownload = (meme: MemeListing) => {
    recordDownloadMutation.mutate(meme.memeId);
    // Trigger download
    const link = document.createElement('a');
    link.href = meme.meme.imageUrl.startsWith('/') ? meme.meme.imageUrl : `/memes_images/${meme.meme.imageUrl}`;
    link.download = `meme-${meme.meme.id}.png`;
    link.click();
  };

  const getStyleColor = (style: string) => {
    switch (style.toLowerCase()) {
      case 'funny': return 'bg-yellow-500';
      case 'sarcastic': return 'bg-red-500';
      case 'wholesome': return 'bg-green-500';
      case 'dark': return 'bg-gray-700';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Meme Marketplace</h1>
          <p className="text-gray-300">Share laughs, trade memes, and spread joy</p>
        </div>

        <Tabs defaultValue="marketplace" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger value="marketplace" className="text-white data-[state=active]:bg-purple-600">
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="my-memes" className="text-white data-[state=active]:bg-purple-600">
              My Memes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="mt-6">
            {loadingListings ? (
              <div className="text-white text-center py-8">Loading memes...</div>
            ) : memeListings.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No memes listed for sale</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {memeListings.map((listing) => (
                  <Card key={listing.id} className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors" data-testid={`meme-card-${listing.id}`}>
                    <CardHeader className="p-4">
                      <div className="aspect-square relative overflow-hidden rounded-lg mb-3">
                        <img
                          src={listing.meme.imageUrl.startsWith('/') ? listing.meme.imageUrl : `/memes_images/${listing.meme.imageUrl}`}
                          alt={listing.meme.generatedDescription}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => handleViewMeme(listing)}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-meme.png';
                          }}
                        />
                        <Badge className={`absolute top-2 right-2 ${getStyleColor(listing.meme.style)} text-white`}>
                          {listing.meme.style}
                        </Badge>
                        <div className="absolute bottom-2 left-2 flex space-x-2">
                          <div className="bg-black bg-opacity-50 rounded px-2 py-1 text-white text-xs flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {memeStats[listing.memeId]?.viewCount || 0}
                          </div>
                          <div className="bg-black bg-opacity-50 rounded px-2 py-1 text-white text-xs flex items-center">
                            <Heart className="w-3 h-3 mr-1" />
                            {memeStats[listing.memeId]?.likeCount || 0}
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-white text-lg line-clamp-2">{listing.meme.generatedDescription}</CardTitle>
                      <CardDescription className="text-gray-400 text-sm line-clamp-1">
                        {listing.description || `"${listing.meme.prompt}"`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Price</p>
                          <p className="text-white font-bold text-lg">{listing.price} ETH</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">Creator</p>
                          <p className="text-white text-sm truncate">{listing.owner.name}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 space-y-2">
                      <div className="flex space-x-2 w-full">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                          onClick={() => handleShare(listing.memeId)}
                          data-testid={`share-meme-${listing.id}`}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                          onClick={() => handleDownload(listing)}
                          data-testid={`download-meme-${listing.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                          onClick={() => toggleLikeMutation.mutate(listing.memeId)}
                          data-testid={`like-meme-${listing.id}`}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleViewMeme(listing)}
                            data-testid={`view-meme-${listing.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl">{selectedMeme?.meme.generatedDescription}</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Created by {selectedMeme?.owner.name}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedMeme && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <img
                                  src={selectedMeme.meme.imageUrl.startsWith('/') ? selectedMeme.meme.imageUrl : `/memes_images/${selectedMeme.meme.imageUrl}`}
                                  alt={selectedMeme.meme.generatedDescription}
                                  className="w-full aspect-square object-cover rounded-lg"
                                />
                                <div className="flex justify-center space-x-4 mt-4">
                                  <div className="text-center">
                                    <div className="text-lg font-bold">{memeStats[selectedMeme.memeId]?.viewCount || 0}</div>
                                    <div className="text-sm text-gray-400">Views</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold">{memeStats[selectedMeme.memeId]?.likeCount || 0}</div>
                                    <div className="text-sm text-gray-400">Likes</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold">{memeStats[selectedMeme.memeId]?.shareCount || 0}</div>
                                    <div className="text-sm text-gray-400">Shares</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold">{memeStats[selectedMeme.memeId]?.downloadCount || 0}</div>
                                    <div className="text-sm text-gray-400">Downloads</div>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Original Prompt</h4>
                                  <p className="text-gray-300">"{selectedMeme.meme.prompt}"</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Price</h4>
                                  <p className="text-2xl font-bold text-purple-400">{selectedMeme.price} ETH</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Style</h4>
                                  <Badge className={`${getStyleColor(selectedMeme.meme.style)} text-white`}>
                                    {selectedMeme.meme.style}
                                  </Badge>
                                </div>
                                {user && user.id !== selectedMeme.ownerId && (
                                  <div className="space-y-3">
                                    <h4 className="font-semibold">Place a Bid</h4>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="Enter bid amount (ETH)"
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
                                  </div>
                                )}
                                {memeBids.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Current Bids</h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                      {memeBids.map((bid) => (
                                        <div key={bid.id} className="flex justify-between items-center bg-slate-700 p-2 rounded">
                                          <span className="text-sm">{bid.bidder.name}</span>
                                          <span className="font-semibold">{bid.amount} ETH</span>
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

          <TabsContent value="my-memes" className="mt-6">
            {!user ? (
              <div className="text-gray-400 text-center py-8">Please log in to view your memes</div>
            ) : loadingUserMemes ? (
              <div className="text-white text-center py-8">Loading your memes...</div>
            ) : userMemes.length === 0 ? (
              <div className="text-gray-400 text-center py-8">You haven't generated any memes yet</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userMemes.map((meme) => (
                  <Card key={meme.id} className="bg-slate-800 border-slate-700" data-testid={`my-meme-card-${meme.id}`}>
                    <CardHeader className="p-4">
                      <div className="aspect-square relative overflow-hidden rounded-lg mb-3">
                        <img
                          src={meme.imageUrl.startsWith('/') ? meme.imageUrl : `/memes_images/${meme.imageUrl}`}
                          alt={meme.generatedDescription}
                          className="w-full h-full object-cover"
                        />
                        <Badge className={`absolute top-2 right-2 ${getStyleColor(meme.style)} text-white`}>
                          {meme.style}
                        </Badge>
                      </div>
                      <CardTitle className="text-white text-lg line-clamp-2">{meme.generatedDescription}</CardTitle>
                      <CardDescription className="text-gray-400 text-sm line-clamp-1">
                        "{meme.prompt}"
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => setSelectedUserMeme(meme)}
                            data-testid={`list-meme-${meme.id}`}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            List for Sale
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700 text-white">
                          <DialogHeader>
                            <DialogTitle>List Meme for Sale</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Set a price for your meme
                            </DialogDescription>
                          </DialogHeader>
                          {selectedUserMeme && (
                            <div className="space-y-4">
                              <div className="flex items-center space-x-4">
                                <img
                                  src={selectedUserMeme.imageUrl.startsWith('/') ? selectedUserMeme.imageUrl : `/memes_images/${selectedUserMeme.imageUrl}`}
                                  alt={selectedUserMeme.generatedDescription}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                                <div>
                                  <h4 className="font-semibold">{selectedUserMeme.generatedDescription}</h4>
                                  <Badge className={`${getStyleColor(selectedUserMeme.style)} text-white`}>
                                    {selectedUserMeme.style}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">Price (ETH)</label>
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
                              onClick={handleListMeme}
                              disabled={!listingPrice || createListingMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid="confirm-listing-button"
                            >
                              {createListingMutation.isPending ? "Listing..." : "List Meme"}
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
  );
}