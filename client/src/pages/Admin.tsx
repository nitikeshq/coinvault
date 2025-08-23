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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";

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

  // Update deposit status mutation
  const updateDepositMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      await apiRequest('PUT', `/api/admin/deposits/${id}`, { status, adminNotes });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Deposit status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deposits'] });
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
          <TabsList className="grid w-full grid-cols-5 bg-crypto-dark">
            <TabsTrigger value="token" data-testid="tab-token">Token Config</TabsTrigger>
            <TabsTrigger value="deposits" data-testid="tab-deposits">Deposits</TabsTrigger>
            <TabsTrigger value="news" data-testid="tab-news">News</TabsTrigger>
            <TabsTrigger value="social" data-testid="tab-social">Social Links</TabsTrigger>
            <TabsTrigger value="dapps" data-testid="tab-dapps">Dapps</TabsTrigger>
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
                  <span className="font-medium">Cost:</span> {parseFloat(dapp.cost).toLocaleString()} CHILL tokens
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
