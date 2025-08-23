import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Edit, Trash2, Check, X, Settings, Users, FileText, Link, TrendingUp, Shield, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PresaleAdmin } from "@/components/PresaleAdmin";

const tokenConfigSchema = z.object({
  contractAddress: z.string().min(1, "Contract address is required"),
  tokenName: z.string().min(1, "Token name is required"),
  tokenSymbol: z.string().min(1, "Token symbol is required"),
  decimals: z.number().min(0).max(18),
  isActive: z.boolean(),
});

const newsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  externalUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  isPublished: z.boolean(),
});

const socialLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  url: z.string().url("Must be a valid URL"),
  isActive: z.boolean(),
});

const websiteSettingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  faviconUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  primaryColor: z.string().min(1, "Primary color is required"),
  secondaryColor: z.string().min(1, "Secondary color is required"),
});

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isLoadingTokenInfo, setIsLoadingTokenInfo] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Function to fetch token information from BSC
  const fetchTokenInfo = async (contractAddress: string) => {
    if (!contractAddress || contractAddress.length !== 42 || !contractAddress.startsWith('0x')) {
      return;
    }

    setIsLoadingTokenInfo(true);
    try {
      // BSC RPC endpoint
      const rpcUrl = 'https://bsc-dataseed1.binance.org/';
      
      // ERC-20 function selectors
      const nameSelector = '0x06fdde03'; // name()
      const symbolSelector = '0x95d89b41'; // symbol()
      const decimalsSelector = '0x313ce567'; // decimals()

      // Make RPC calls to get token info
      const [nameResponse, symbolResponse, decimalsResponse] = await Promise.all([
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: contractAddress,
              data: nameSelector
            }, 'latest'],
            id: 1
          })
        }),
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: contractAddress,
              data: symbolSelector
            }, 'latest'],
            id: 2
          })
        }),
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: contractAddress,
              data: decimalsSelector
            }, 'latest'],
            id: 3
          })
        })
      ]);

      const [nameData, symbolData, decimalsData] = await Promise.all([
        nameResponse.json(),
        symbolResponse.json(),
        decimalsResponse.json()
      ]);

      if (nameData.result && symbolData.result && decimalsData.result) {
        // Decode hex strings
        const decodeName = (hex: string) => {
          if (hex === '0x') return '';
          const hex2 = hex.slice(2);
          const length = parseInt(hex2.slice(64, 128), 16);
          const nameHex = hex2.slice(128, 128 + length * 2);
          return nameHex ? Buffer.from(nameHex, 'hex').toString('utf8') : '';
        };

        const decodeSymbol = (hex: string) => {
          if (hex === '0x') return '';
          const hex2 = hex.slice(2);
          const length = parseInt(hex2.slice(64, 128), 16);
          const symbolHex = hex2.slice(128, 128 + length * 2);
          return symbolHex ? Buffer.from(symbolHex, 'hex').toString('utf8') : '';
        };

        const tokenName = decodeName(nameData.result);
        const tokenSymbol = decodeSymbol(symbolData.result);
        const decimals = parseInt(decimalsData.result, 16);

        // Update form with fetched data
        tokenForm.setValue('tokenName', tokenName);
        tokenForm.setValue('tokenSymbol', tokenSymbol);
        tokenForm.setValue('decimals', decimals);

        toast({
          title: "Token info fetched successfully",
          description: `Found: ${tokenName} (${tokenSymbol}) with ${decimals} decimals`,
        });
      } else {
        throw new Error('Invalid token contract or token does not exist');
      }
    } catch (error) {
      console.error('Error fetching token info:', error);
      toast({
        title: "Failed to fetch token info",
        description: "Please check the contract address or enter details manually",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTokenInfo(false);
    }
  };

  // Queries
  const { data: tokenConfig } = useQuery({ queryKey: ["/api/token/config"] });
  const { data: allNews = [] } = useQuery({ queryKey: ["/api/admin/news"] });
  const { data: deposits = [] } = useQuery({ queryKey: ["/api/admin/deposits"] });
  const { data: socialLinks = [] } = useQuery({ queryKey: ["/api/admin/social-links"] });
  const { data: websiteSettings } = useQuery({ queryKey: ["/api/website/settings"] });

  // Forms
  const tokenForm = useForm({
    resolver: zodResolver(tokenConfigSchema),
    defaultValues: tokenConfig || {
      contractAddress: "",
      tokenName: "",
      tokenSymbol: "",
      decimals: 18,
      isActive: true,
    },
  });

  const newsForm = useForm({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      externalUrl: "",
      category: "platform",
      isPublished: false,
    },
  });

  const socialForm = useForm({
    resolver: zodResolver(socialLinkSchema),
    defaultValues: {
      platform: "",
      url: "",
      isActive: true,
    },
  });

  const websiteForm = useForm({
    resolver: zodResolver(websiteSettingsSchema),
    defaultValues: {
      siteName: "CryptoWallet Pro",
      logoUrl: "",
      faviconUrl: "",
      description: "",
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
    },
  });

  // Update form values when websiteSettings data is loaded
  useEffect(() => {
    if (websiteSettings) {
      websiteForm.reset(websiteSettings);
    }
  }, [websiteSettings, websiteForm]);

  // Mutations
  const updateTokenConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/admin/token/config", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/token/config"] });
      toast({ title: "Token configuration updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update token configuration", description: error.message, variant: "destructive" });
    },
  });

  const createNewsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/news", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      newsForm.reset();
      toast({ title: "News article created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create news article", description: error.message, variant: "destructive" });
    },
  });

  const updateNewsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/news/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setEditingItem(null);
      toast({ title: "News article updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update news article", description: error.message, variant: "destructive" });
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/news/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "News article deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete news article", description: error.message, variant: "destructive" });
    },
  });

  const updateDepositMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const response = await apiRequest("PUT", `/api/admin/deposits/${id}`, { status, adminNotes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits"] });
      toast({ title: "Deposit status updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update deposit status", description: error.message, variant: "destructive" });
    },
  });

  const createSocialLinkMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/social-links", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social-links"] });
      socialForm.reset();
      toast({ title: "Social link created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create social link", description: error.message, variant: "destructive" });
    },
  });

  const deleteSocialLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/social-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social-links"] });
      toast({ title: "Social link deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete social link", description: error.message, variant: "destructive" });
    },
  });

  const updateWebsiteSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/admin/website/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/website/settings"] });
      toast({ title: "Website settings updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update website settings", description: error.message, variant: "destructive" });
    },
  });

  const onTokenSubmit = (data: any) => {
    updateTokenConfigMutation.mutate(data);
  };

  const onNewsSubmit = (data: any) => {
    if (editingItem) {
      updateNewsMutation.mutate({ id: editingItem.id, data });
    } else {
      createNewsMutation.mutate(data);
    }
  };

  const onSocialSubmit = (data: any) => {
    createSocialLinkMutation.mutate(data);
  };

  const onWebsiteSettingsSubmit = (data: any) => {
    updateWebsiteSettingsMutation.mutate(data);
  };

  const handleEditNews = (article: any) => {
    setEditingItem(article);
    newsForm.reset(article);
    setActiveTab("news");
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    newsForm.reset();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Control Panel</h1>
            <p className="text-gray-600">Manage your cryptocurrency wallet platform</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 bg-white border border-gray-200">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="presale" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Presale</span>
          </TabsTrigger>
          <TabsTrigger value="website" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Website</span>
          </TabsTrigger>
          <TabsTrigger value="token" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Token Config</span>
          </TabsTrigger>
          <TabsTrigger value="deposits" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Deposits</span>
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>News</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center space-x-2">
            <Link className="h-4 w-4" />
            <span>Social Links</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-800">Total Deposits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{deposits.length}</div>
                <p className="text-gray-500">Pending and completed deposits</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-800">Published Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{allNews.filter((n: any) => n.isPublished).length}</div>
                <p className="text-gray-500">Live news articles</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-800">Active Social Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{socialLinks.filter((s: any) => s.isActive).length}</div>
                <p className="text-gray-500">Connected social platforms</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="presale" className="space-y-6">
          <PresaleAdmin />
        </TabsContent>

        <TabsContent value="website" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Website Settings</CardTitle>
              <CardDescription className="text-gray-600">
                Manage your website branding and appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...websiteForm}>
                <form onSubmit={websiteForm.handleSubmit(onWebsiteSettingsSubmit)} className="space-y-4">
                  <FormField
                    control={websiteForm.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Website Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="CryptoWallet Pro"
                            className="bg-gray-50 border-gray-300 text-gray-900"
                            data-testid="input-site-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={websiteForm.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Logo URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://example.com/logo.png"
                              className="bg-gray-50 border-gray-300 text-gray-900"
                              data-testid="input-logo-url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={websiteForm.control}
                      name="faviconUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Favicon URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://example.com/favicon.ico"
                              className="bg-gray-50 border-gray-300 text-gray-900"
                              data-testid="input-favicon-url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={websiteForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Website Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Professional cryptocurrency wallet platform..."
                            className="bg-gray-50 border-gray-300 text-gray-900"
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={websiteForm.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Primary Color</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="color"
                              className="bg-gray-50 border-gray-300 text-gray-900 h-12"
                              data-testid="input-primary-color"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={websiteForm.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Secondary Color</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="color"
                              className="bg-gray-50 border-gray-300 text-gray-900 h-12"
                              data-testid="input-secondary-color"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
                    disabled={updateWebsiteSettingsMutation.isPending}
                    data-testid="button-save-website-settings"
                  >
                    {updateWebsiteSettingsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Save Website Settings"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="token" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Token Configuration</CardTitle>
              <CardDescription className="text-gray-600">
                Manage the BEP-20 token settings for your wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...tokenForm}>
                <form onSubmit={tokenForm.handleSubmit(onTokenSubmit)} className="space-y-4">
                  <FormField
                    control={tokenForm.control}
                    name="contractAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Contract Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              placeholder="0x... (will auto-fetch token info)"
                              className="bg-gray-50 border-gray-300 text-gray-900 pr-10"
                              data-testid="input-contract-address"
                              onChange={(e) => {
                                field.onChange(e);
                                const address = e.target.value.trim();
                                if (address.length === 42 && address.startsWith('0x')) {
                                  // Debounce the API call
                                  setTimeout(() => {
                                    if (tokenForm.getValues('contractAddress') === address) {
                                      fetchTokenInfo(address);
                                    }
                                  }, 1000);
                                }
                              }}
                            />
                            {isLoadingTokenInfo && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <div className="text-xs text-gray-500 mt-1">
                          Enter a valid BEP-20 token contract address to automatically fetch token details
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={tokenForm.control}
                      name="tokenName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Token Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="My Token"
                              className="bg-gray-50 border-gray-300 text-gray-900"
                              data-testid="input-token-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={tokenForm.control}
                      name="tokenSymbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Token Symbol</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="MTK"
                              className="bg-gray-50 border-gray-300 text-gray-900"
                              data-testid="input-token-symbol"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={tokenForm.control}
                      name="decimals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Decimals</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              max="18"
                              className="bg-gray-50 border-gray-300 text-gray-900"
                              data-testid="input-decimals"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={tokenForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-4 bg-gray-50">
                          <div className="space-y-0.5">
                            <FormLabel className="text-gray-700">Active</FormLabel>
                            <div className="text-sm text-gray-500">Enable this token configuration</div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={updateTokenConfigMutation.isPending}
                    data-testid="button-save-token-config"
                  >
                    {updateTokenConfigMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Token Configuration"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Deposit Requests</CardTitle>
              <CardDescription className="text-gray-600">
                Review and manage user deposit requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-700">User</TableHead>
                    <TableHead className="text-gray-700">Amount</TableHead>
                    <TableHead className="text-gray-700">Transaction Hash</TableHead>
                    <TableHead className="text-gray-700">Status</TableHead>
                    <TableHead className="text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((deposit: any) => (
                    <TableRow key={deposit.id} className="border-gray-200">
                      <TableCell className="text-gray-900">{deposit.userId}</TableCell>
                      <TableCell className="text-gray-900">{deposit.amount} {deposit.currency}</TableCell>
                      <TableCell className="text-gray-900 font-mono text-sm">{deposit.transactionHash}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={deposit.status === 'confirmed' ? 'default' : deposit.status === 'pending' ? 'secondary' : 'destructive'}
                          className={
                            deposit.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' :
                            deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-red-100 text-red-700 border-red-200'
                          }
                          data-testid={`badge-status-${deposit.id}`}
                        >
                          {deposit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateDepositMutation.mutate({ id: deposit.id, status: 'confirmed' })}
                            data-testid={`button-confirm-${deposit.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateDepositMutation.mutate({ id: deposit.id, status: 'failed' })}
                            data-testid={`button-reject-${deposit.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">
                {editingItem ? "Edit News Article" : "Create News Article"}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {editingItem ? "Update the selected news article" : "Add a new news article to your platform"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...newsForm}>
                <form onSubmit={newsForm.handleSubmit(onNewsSubmit)} className="space-y-4">
                  <FormField
                    control={newsForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Article title"
                            className="bg-gray-50 border-gray-300 text-gray-900"
                            data-testid="input-news-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newsForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Article description"
                            className="bg-gray-50 border-gray-300 text-gray-900"
                            data-testid="textarea-news-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newsForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Image URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://example.com/image.jpg"
                              className="bg-gray-50 border-gray-300 text-gray-900"
                              data-testid="input-news-image"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newsForm.control}
                      name="externalUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">External URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://example.com/article"
                              className="bg-gray-50 border-gray-300 text-gray-900"
                              data-testid="input-news-external-url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newsForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900" data-testid="select-news-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-gray-200">
                              <SelectItem value="platform">Platform</SelectItem>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="market">Market</SelectItem>
                              <SelectItem value="security">Security</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newsForm.control}
                      name="isPublished"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-4 bg-gray-50">
                          <div className="space-y-0.5">
                            <FormLabel className="text-gray-700">Published</FormLabel>
                            <div className="text-sm text-gray-500">Make article visible to users</div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-news-published"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button 
                      type="submit" 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={createNewsMutation.isPending || updateNewsMutation.isPending}
                      data-testid="button-save-news"
                    >
                      {(createNewsMutation.isPending || updateNewsMutation.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingItem ? "Update Article" : "Create Article"
                      )}
                    </Button>
                    
                    {editingItem && (
                      <Button 
                        type="button" 
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={handleCancelEdit}
                        data-testid="button-cancel-edit-news"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Existing Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-700">Title</TableHead>
                    <TableHead className="text-gray-700">Category</TableHead>
                    <TableHead className="text-gray-700">Status</TableHead>
                    <TableHead className="text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allNews.map((article: any) => (
                    <TableRow key={article.id} className="border-gray-200">
                      <TableCell className="text-gray-900">{article.title}</TableCell>
                      <TableCell className="text-gray-900 capitalize">{article.category}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={article.isPublished ? 'default' : 'secondary'}
                          className={article.isPublished ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}
                          data-testid={`badge-news-status-${article.id}`}
                        >
                          {article.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={() => handleEditNews(article)}
                            data-testid={`button-edit-news-${article.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteNewsMutation.mutate(article.id)}
                            data-testid={`button-delete-news-${article.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Add Social Link</CardTitle>
              <CardDescription className="text-gray-600">
                Add social media links to your platform footer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...socialForm}>
                <form onSubmit={socialForm.handleSubmit(onSocialSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={socialForm.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Platform</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900" data-testid="select-social-platform">
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-gray-200">
                              <SelectItem value="telegram">Telegram</SelectItem>
                              <SelectItem value="twitter">Twitter</SelectItem>
                              <SelectItem value="discord">Discord</SelectItem>
                              <SelectItem value="facebook">Facebook</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                              <SelectItem value="youtube">YouTube</SelectItem>
                              <SelectItem value="linkedin">LinkedIn</SelectItem>
                              <SelectItem value="github">GitHub</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={socialForm.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://..."
                              className="bg-gray-50 border-gray-300 text-gray-900"
                              data-testid="input-social-url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={socialForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-4 bg-gray-50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-700">Active</FormLabel>
                          <div className="text-sm text-gray-500">Show this link in the footer</div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-social-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={createSocialLinkMutation.isPending}
                    data-testid="button-save-social-link"
                  >
                    {createSocialLinkMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Social Link"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Existing Social Links</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-700">Platform</TableHead>
                    <TableHead className="text-gray-700">URL</TableHead>
                    <TableHead className="text-gray-700">Status</TableHead>
                    <TableHead className="text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {socialLinks.map((link: any) => (
                    <TableRow key={link.id} className="border-gray-200">
                      <TableCell className="text-gray-900 capitalize">{link.platform}</TableCell>
                      <TableCell className="text-gray-900">{link.url}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={link.isActive ? 'default' : 'secondary'}
                          className={link.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}
                          data-testid={`badge-social-status-${link.id}`}
                        >
                          {link.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSocialLinkMutation.mutate(link.id)}
                          data-testid={`button-delete-social-${link.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}