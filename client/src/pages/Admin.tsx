import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Sparkles, Users, Send, Minus, Image, Coins, Video, Gift, Settings } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { formatDistanceToNow } from "date-fns";

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Token Configuration State
  const [tokenConfig, setTokenConfig] = useState({
    contractAddress: "",
    tokenName: "",
    tokenSymbol: "",
    decimals: 18,
  });

  // News Article State
  const [newsForm, setNewsForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    externalUrl: "",
    category: "",
    isPublished: true,
  });

  // Social Link State
  const [socialForm, setSocialForm] = useState({
    platform: "",
    url: "",
    isActive: true,
  });

  // Website Settings State
  const [websiteSettings, setWebsiteSettings] = useState({
    siteName: "",
    logoUrl: "",
    faviconUrl: "",
    description: "",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    auditReportUrl: "",
    whitepaperUrl: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });

  // Fetch data
  const { data: currentConfig } = useQuery<any>({
    queryKey: ['/api/token/config'],
  });

  const { data: deposits = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/deposits'],
  });

  const { data: allNews = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/news'],
  });

  const { data: allSocialLinks = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/social-links'],
  });

  const { data: currentWebsiteSettings } = useQuery<any>({
    queryKey: ['/api/website/settings'],
  });

  // Update token config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('PUT', '/api/admin/token/config', data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Token configuration updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/token/config'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to update token configuration", variant: "destructive" });
    },
  });

  // Website settings mutation
  const updateWebsiteSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('PUT', '/api/admin/website/settings', data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Website settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/website/settings'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to update website settings", variant: "destructive" });
    },
  });

  // Update deposit status mutation
  const updateDepositMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      await apiRequest('PUT', `/api/admin/deposits/${id}`, { status, adminNotes });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Deposit status updated successfully" });
      // Invalidate admin deposits cache
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deposits'] });
      // Invalidate user balance caches to reflect credited tokens
      queryClient.invalidateQueries({ queryKey: ['/api/user/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/token/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      // Invalidate presale progress (affected by approved deposits)
      queryClient.invalidateQueries({ queryKey: ['/api/presale/progress'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to update deposit status", variant: "destructive" });
    },
  });

  // Create news article mutation
  const createNewsMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/admin/news', data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "News article created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/news'] });
      setNewsForm({
        title: "",
        description: "",
        imageUrl: "",
        externalUrl: "",
        category: "",
        isPublished: true,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to create news article", variant: "destructive" });
    },
  });

  // Create/update social link mutation
  const saveSocialLinkMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/admin/social-links', data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Social link saved successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/social-links'] });
      setSocialForm({ platform: "", url: "", isActive: true });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to save social link", variant: "destructive" });
    },
  });

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfigMutation.mutate(tokenConfig);
  };

  const handleWebsiteSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWebsiteSettingsMutation.mutate(websiteSettings);
  };

  const handleNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNewsMutation.mutate(newsForm);
  };

  const handleSocialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSocialLinkMutation.mutate(socialForm);
  };

  const handleDepositAction = (id: string, status: string, adminNotes?: string) => {
    updateDepositMutation.mutate({ id, status, adminNotes });
  };

  // Load current config when available
  useEffect(() => {
    if (currentConfig) {
      setTokenConfig({
        contractAddress: currentConfig.contractAddress || "",
        tokenName: currentConfig.tokenName || "",
        tokenSymbol: currentConfig.tokenSymbol || "",
        decimals: currentConfig.decimals || 18,
      });
    }
  }, [currentConfig]);

  // Load current website settings when available
  useEffect(() => {
    if (currentWebsiteSettings) {
      setWebsiteSettings({
        siteName: currentWebsiteSettings.siteName || "",
        logoUrl: currentWebsiteSettings.logoUrl || "",
        faviconUrl: currentWebsiteSettings.faviconUrl || "",
        description: currentWebsiteSettings.description || "",
        primaryColor: currentWebsiteSettings.primaryColor || "#6366f1",
        secondaryColor: currentWebsiteSettings.secondaryColor || "#8b5cf6",
        auditReportUrl: currentWebsiteSettings.auditReportUrl || "",
        whitepaperUrl: currentWebsiteSettings.whitepaperUrl || "",
        seoTitle: currentWebsiteSettings.seoTitle || "",
        seoDescription: currentWebsiteSettings.seoDescription || "",
        seoKeywords: currentWebsiteSettings.seoKeywords || "",
      });
    }
  }, [currentWebsiteSettings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button onClick={() => window.location.href = "/"} variant="outline" className="border-gray-400 text-gray-900 hover:bg-gray-100" data-testid="button-back-home">
            Back to Home
          </Button>
        </div>

        <Tabs defaultValue="deposits" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 border border-gray-300">
            <TabsTrigger value="deposits" data-testid="tab-deposits" className="text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900">Deposits</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users" className="text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900">Users</TabsTrigger>
            <TabsTrigger value="feed" data-testid="tab-feed" className="text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900">Feed</TabsTrigger>
            <TabsTrigger value="nft-mint" data-testid="tab-nft-mint" className="text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900">NFT Mint</TabsTrigger>
          </TabsList>

          {/* Deposit Management */}
          <TabsContent value="deposits">
            <Card className="bg-white border-gray-300">
              <CardHeader>
                <CardTitle>Deposit Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deposits.map((deposit: any) => {
                      const tokenAmount = parseFloat(deposit.amount);

                    // USD price per token (falling back to ~1 USD if not set)
                    const tokenPrice = currentConfig?.defaultPriceUsd
                      ? parseFloat(currentConfig.defaultPriceUsd.toString())
                      : 0.999999;

                    // USD equivalent of the deposit
                    const usdEquivalent = (tokenAmount * tokenPrice).toFixed(2);

                    // Tokens to credit = token amount
                    const tokensToCredit = tokenAmount.toFixed(6);

                    let originalAmount = '';
                    if (deposit.paymentMethod === 'upi' && deposit.originalAmount) {
                      originalAmount = `₹${deposit.originalAmount} INR → `;
                    }
                    return (
    <div
      key={deposit.id}
      className="border border-gray-400 rounded-lg p-4"
      data-testid={`deposit-${deposit.id}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {deposit.paymentMethod?.toUpperCase() || 'BSC'}
            </Badge>
            <Badge
              variant={
                deposit.status === 'approved'
                  ? 'default'
                  : deposit.status === 'rejected'
                  ? 'destructive'
                  : 'secondary'
              }
              data-testid={`badge-status-${deposit.id}`}
            >
              {deposit.status}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-gray-900">
              {originalAmount}${usdEquivalent} USD
            </p>
            <p className="text-sm text-green-400">
              → {tokensToCredit} tokens will be credited
            </p>
            <p className="text-sm text-gray-600">User: {deposit.userId}</p>
            <p className="text-sm text-gray-600">
              Date: {new Date(deposit.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {deposit.transactionHash && (
        <p className="text-sm text-gray-600 mb-3">
          Hash: {deposit.transactionHash}
        </p>
      )}

      {deposit.status === 'pending' && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleDepositAction(deposit.id, 'approved')}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={updateDepositMutation.isPending}
            data-testid={`button-approve-${deposit.id}`}
          >
            {updateDepositMutation.isPending ? 'Processing...' : 'Approve'}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDepositAction(deposit.id, 'rejected')}
            disabled={updateDepositMutation.isPending}
            data-testid={`button-reject-${deposit.id}`}
          >
            {updateDepositMutation.isPending ? 'Processing...' : 'Reject'}
          </Button>
        </div>
      )}
    </div>
  );
})}
{deposits.length === 0 && (
  <p className="text-gray-600 text-center py-8">
    No deposit requests found
  </p>
)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users">
            <UsersManagementPanel />
          </TabsContent>

          {/* Feed Management */}
          <TabsContent value="feed">
            <FeedManagementPanel />
          </TabsContent>

          {/* NFT Admin Minting */}
          <TabsContent value="nft-mint">
            <NFTMintingPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Users Management Panel Component
function UsersManagementPanel() {
  const { toast } = useToast();
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenReason, setTokenReason] = useState("");

  // Fetch users
  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  // Send tokens mutation
  const sendTokensMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/send-tokens`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setTokenAmount("");
      setTokenReason("");
      toast({
        title: "Success",
        description: "Tokens sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deduct tokens mutation
  const deductTokensMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/deduct-tokens`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setTokenAmount("");
      setTokenReason("");
      toast({
        title: "Success",
        description: "Tokens deducted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendTokens = (userId: string) => {
    const amount = parseFloat(tokenAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    sendTokensMutation.mutate({ userId, amount, reason: tokenReason });
  };

  const handleDeductTokens = (userId: string) => {
    const amount = parseFloat(tokenAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    deductTokensMutation.mutate({ userId, amount, reason: tokenReason });
  };

  if (isLoading) {
    return (
      <Card className="bg-white border-gray-300">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-gray-900">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Management</span>
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Manage user accounts and token balances. Users can add their BEP-20 withdrawal address in their profile.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user: any) => (
              <div key={user.id} className="bg-white rounded-lg p-4 border border-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <div className="font-medium text-gray-900">{user.name || user.email}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    {user.isAdmin && (
                      <Badge variant="secondary" className="mt-1">Admin</Badge>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Token Balance</div>
                    <div className="font-bold text-lg text-gray-900">
                      {parseFloat(user.balance?.balance || "0").toFixed(2)} {currentConfig?.tokenSymbol || "TOKEN"}
                    </div>
                    <div className="text-xs text-gray-500">
                      ${(parseFloat(user.balance?.balance || "0") * 0.999999).toFixed(2)} USD
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      className="bg-white border-gray-400 text-sm"
                      data-testid={`input-amount-${user.id}`}
                    />
                    <Input
                      placeholder="Reason"
                      value={tokenReason}
                      onChange={(e) => setTokenReason(e.target.value)}
                      className="bg-white border-gray-400 text-sm"
                      data-testid={`input-reason-${user.id}`}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleSendTokens(user.id)}
                      disabled={sendTokensMutation.isPending || !tokenAmount}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid={`button-send-${user.id}`}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeductTokens(user.id)}
                      disabled={deductTokensMutation.isPending || !tokenAmount}
                      data-testid={`button-deduct-${user.id}`}
                    >
                      <Minus className="h-3 w-3 mr-1" />
                      Deduct
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-gray-600 text-center py-8">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// NFT Minting Panel Component  
function NFTMintingPanel() {
  const { toast } = useToast();
  const [nftTheme, setNftTheme] = useState("");
  const [nftRarity, setNftRarity] = useState("Common");
  const [nftQuantity, setNftQuantity] = useState(1);
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [isUploadingReference, setIsUploadingReference] = useState(false);

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Error", 
        description: "Image size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingReference(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload/reference-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      setReferenceImageUrl(result.url);
      
      toast({
        title: "Success",
        description: "Reference image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingReference(false);
    }
  };

  const mintNftMutation = useMutation({
    mutationFn: async ({ theme, rarity, quantity, referenceImageUrl }: { 
      theme: string; 
      rarity: string; 
      quantity: number;
      referenceImageUrl?: string;
    }) => {
      return apiRequest("POST", "/api/admin/mint-nft", { theme, rarity, quantity, referenceImageUrl });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: `Successfully minted ${nftQuantity} NFT(s) with AI-generated descriptions`,
      });
      setNftTheme("");
      setNftRarity("Common");
      setNftQuantity(1);
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMintNft = () => {
    if (!nftTheme.trim()) {
      toast({
        title: "Error",
        description: "Please enter a theme for the NFT",
        variant: "destructive",
      });
      return;
    }
    
    mintNftMutation.mutate({ 
      theme: nftTheme.trim(), 
      rarity: nftRarity,
      quantity: nftQuantity,
      referenceImageUrl: referenceImageUrl || undefined
    });
  };

  return (
    <Card className="bg-white border-gray-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Image className="h-5 w-5" />
          <span>Admin NFT Minting</span>
        </CardTitle>
        <p className="text-gray-600 text-sm">
          Mint NFTs with AI-generated descriptions. These will be stored in the database and can be moved to blockchain post-presale.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="nft-theme">NFT Theme</Label>
              <Input
                id="nft-theme"
                placeholder="e.g., Mystical Dragons, Cyber Punks, Abstract Art..."
                value={nftTheme}
                onChange={(e) => setNftTheme(e.target.value)}
                className="bg-white border-gray-400"
                data-testid="input-nft-theme"
              />
              <p className="text-xs text-gray-600 mt-1">
                AI will generate unique descriptions based on this theme
              </p>
            </div>
            
            <div>
              <Label htmlFor="nft-rarity">Rarity</Label>
              <Select value={nftRarity} onValueChange={setNftRarity}>
                <SelectTrigger className="bg-white border-gray-400" data-testid="select-nft-rarity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Common">Common</SelectItem>
                  <SelectItem value="Rare">Rare</SelectItem>
                  <SelectItem value="Epic">Epic</SelectItem>
                  <SelectItem value="Legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="nft-quantity">Quantity</Label>
              <Input
                id="nft-quantity"
                type="number"
                min="1"
                max="100"
                value={nftQuantity}
                onChange={(e) => setNftQuantity(parseInt(e.target.value) || 1)}
                className="bg-white border-gray-400"
                data-testid="input-nft-quantity"
              />
              <p className="text-xs text-gray-600 mt-1">
                Generate multiple NFTs with the same theme (max 100)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Reference Image (Optional)</Label>
              <input
                type="file"
                accept="image/*"
                onChange={handleReferenceImageUpload}
                disabled={isUploadingReference}
                className="block w-full text-sm text-gray-900 border border-gray-400 rounded-lg cursor-pointer bg-white focus:outline-none"
              />
              <p className="text-xs text-gray-600 mt-1">
                Upload a reference image for AI to generate similar styled NFTs
              </p>
            </div>
            
            {referenceImageUrl && (
              <div className="border border-gray-400 rounded-lg p-2">
                <img 
                  src={referenceImageUrl} 
                  alt="Reference" 
                  className="w-full h-32 object-cover rounded"
                />
                <div className="text-xs text-green-600 mt-1">✓ Reference uploaded</div>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-300">
            <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Theme:</span> {nftTheme || "Not set"}</div>
              <div><span className="text-gray-600">Rarity:</span> {nftRarity}</div>
              <div><span className="text-gray-600">Quantity:</span> {nftQuantity}</div>
              <div><span className="text-gray-600">Collection:</span> NFTs</div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-xs text-blue-600 mb-1">ℹ️ AI Generation</div>
              <div className="text-xs text-gray-700">
                Each NFT will get a unique AI-generated description based on the theme and rarity.
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-300">
          <Button 
            onClick={handleMintNft}
            disabled={mintNftMutation.isPending || !nftTheme.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-mint-nft"
          >
            {mintNftMutation.isPending ? "Minting..." : `Mint ${nftQuantity} NFT${nftQuantity > 1 ? 's' : ''} with AI`}
          </Button>
          
          <div className="mt-2 text-xs text-gray-600">
            NFTs will be stored in database for the presale. After presale ends, they can be deployed to blockchain.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Feed Management Panel Component
function FeedManagementPanel() {
  const { toast } = useToast();
  
  // Gift Management State
  const [showAddGiftModal, setShowAddGiftModal] = useState(false);
  const [editingGift, setEditingGift] = useState<any>(null);
  const [giftForm, setGiftForm] = useState({
    displayName: '',
    emoji: '',
    tokenCost: '',
    isActive: true,
  });

  // Feed Settings Query
  const { data: feedSettings } = useQuery({
    queryKey: ["/api/feed/settings"],
  });

  // Gift Types Query
  const { data: giftTypes = [] } = useQuery({
    queryKey: ["/api/admin/gift-types"],
  });

  // Storage Settings Query
  const { data: storageSettings } = useQuery({
    queryKey: ["/api/admin/storage-settings"],
  });

  // Feed Settings Update Mutation
  const updateFeedSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/admin/feed/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed/settings"] });
      toast({
        title: "Success",
        description: "Feed settings updated successfully",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to update feed settings",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update feed settings",
        variant: "destructive",
      });
    },
  });

  // Storage Settings Update Mutation
  const updateStorageSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/admin/storage-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/storage-settings"] });
      toast({
        title: "Success",
        description: "Storage settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update storage settings",
        variant: "destructive",
      });
    },
  });

  // Gift Type Mutations
  const giftMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingGift) {
        return apiRequest("PUT", `/api/admin/gift-types/${editingGift.id}`, data);
      } else {
        return apiRequest("POST", "/api/admin/gift-types", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/gift-types"] });
      setShowAddGiftModal(false);
      setEditingGift(null);
      setGiftForm({ displayName: '', emoji: '', tokenCost: '', isActive: true });
      toast({
        title: "Success",
        description: editingGift ? "Gift type updated successfully" : "Gift type created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to save gift type",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/gift-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/gift-types"] });
      setShowAddGiftModal(false);
      setEditingGift(null);
      setGiftForm({ displayName: '', emoji: '', tokenCost: '', isActive: true });
      toast({
        title: "Success",
        description: "Gift type deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete gift type",
        variant: "destructive",
      });
    },
  });

  const handleFeedToggle = (enabled: boolean) => {
    updateFeedSettingsMutation.mutate({
      isEnabled: enabled,
      requireApproval: feedSettings?.requireApproval,
      maxVideoDuration: feedSettings?.maxVideoDuration,
      maxVideoSize: feedSettings?.maxVideoSize,
      giftsEnabled: feedSettings?.giftsEnabled,
      liveStreamEnabled: feedSettings?.liveStreamEnabled,
    });
  };

  const handleApprovalToggle = (requireApproval: boolean) => {
    updateFeedSettingsMutation.mutate({
      isEnabled: feedSettings?.isEnabled,
      requireApproval,
      maxVideoDuration: feedSettings?.maxVideoDuration,
      maxVideoSize: feedSettings?.maxVideoSize,
      giftsEnabled: feedSettings?.giftsEnabled,
      liveStreamEnabled: feedSettings?.liveStreamEnabled,
    });
  };

  const handleGiftsToggle = (giftsEnabled: boolean) => {
    updateFeedSettingsMutation.mutate({
      isEnabled: feedSettings?.isEnabled,
      requireApproval: feedSettings?.requireApproval,
      maxVideoDuration: feedSettings?.maxVideoDuration,
      maxVideoSize: feedSettings?.maxVideoSize,
      giftsEnabled,
      liveStreamEnabled: feedSettings?.liveStreamEnabled,
    });
  };

  const handleStorageToggle = (useS3: boolean) => {
    updateStorageSettingsMutation.mutate({
      ...storageSettings,
      storageType: useS3 ? 's3' : 'local',
    });
  };

  const handleSaveGift = () => {
    const tokenCost = parseFloat(giftForm.tokenCost);
    if (!giftForm.displayName || !giftForm.emoji || !tokenCost || tokenCost <= 0) {
      toast({
        title: "Error",
        description: "Please fill all fields with valid values",
        variant: "destructive",
      });
      return;
    }

    giftMutation.mutate({
      name: giftForm.displayName.toLowerCase().replace(/\s+/g, '_'),
      displayName: giftForm.displayName,
      emoji: giftForm.emoji,
      tokenCost: tokenCost.toFixed(8),
      isActive: giftForm.isActive,
      sortOrder: editingGift?.sortOrder || ((giftTypes?.length || 0) + 1),
    });
  };

  const handleDeleteGift = () => {
    if (editingGift && confirm('Are you sure you want to delete this gift type?')) {
      deleteMutation.mutate(editingGift.id);
    }
  };

  // Load gift data when editing
  useEffect(() => {
    if (editingGift) {
      setGiftForm({
        displayName: editingGift.displayName,
        emoji: editingGift.emoji,
        tokenCost: parseFloat(editingGift.tokenCost).toString(),
        isActive: editingGift.isActive,
      });
    }
  }, [editingGift]);

  return (
    <div className="space-y-6">
      {/* Feed Settings Card */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="w-5 h-5" />
            <span>Feed Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Feed */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Enable Feed Feature</Label>
              <p className="text-xs text-gray-500">
                Controls whether the Feed tab appears in navigation
              </p>
            </div>
            <Switch
              checked={feedSettings?.isEnabled || false}
              onCheckedChange={handleFeedToggle}
              disabled={updateFeedSettingsMutation.isPending}
            />
          </div>

          {/* Require Approval */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Require Video Approval</Label>
              <p className="text-xs text-gray-500">
                Videos must be approved by admin before appearing in feed
              </p>
            </div>
            <Switch
              checked={feedSettings?.requireApproval || false}
              onCheckedChange={handleApprovalToggle}
              disabled={updateFeedSettingsMutation.isPending || !feedSettings?.isEnabled}
            />
          </div>

          {/* Enable Gifts */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Enable Gift System</Label>
              <p className="text-xs text-gray-500">
                Allow users to send token-based gifts to videos
              </p>
            </div>
            <Switch
              checked={feedSettings?.giftsEnabled || false}
              onCheckedChange={handleGiftsToggle}
              disabled={updateFeedSettingsMutation.isPending || !feedSettings?.isEnabled}
            />
          </div>

          {/* Video Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Video Duration (seconds)</Label>
              <Input
                type="number"
                value={feedSettings?.maxVideoDuration || 60}
                onChange={(e) => {
                  updateFeedSettingsMutation.mutate({
                    ...feedSettings,
                    maxVideoDuration: parseInt(e.target.value),
                  });
                }}
                min="10"
                max="300"
                disabled={updateFeedSettingsMutation.isPending || !feedSettings?.isEnabled}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Video Size (MB)</Label>
              <Input
                type="number"
                value={feedSettings?.maxVideoSize || 50}
                onChange={(e) => {
                  updateFeedSettingsMutation.mutate({
                    ...feedSettings,
                    maxVideoSize: parseInt(e.target.value),
                  });
                }}
                min="1"
                max="500"
                disabled={updateFeedSettingsMutation.isPending || !feedSettings?.isEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Settings Card */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Video Storage Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Use AWS S3 Storage</Label>
              <p className="text-xs text-gray-500">
                Store videos on AWS S3 (recommended) or local server
              </p>
            </div>
            <Switch
              checked={storageSettings?.storageType === 's3'}
              onCheckedChange={handleStorageToggle}
              disabled={updateStorageSettingsMutation.isPending}
            />
          </div>

          {storageSettings?.storageType === 's3' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium">S3 Bucket</Label>
                <Input
                  value={storageSettings?.s3BucketName || ''}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">S3 Region</Label>
                <Input
                  value={storageSettings?.s3Region || ''}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gift Types Management Card */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gift className="w-5 h-5" />
              <span>Gift Types ({giftTypes?.length || 0})</span>
            </div>
            <Button
              onClick={() => setShowAddGiftModal(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Gift Type
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {giftTypes?.map((gift: any) => (
              <div
                key={gift.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{gift.emoji}</span>
                  <div>
                    <div className="font-medium text-sm">{gift.displayName}</div>
                    <div className="text-xs text-gray-500">{gift.tokenCost} tokens</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={gift.isActive ? "default" : "secondary"}>
                    {gift.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingGift(gift);
                      setShowAddGiftModal(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {(!giftTypes || giftTypes.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Gift className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No gift types configured yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Gift Type Modal */}
      <Dialog open={showAddGiftModal} onOpenChange={setShowAddGiftModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGift ? 'Edit Gift Type' : 'Add New Gift Type'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={giftForm.displayName}
                  onChange={(e) => setGiftForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Heart"
                />
              </div>
              <div className="space-y-2">
                <Label>Emoji</Label>
                <Input
                  value={giftForm.emoji}
                  onChange={(e) => setGiftForm(prev => ({ ...prev, emoji: e.target.value }))}
                  placeholder="❤️"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Token Cost</Label>
              <Input
                type="number"
                value={giftForm.tokenCost}
                onChange={(e) => setGiftForm(prev => ({ ...prev, tokenCost: e.target.value }))}
                placeholder="1.00"
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={giftForm.isActive}
                onCheckedChange={(checked) => setGiftForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>Active</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleSaveGift}
                disabled={giftMutation.isPending || !giftForm.displayName || !giftForm.emoji || !giftForm.tokenCost}
                className="flex-1"
              >
                {giftMutation.isPending ? "Saving..." : (editingGift ? "Update" : "Create")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddGiftModal(false);
                  setEditingGift(null);
                  setGiftForm({ displayName: '', emoji: '', tokenCost: '', isActive: true });
                }}
              >
                Cancel
              </Button>
              {editingGift && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteGift}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending Videos for Approval */}
      <PendingVideosSection />
    </div>
  );
}

// Pending Videos Section Component
function PendingVideosSection() {
  const { toast } = useToast();

  // Pending videos query
  const { data: pendingVideos = [], isLoading } = useQuery({
    queryKey: ["/api/admin/pending-videos"],
  });

  // Video approval mutation
  const approvalMutation = useMutation({
    mutationFn: ({ videoId, isApproved }: { videoId: string; isApproved: boolean }) =>
      apiRequest("PUT", `/api/admin/videos/${videoId}/status`, { isApproved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-videos"] });
      toast({
        title: "Success",
        description: "Video status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update video status",
        variant: "destructive",
      });
    },
  });

  if (pendingVideos.length === 0) {
    return (
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="w-5 h-5" />
            <span>Pending Video Approvals</span>
            <Badge variant="secondary">0</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No videos pending approval</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Video className="w-5 h-5" />
          <span>Pending Video Approvals</span>
          <Badge variant="destructive">{pendingVideos.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {pendingVideos.map((video: any) => (
            <div key={video.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      {video.user?.profileImageUrl ? (
                        <img
                          src={video.user.profileImageUrl}
                          alt={video.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold">
                          {(video.user?.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{video.user?.name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">@{video.user?.username}</div>
                    </div>
                  </div>
                  
                  <h4 className="font-medium">{video.title || 'Untitled Video'}</h4>
                  {video.description && (
                    <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Duration: {video.duration || 0}s</span>
                    <span>Size: {video.fileSize ? `${(video.fileSize / 1024 / 1024).toFixed(1)}MB` : 'Unknown'}</span>
                    <span>Uploaded: {formatDistanceToNow(new Date(video.createdAt))} ago</span>
                  </div>
                </div>
              </div>

              {/* Video Preview */}
              <div className="w-full max-w-xs mx-auto">
                <video
                  src={video.videoUrl}
                  poster={video.thumbnailUrl}
                  className="w-full aspect-video rounded-lg object-cover"
                  controls
                  preload="metadata"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => approvalMutation.mutate({ videoId: video.id, isApproved: true })}
                  disabled={approvalMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {approvalMutation.isPending ? "Processing..." : "Approve"}
                </Button>
                <Button
                  onClick={() => approvalMutation.mutate({ videoId: video.id, isApproved: false })}
                  disabled={approvalMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  {approvalMutation.isPending ? "Processing..." : "Reject"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
