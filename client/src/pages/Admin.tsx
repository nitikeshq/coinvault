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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Sparkles, Users, Send, Minus, Image, Coins } from "lucide-react";
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
      });
    }
  }, [currentWebsiteSettings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-crypto-navy flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crypto-navy text-white p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => window.location.href = "/"} variant="outline" data-testid="button-back-home">
            Back to Home
          </Button>
        </div>

        <Tabs defaultValue="token" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-crypto-dark">
            <TabsTrigger value="token" data-testid="tab-token">Token Config</TabsTrigger>
            <TabsTrigger value="website" data-testid="tab-website">Website</TabsTrigger>
            <TabsTrigger value="deposits" data-testid="tab-deposits">Deposits</TabsTrigger>
            <TabsTrigger value="news" data-testid="tab-news">News</TabsTrigger>
            <TabsTrigger value="social" data-testid="tab-social">Social Links</TabsTrigger>
            <TabsTrigger value="dapps" data-testid="tab-dapps">Dapps</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="nft-mint" data-testid="tab-nft-mint">NFT Mint</TabsTrigger>
          </TabsList>

          {/* Token Configuration */}
          <TabsContent value="token">
            <Card className="bg-crypto-dark border-white/10">
              <CardHeader>
                <CardTitle>Token Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConfigSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="contractAddress">Contract Address</Label>
                    <Input
                      id="contractAddress"
                      value={tokenConfig.contractAddress}
                      onChange={(e) => setTokenConfig(prev => ({ ...prev, contractAddress: e.target.value }))}
                      placeholder="0x..."
                      className="bg-crypto-gray border-white/20"
                      data-testid="input-contract-address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tokenName">Token Name</Label>
                      <Input
                        id="tokenName"
                        value={tokenConfig.tokenName}
                        onChange={(e) => setTokenConfig(prev => ({ ...prev, tokenName: e.target.value }))}
                        placeholder="e.g., CryptoToken"
                        className="bg-crypto-gray border-white/20"
                        data-testid="input-token-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tokenSymbol">Token Symbol</Label>
                      <Input
                        id="tokenSymbol"
                        value={tokenConfig.tokenSymbol}
                        onChange={(e) => setTokenConfig(prev => ({ ...prev, tokenSymbol: e.target.value }))}
                        placeholder="e.g., CRYPTO"
                        className="bg-crypto-gray border-white/20"
                        data-testid="input-token-symbol"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="decimals">Decimals</Label>
                    <Input
                      id="decimals"
                      type="number"
                      value={tokenConfig.decimals}
                      onChange={(e) => setTokenConfig(prev => ({ ...prev, decimals: parseInt(e.target.value) }))}
                      className="bg-crypto-gray border-white/20"
                      data-testid="input-decimals"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-crypto-blue hover:bg-blue-600"
                    disabled={updateConfigMutation.isPending}
                    data-testid="button-update-config"
                  >
                    {updateConfigMutation.isPending ? "Updating..." : "Update Configuration"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Website Settings */}
          <TabsContent value="website">
            <Card className="bg-crypto-dark border-white/10">
              <CardHeader>
                <CardTitle>Website Settings</CardTitle>
                <p className="text-gray-400 text-sm">
                  Configure your website branding, colors, and important document links.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWebsiteSettingsSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={websiteSettings.siteName}
                        onChange={(e) => setWebsiteSettings(prev => ({ ...prev, siteName: e.target.value }))}
                        placeholder="e.g., Your Site Name"
                        className="bg-crypto-gray border-white/20"
                        data-testid="input-site-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={websiteSettings.description}
                        onChange={(e) => setWebsiteSettings(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of your platform"
                        className="bg-crypto-gray border-white/20"
                        data-testid="input-description"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input
                        id="logoUrl"
                        value={websiteSettings.logoUrl}
                        onChange={(e) => setWebsiteSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                        className="bg-crypto-gray border-white/20"
                        data-testid="input-logo-url"
                      />
                    </div>
                    <div>
                      <Label htmlFor="faviconUrl">Favicon URL</Label>
                      <Input
                        id="faviconUrl"
                        value={websiteSettings.faviconUrl}
                        onChange={(e) => setWebsiteSettings(prev => ({ ...prev, faviconUrl: e.target.value }))}
                        placeholder="https://example.com/favicon.ico"
                        className="bg-crypto-gray border-white/20"
                        data-testid="input-favicon-url"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <Input
                        id="primaryColor"
                        type="color"
                        value={websiteSettings.primaryColor}
                        onChange={(e) => setWebsiteSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="bg-crypto-gray border-white/20 h-10"
                        data-testid="input-primary-color"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={websiteSettings.secondaryColor}
                        onChange={(e) => setWebsiteSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="bg-crypto-gray border-white/20 h-10"
                        data-testid="input-secondary-color"
                      />
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Important Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="auditReportUrl">Audit Report URL</Label>
                        <Input
                          id="auditReportUrl"
                          value={websiteSettings.auditReportUrl}
                          onChange={(e) => setWebsiteSettings(prev => ({ ...prev, auditReportUrl: e.target.value }))}
                          placeholder="https://example.com/audit-report.pdf"
                          className="bg-crypto-gray border-white/20"
                          data-testid="input-audit-report-url"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Link to your smart contract audit report (appears in header)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="whitepaperUrl">Whitepaper URL</Label>
                        <Input
                          id="whitepaperUrl"
                          value={websiteSettings.whitepaperUrl}
                          onChange={(e) => setWebsiteSettings(prev => ({ ...prev, whitepaperUrl: e.target.value }))}
                          placeholder="https://example.com/whitepaper.pdf"
                          className="bg-crypto-gray border-white/20"
                          data-testid="input-whitepaper-url"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Link to your project whitepaper (appears in header)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="bg-crypto-blue hover:bg-blue-600"
                    disabled={updateWebsiteSettingsMutation.isPending}
                    data-testid="button-update-website-settings"
                  >
                    {updateWebsiteSettingsMutation.isPending ? "Updating..." : "Update Website Settings"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposit Management */}
          <TabsContent value="deposits">
            <Card className="bg-crypto-dark border-white/10">
              <CardHeader>
                <CardTitle>Deposit Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deposits.map((deposit: any) => (
                    <div key={deposit.id} className="border border-white/20 rounded-lg p-4" data-testid={`deposit-${deposit.id}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">Amount: {deposit.amount}</p>
                          <p className="text-sm text-gray-400">User: {deposit.userId}</p>
                          <p className="text-sm text-gray-400">Date: {new Date(deposit.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge 
                          variant={deposit.status === 'approved' ? 'default' : 
                                  deposit.status === 'rejected' ? 'destructive' : 'secondary'}
                        >
                          {deposit.status}
                        </Badge>
                      </div>
                      {deposit.transactionHash && (
                        <p className="text-sm text-gray-400 mb-2">Hash: {deposit.transactionHash}</p>
                      )}
                      {deposit.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleDepositAction(deposit.id, 'approved')}
                            className="bg-crypto-green hover:bg-green-600"
                            data-testid={`button-approve-${deposit.id}`}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDepositAction(deposit.id, 'rejected')}
                            data-testid={`button-reject-${deposit.id}`}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {deposits.length === 0 && (
                    <p className="text-gray-400 text-center py-8">No deposit requests found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* News Management */}
          <TabsContent value="news">
            <div className="grid gap-6">
              <Card className="bg-crypto-dark border-white/10">
                <CardHeader>
                  <CardTitle>Create News Article</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleNewsSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newsForm.title}
                        onChange={(e) => setNewsForm(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-crypto-gray border-white/20"
                        data-testid="input-news-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newsForm.description}
                        onChange={(e) => setNewsForm(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-crypto-gray border-white/20"
                        data-testid="textarea-news-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input
                          id="imageUrl"
                          value={newsForm.imageUrl}
                          onChange={(e) => setNewsForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                          className="bg-crypto-gray border-white/20"
                          data-testid="input-news-image"
                        />
                      </div>
                      <div>
                        <Label htmlFor="externalUrl">External URL</Label>
                        <Input
                          id="externalUrl"
                          value={newsForm.externalUrl}
                          onChange={(e) => setNewsForm(prev => ({ ...prev, externalUrl: e.target.value }))}
                          className="bg-crypto-gray border-white/20"
                          data-testid="input-news-url"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={newsForm.category}
                          onChange={(e) => setNewsForm(prev => ({ ...prev, category: e.target.value }))}
                          className="bg-crypto-gray border-white/20"
                          data-testid="input-news-category"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isPublished"
                          checked={newsForm.isPublished}
                          onCheckedChange={(checked) => setNewsForm(prev => ({ ...prev, isPublished: checked }))}
                          data-testid="switch-news-published"
                        />
                        <Label htmlFor="isPublished">Published</Label>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="bg-crypto-blue hover:bg-blue-600"
                      disabled={createNewsMutation.isPending}
                      data-testid="button-create-news"
                    >
                      {createNewsMutation.isPending ? "Creating..." : "Create Article"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-crypto-dark border-white/10">
                <CardHeader>
                  <CardTitle>Existing Articles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allNews.map((article: any) => (
                      <div key={article.id} className="border border-white/20 rounded-lg p-4" data-testid={`news-${article.id}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{article.title}</h4>
                            <p className="text-sm text-gray-400 mb-2">{article.category}</p>
                            <p className="text-sm text-gray-300">{article.description.substring(0, 100)}...</p>
                          </div>
                          <Badge variant={article.isPublished ? 'default' : 'secondary'}>
                            {article.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {allNews.length === 0 && (
                      <p className="text-gray-400 text-center py-8">No news articles found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Social Links Management */}
          <TabsContent value="social">
            <div className="grid gap-6">
              <Card className="bg-crypto-dark border-white/10">
                <CardHeader>
                  <CardTitle>Add Social Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSocialSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="platform">Platform</Label>
                        <Input
                          id="platform"
                          value={socialForm.platform}
                          onChange={(e) => setSocialForm(prev => ({ ...prev, platform: e.target.value }))}
                          placeholder="e.g., telegram, twitter"
                          className="bg-crypto-gray border-white/20"
                          data-testid="input-social-platform"
                        />
                      </div>
                      <div>
                        <Label htmlFor="url">URL</Label>
                        <Input
                          id="url"
                          value={socialForm.url}
                          onChange={(e) => setSocialForm(prev => ({ ...prev, url: e.target.value }))}
                          placeholder="https://..."
                          className="bg-crypto-gray border-white/20"
                          data-testid="input-social-url"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={socialForm.isActive}
                        onCheckedChange={(checked) => setSocialForm(prev => ({ ...prev, isActive: checked }))}
                        data-testid="switch-social-active"
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                    <Button 
                      type="submit" 
                      className="bg-crypto-blue hover:bg-blue-600"
                      disabled={saveSocialLinkMutation.isPending}
                      data-testid="button-save-social"
                    >
                      {saveSocialLinkMutation.isPending ? "Saving..." : "Save Link"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-crypto-dark border-white/10">
                <CardHeader>
                  <CardTitle>Current Social Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allSocialLinks.map((link: any) => (
                      <div key={link.id} className="flex justify-between items-center border border-white/20 rounded-lg p-4" data-testid={`social-${link.id}`}>
                        <div>
                          <p className="font-semibold capitalize">{link.platform}</p>
                          <p className="text-sm text-gray-400">{link.url}</p>
                        </div>
                        <Badge variant={link.isActive ? 'default' : 'secondary'}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                    {allSocialLinks.length === 0 && (
                      <p className="text-gray-400 text-center py-8">No social links configured</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dapps Configuration */}
          <TabsContent value="dapps">
            <DappsAdminPanel />
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users">
            <UsersManagementPanel />
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

// Dapps Admin Panel Component
function DappsAdminPanel() {
  const { toast } = useToast();

  // Fetch dapp settings
  const { data: dappSettings = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/dapps"],
  });

  const updateDappMutation = useMutation({
    mutationFn: async ({ appName, isEnabled }: { appName: string; isEnabled: boolean }) => {
      return apiRequest("PUT", `/api/admin/dapps/${appName}`, { isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dapps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dapps/settings"] });
      toast({
        title: "Success",
        description: "Dapp setting updated successfully",
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

  const handleToggleDapp = (appName: string, isEnabled: boolean) => {
    updateDappMutation.mutate({ appName, isEnabled });
  };

  if (isLoading) {
    return (
      <Card className="bg-crypto-dark border-white/10">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-white">Loading dapp settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-crypto-dark border-white/10">
      <CardHeader>
        <CardTitle>Decentralized Apps Management</CardTitle>
        <p className="text-gray-400 text-sm">
          Enable or disable various dapps available to users. Disabled apps will be hidden from the navigation.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {dappSettings.map((dapp: any) => (
          <div key={dapp.appName} className="bg-crypto-gray rounded-lg p-4 border border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-white mb-1">
                  {dapp.displayName}
                </h3>
                <p className="text-gray-400 text-sm mb-2">
                  {dapp.description}
                </p>
                <div className="text-sm text-gray-300">
                  <span className="font-medium">Cost:</span> {parseFloat(dapp.cost).toLocaleString()} tokens
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dapp.isEnabled}
                    onChange={(e) => handleToggleDapp(dapp.appName, e.target.checked)}
                    disabled={updateDappMutation.isPending}
                    className="sr-only peer"
                    data-testid={`toggle-${dapp.appName}`}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className={`text-sm font-medium ${
                  dapp.isEnabled ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {dapp.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {dappSettings.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <div>No dapps configured</div>
            <div className="text-sm">Dapp settings will appear here when configured</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Users Management Panel Component
function UsersManagementPanel() {
  const { toast } = useToast();
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenReason, setTokenReason] = useState("");

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const sendTokensMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/tokens/send`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Tokens sent successfully",
      });
      setTokenAmount("");
      setTokenReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deductTokensMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/tokens/deduct`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Tokens deducted successfully",
      });
      setTokenAmount("");
      setTokenReason("");
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
      <Card className="bg-crypto-dark border-white/10">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-white">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-crypto-dark border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Management</span>
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Manage user accounts and token balances. Users can add their BEP-20 withdrawal address in their profile.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user: any) => (
              <div key={user.id} className="bg-crypto-gray rounded-lg p-4 border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <div className="font-medium text-white">{user.name || user.email}</div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                    {user.isAdmin && (
                      <Badge variant="secondary" className="mt-1">Admin</Badge>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-400">Token Balance</div>
                    <div className="font-bold text-yellow-400">
                      {parseFloat(user.tokenBalance || '0').toLocaleString()} tokens
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-400">Withdrawal Address</div>
                    <div className="text-sm text-white">
                      {user.withdrawalAddress ? (
                        <span className="break-all">{user.withdrawalAddress}</span>
                      ) : (
                        <span className="text-gray-500">Not set</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleSendTokens(user.id)}
                      disabled={sendTokensMutation.isPending || !tokenAmount}
                      className="bg-green-600 hover:bg-green-700"
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
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <div>No users found</div>
              </div>
            )}
          </div>
          
          {/* Token Management Form */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="token-amount">Amount (tokens)</Label>
                <Input
                  id="token-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="bg-crypto-gray border-white/20"
                  data-testid="input-token-amount"
                />
              </div>
              <div>
                <Label htmlFor="token-reason">Reason</Label>
                <Input
                  id="token-reason"
                  placeholder="Optional reason"
                  value={tokenReason}
                  onChange={(e) => setTokenReason(e.target.value)}
                  className="bg-crypto-gray border-white/20"
                  data-testid="input-token-reason"
                />
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-400">
                  Fill in amount and reason, then click Send or Deduct for any user above
                </div>
              </div>
            </div>
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
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [isUploadingReference, setIsUploadingReference] = useState(false);

  // Handle reference image upload
  const handleReferenceImageUpload = async (file: File) => {
    setIsUploadingReference(true);
    try {
      // Get upload URL
      const uploadResponse = await apiRequest("POST", "/api/objects/upload");
      const { uploadURL } = uploadResponse;

      // Upload the file
      await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Set the uploaded image URL
      setReferenceImageUrl(uploadURL.split('?')[0]); // Remove query params
      setReferenceImage(file);
      
      toast({
        title: "Success",
        description: "Reference image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading reference image:", error);
      toast({
        title: "Error",
        description: "Failed to upload reference image",
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
    <Card className="bg-crypto-dark border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Image className="h-5 w-5" />
          <span>Admin NFT Minting</span>
        </CardTitle>
        <p className="text-gray-400 text-sm">
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
                className="bg-crypto-gray border-white/20"
                data-testid="input-nft-theme"
              />
              <p className="text-xs text-gray-400 mt-1">
                AI will generate unique descriptions based on this theme
              </p>
            </div>
            
            <div>
              <Label htmlFor="nft-rarity">Rarity</Label>
              <Select value={nftRarity} onValueChange={setNftRarity}>
                <SelectTrigger className="bg-crypto-gray border-white/20" data-testid="select-nft-rarity">
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
                className="bg-crypto-gray border-white/20"
                data-testid="input-nft-quantity"
              />
              <p className="text-xs text-gray-400 mt-1">
                Generate multiple NFTs with the same theme (max 100)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Reference Image (Optional)</Label>
              <ObjectUploader
                onFileSelected={handleReferenceImageUpload}
                isUploading={isUploadingReference}
                acceptedFileTypes="image/*"
                buttonClassName="bg-crypto-gray border-white/20 hover:bg-gray-600"
              />
              <p className="text-xs text-gray-400 mt-1">
                Upload a reference image for AI to generate similar styled NFTs
              </p>
            </div>
            
            {referenceImageUrl && (
              <div className="border border-white/20 rounded-lg p-2">
                <img 
                  src={referenceImageUrl} 
                  alt="Reference" 
                  className="w-full h-32 object-cover rounded"
                />
                <div className="text-xs text-green-400 mt-1">✓ Reference uploaded</div>
              </div>
            )}
          </div>
          
          <div className="bg-crypto-gray rounded-lg p-4 border border-white/10">
            <h4 className="font-medium text-white mb-2">Preview</h4>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-400">Theme:</span> {nftTheme || "Not set"}</div>
              <div><span className="text-gray-400">Rarity:</span> {nftRarity}</div>
              <div><span className="text-gray-400">Quantity:</span> {nftQuantity}</div>
              <div><span className="text-gray-400">Collection:</span> NFTs</div>
            </div>
            <div className="mt-4 p-3 bg-blue-900/20 rounded border border-blue-500/30">
              <div className="text-xs text-blue-400 mb-1">ℹ️ AI Generation</div>
              <div className="text-xs text-gray-300">
                Each NFT will get a unique AI-generated description based on the theme and rarity.
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-white/20">
          <Button 
            onClick={handleMintNft}
            disabled={mintNftMutation.isPending || !nftTheme.trim()}
            className="bg-crypto-blue hover:bg-blue-600"
            data-testid="button-mint-nft"
          >
            {mintNftMutation.isPending ? "Minting..." : `Mint ${nftQuantity} NFT${nftQuantity > 1 ? 's' : ''} with AI`}
          </Button>
          
          <div className="mt-2 text-xs text-gray-400">
            NFTs will be stored in database for the presale. After presale ends, they can be deployed to blockchain.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
