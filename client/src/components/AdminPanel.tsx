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
import { Loader2, Plus, Edit, Trash2, Check, X, Settings, Users, FileText, Link, TrendingUp, Shield, Clock, Sparkles, Image, Send, Minus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PresaleAdmin } from "@/components/PresaleAdmin";
import { useTokenInfo } from "@/hooks/useTokenInfo";

const tokenConfigSchema = z.object({
  contractAddress: z.string().min(1, "Contract address is required"),
  tokenName: z.string().min(1, "Token name is required"),
  tokenSymbol: z.string().min(1, "Token symbol is required"),
  decimals: z.number().min(0).max(18),
  defaultPriceUsd: z.number().min(0, "Default price must be positive"),
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
  auditReportUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  whitepaperUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  nftCharacterPrompt: z.string().optional().or(z.literal("")),
  maxNfts: z.number().min(1, "Must be at least 1").max(10000, "Cannot exceed 10,000"),
});

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isLoadingTokenInfo, setIsLoadingTokenInfo] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Function to fetch token information from backend API
  const fetchTokenInfo = async (contractAddress: string) => {
    if (!contractAddress || contractAddress.length !== 42 || !contractAddress.startsWith('0x')) {
      return;
    }

    setIsLoadingTokenInfo(true);
    try {
      const response = await fetch(`/api/token/info/${contractAddress}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const tokenInfo = await response.json();
      
      // Update form with fetched data
      tokenForm.setValue('tokenName', tokenInfo.name);
      tokenForm.setValue('tokenSymbol', tokenInfo.symbol);
      tokenForm.setValue('decimals', tokenInfo.decimals);

      toast({
        title: "Token info fetched successfully",
        description: `Found: ${tokenInfo.name} (${tokenInfo.symbol}) with ${tokenInfo.decimals} decimals`,
      });
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
      defaultPriceUsd: 0.001,
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
    defaultValues: websiteSettings || {
      siteName: "",
      logoUrl: "",
      faviconUrl: "",
      description: "",
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      auditReportUrl: "",
      whitepaperUrl: "",
      nftCharacterPrompt: "Cool man with messy gray hair, thick full beard with curled mustache",
      maxNfts: 1000,
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
        <TabsList className="grid w-full grid-cols-10 bg-white border border-gray-200">
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
          <TabsTrigger value="dapps" className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>Dapps</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="nft-mint" className="flex items-center space-x-2">
            <Image className="h-4 w-4" />
            <span>NFT Mint</span>
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

                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentation Links</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <FormField
                        control={websiteForm.control}
                        name="whitepaperUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Whitepaper URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://example.com/whitepaper.pdf"
                                className="bg-gray-50 border-gray-300 text-gray-900"
                                data-testid="input-whitepaper-url"
                              />
                            </FormControl>
                            <div className="text-xs text-gray-500 mt-1">
                              Link to your project whitepaper (will appear in navigation)
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={websiteForm.control}
                        name="auditReportUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Audit Report URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://example.com/audit-report.pdf"
                                className="bg-gray-50 border-gray-300 text-gray-900"
                                data-testid="input-audit-url"
                              />
                            </FormControl>
                            <div className="text-xs text-gray-500 mt-1">
                              Link to your security audit report (will appear in navigation)
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">NFT Collection Settings</h3>
                    
                    <FormField
                      control={websiteForm.control}
                      name="nftCharacterPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">NFT Character Prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Cool man with messy gray hair, thick full beard with curled mustache"
                              className="bg-gray-50 border-gray-300 text-gray-900"
                              data-testid="textarea-nft-character"
                            />
                          </FormControl>
                          <div className="text-xs text-gray-500 mt-1">
                            Base character description for all NFTs. Traits will be added to this foundation for variety.
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={websiteForm.control}
                      name="maxNfts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Maximum NFT Collection Size</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              max="10000"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              placeholder="1000"
                              className="bg-gray-50 border-gray-300 text-gray-900"
                              data-testid="input-max-nfts"
                            />
                          </FormControl>
                          <div className="text-xs text-gray-500 mt-1">
                            Total number of NFTs that can be minted in this collection
                          </div>
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

                  <div className="grid grid-cols-3 gap-4">
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
                      name="defaultPriceUsd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Default Price (USD)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.000001"
                              min="0"
                              placeholder="0.001"
                              className="bg-gray-50 border-gray-300 text-gray-900"
                              data-testid="input-default-price"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                          <div className="text-xs text-gray-500 mt-1">
                            Fallback when API fails
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={tokenForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-start justify-start rounded-lg border border-gray-200 p-4 bg-gray-50">
                          <div className="space-y-0.5 mb-2">
                            <FormLabel className="text-gray-700">Active</FormLabel>
                            <div className="text-xs text-gray-500">Enable this token configuration</div>
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
                          variant={deposit.status === 'approved' ? 'default' : deposit.status === 'pending' ? 'secondary' : 'destructive'}
                          className={
                            deposit.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
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
                            onClick={() => updateDepositMutation.mutate({ id: deposit.id, status: 'approved' })}
                            data-testid={`button-approve-${deposit.id}`}
                            disabled={updateDepositMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                            {updateDepositMutation.isPending ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateDepositMutation.mutate({ id: deposit.id, status: 'rejected' })}
                            data-testid={`button-reject-${deposit.id}`}
                            disabled={updateDepositMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                            {updateDepositMutation.isPending ? 'Processing...' : 'Reject'}
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

        {/* Dapps Management */}
        <TabsContent value="dapps" className="space-y-6">
          <DappsManagementPanel />
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-6">
          <UsersManagementPanel />
        </TabsContent>

        {/* NFT Mint */}
        <TabsContent value="nft-mint" className="space-y-6">
          <NFTMintingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Dapps Management Panel Component
function DappsManagementPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCost, setEditingCost] = useState<string | null>(null);
  const [tempCost, setTempCost] = useState("");
  const { tokenSymbol } = useTokenInfo();

  const { data: dappSettings = [] } = useQuery<any[]>({
    queryKey: ["/api/dapps/settings"],
  });

  const updateDappMutation = useMutation({
    mutationFn: async ({ appName, isEnabled }: { appName: string; isEnabled: boolean }) => {
      return apiRequest("PUT", `/api/admin/dapps/${appName}`, { isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dapps/settings"] });
      toast({
        title: "Success",
        description: "Dapp settings updated successfully",
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

  const updateDappCostMutation = useMutation({
    mutationFn: async ({ appName, cost }: { appName: string; cost: number }) => {
      return apiRequest("PUT", `/api/admin/dapps/${appName}/cost`, { cost });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dapps/settings"] });
      setEditingCost(null);
      setTempCost("");
      toast({
        title: "Success", 
        description: "Dapp cost updated successfully",
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

  const handleEditCost = (appName: string, currentCost: string) => {
    setEditingCost(appName);
    setTempCost(currentCost);
  };

  const handleSaveCost = (appName: string) => {
    const cost = parseFloat(tempCost);
    if (isNaN(cost) || cost < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
    updateDappCostMutation.mutate({ appName, cost });
  };

  const handleCancelEdit = () => {
    setEditingCost(null);
    setTempCost("");
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-800">Dapps Settings</CardTitle>
        <CardDescription className="text-gray-600">
          Enable or disable decentralized applications for users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {dappSettings.map((dapp: any) => (
          <div key={dapp.appName} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {dapp.appName === 'nft_mint' ? 'NFT Mint' : 'Memes Generator'}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {dapp.description}
                </p>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Cost:</span> 
                  {editingCost === dapp.appName ? (
                    <div className="inline-flex items-center space-x-2 ml-2">
                      <Input
                        type="number"
                        value={tempCost}
                        onChange={(e) => setTempCost(e.target.value)}
                        className="w-24 h-6 text-xs border-gray-300 bg-white"
                        data-testid={`input-cost-${dapp.appName}`}
                      />
                      <span className="text-xs">{tokenSymbol}</span>
                      <Button
                        size="sm"
                        onClick={() => handleSaveCost(dapp.appName)}
                        disabled={updateDappCostMutation.isPending}
                        className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                        data-testid={`button-save-cost-${dapp.appName}`}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={updateDappCostMutation.isPending}
                        className="h-6 px-2 text-xs border-gray-300"
                        data-testid={`button-cancel-cost-${dapp.appName}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-2 ml-2">
                      <span>{parseFloat(dapp.cost).toLocaleString()} {tokenSymbol} tokens</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCost(dapp.appName, dapp.cost)}
                        className="h-6 px-2 text-xs border-gray-300 hover:bg-gray-50"
                        data-testid={`button-edit-cost-${dapp.appName}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
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
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className={`text-sm font-medium ${
                  dapp.isEnabled ? 'text-green-600' : 'text-gray-500'
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
  const queryClient = useQueryClient();
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenReason, setTokenReason] = useState("");
  const { tokenSymbol } = useTokenInfo();

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
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <div className="text-gray-600">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-800">User Management</CardTitle>
        <CardDescription className="text-gray-600">
          Manage user accounts and token balances. Users can add their BEP-20 withdrawal address in their profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user: any) => (
            <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                  <div className="font-medium text-gray-900">{user.name || user.email}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  {user.isAdmin && (
                    <Badge className="mt-1 bg-purple-100 text-purple-700 border-purple-200">Admin</Badge>
                  )}
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-500">Token Balance</div>
                  <div className="font-bold text-green-600">
                    {parseFloat(user.tokenBalance || '0').toLocaleString()} {tokenSymbol}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-500">Withdrawal Address</div>
                  <div className="text-sm text-gray-900">
                    {user.withdrawalAddress ? (
                      <span className="break-all font-mono text-xs">{user.withdrawalAddress}</span>
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </div>
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
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <div>No users found</div>
            </div>
          )}
        </div>
        
        {/* Token Management Form */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Amount ({tokenSymbol})</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                className="mt-1 bg-gray-50 border-gray-300"
                data-testid="input-token-amount"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Reason</label>
              <Input
                placeholder="Optional reason"
                value={tokenReason}
                onChange={(e) => setTokenReason(e.target.value)}
                className="mt-1 bg-gray-50 border-gray-300"
                data-testid="input-token-reason"
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                Fill in amount and reason, then click Send or Deduct for any user above
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// NFT Minting Panel Component  
function NFTMintingPanel() {
  const { toast } = useToast();
  const [nftTheme, setNftTheme] = useState("");
  const [nftRarity, setNftRarity] = useState("Common");
  const [nftQuantity, setNftQuantity] = useState(1);
  const [uniquenessResult, setUniquenessResult] = useState(null);
  const [checkingUniqueness, setCheckingUniqueness] = useState(false);
  const [skipUniquenessCheck, setSkipUniquenessCheck] = useState(false);
  
  // Auto minting states
  const [autoMinting, setAutoMinting] = useState(false);
  const [isAutoMinting, setIsAutoMinting] = useState(false);
  const [autoMintQuantity, setAutoMintQuantity] = useState(10);
  const [mintedCount, setMintedCount] = useState(0);
  const [autoMintTarget, setAutoMintTarget] = useState(0);
  
  // NFT Trait States based on user specifications
  const [nftExpression, setNftExpression] = useState("Serious");
  const [nftMouth, setNftMouth] = useState("Normal");
  const [nftEyewear, setNftEyewear] = useState("Black sunglasses");
  const [nftBeard, setNftBeard] = useState("Thick curled beard");
  const [nftHairStyle, setNftHairStyle] = useState("Messy gray");
  const [nftBackground, setNftBackground] = useState("Yellow");
  const [nftAccessories, setNftAccessories] = useState("");
  
  const { tokenSymbol } = useTokenInfo();

  // Random trait generation functions
  const getRandomTrait = (options: string[]) => {
    return options[Math.floor(Math.random() * options.length)];
  };

  const generateRandomTraits = () => {
    const expressions = ['Serious', 'Smiling', 'Angry', 'Surprised', 'Bored', 'Excited', 'Confident'];
    const mouths = ['Normal', 'Cigarette', 'Cigar', 'Pipe'];
    const eyewear = ['Black sunglasses', 'Colored sunglasses', 'No glasses', 'Round glasses', 'Dollar eyes'];
    const beards = ['Thick curled beard', 'Short beard', 'Goatee'];
    const hairStyles = ['Messy gray', 'Styled gray', 'Long gray', 'Wavy gray'];
    const backgrounds = ['Yellow', 'Blue', 'Red', 'Green', 'Purple', 'Orange', 'Pink', 'Cosmic', 'Neon city'];
    
    return {
      expression: getRandomTrait(expressions),
      mouth: getRandomTrait(mouths),
      eyewear: getRandomTrait(eyewear),
      beard: getRandomTrait(beards),
      hairStyle: getRandomTrait(hairStyles),
      background: getRandomTrait(backgrounds),
      accessories: Math.random() < 0.3 ? getRandomTrait(['Golden chain', 'Silver watch', 'Diamond ring', '']) : '',
      customTheme: Math.random() < 0.2 ? getRandomTrait(['Cyberpunk', 'Medieval', 'Futuristic', 'Steampunk']) : ''
    };
  };

  const getRandomRarity = () => {
    const rand = Math.random() * 100;
    if (rand < 50) return "Common";
    if (rand < 80) return "Rare"; // 30%
    if (rand < 95) return "Unique"; // 15% (changed from Epic to Unique as requested)
    return "Legendary"; // 5%
  };

  // Fetch website settings to show current NFT character and limits
  const { data: websiteSettings } = useQuery<any>({
    queryKey: ["/api/website/settings"],
  });

  // Check uniqueness mutation
  const checkUniquenessMutation = useMutation({
    mutationFn: async (traits: any) => {
      const response = await apiRequest("POST", "/api/admin/check-nft-uniqueness", { traits });
      return response.json();
    },
    onSuccess: (data) => {
      setUniquenessResult(data);
      setCheckingUniqueness(false);
      if (data.isUnique) {
        toast({ 
          title: "✅ Traits are Unique!", 
          description: "This combination hasn't been used before", 
        });
      } else {
        toast({ 
          title: "⚠️ Traits Already Exist", 
          description: `Found ${data.existingNFTs.length} similar NFT(s)`, 
          variant: "destructive" 
        });
      }
    },
    onError: (error: any) => {
      setCheckingUniqueness(false);
      toast({ title: "Failed to check uniqueness", description: error.message, variant: "destructive" });
    },
  });

  // Auto minting mutation
  const autoMintSingleMutation = useMutation({
    mutationFn: async ({ traits, rarity }: { traits: any; rarity: string }) => {
      const requestData = { 
        traits, 
        rarity, 
        quantity: 1,
        skipUniquenessCheck: true // Skip uniqueness for auto minting
      };
      
      console.log('=== CLIENT AUTO MINT REQUEST ===');
      console.log('Sending auto mint request:', JSON.stringify(requestData, null, 2));
      console.log('Traits object keys:', Object.keys(traits));
      console.log('Traits object values:', Object.values(traits));
      
      return apiRequest("POST", "/api/admin/mint-nft", requestData);
    },
    onSuccess: () => {
      setMintedCount(prev => prev + 1);
      if (mintedCount + 1 < autoMintTarget && isAutoMinting) {
        // Continue auto minting with delay
        setTimeout(() => {
          autoMintNext();
        }, 2000); // 2 second delay between mints
      } else {
        // Stop auto minting
        setIsAutoMinting(false);
        toast({ 
          title: "Auto Minting Complete!", 
          description: `Successfully minted ${mintedCount + 1} NFT(s)` 
        });
      }
    },
    onError: (error: any) => {
      setIsAutoMinting(false);
      toast({ 
        title: "Auto Minting Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Auto mint next NFT
  const autoMintNext = () => {
    if (!isAutoMinting) return;
    
    const randomTraits = generateRandomTraits();
    const randomRarity = getRandomRarity();
    
    autoMintSingleMutation.mutate({
      traits: randomTraits,
      rarity: randomRarity
    });
  };

  // Start auto minting
  const startAutoMinting = () => {
    if (!websiteSettings?.nftCharacterPrompt) {
      toast({
        title: "Error",
        description: "Please set the NFT character prompt in Website Settings first",
        variant: "destructive",
      });
      return;
    }
    
    setIsAutoMinting(true);
    setMintedCount(0);
    setAutoMintTarget(autoMintQuantity);
    
    toast({ 
      title: "Auto Minting Started!", 
      description: `Will mint ${autoMintQuantity} random NFTs` 
    });
    
    // Start first mint
    setTimeout(() => autoMintNext(), 1000);
  };

  // Stop auto minting
  const stopAutoMinting = () => {
    setIsAutoMinting(false);
    toast({ 
      title: "Auto Minting Stopped", 
      description: `Minted ${mintedCount} out of ${autoMintTarget} NFTs` 
    });
  };

  const mintNftMutation = useMutation({
    mutationFn: async ({ traits, rarity, quantity, skipUniquenessCheck }: { traits: any; rarity: string; quantity: number; skipUniquenessCheck: boolean }) => {
      const requestData = { 
        traits, 
        rarity, 
        quantity,
        skipUniquenessCheck 
      };
      
      console.log('=== CLIENT REGULAR MINT REQUEST ===');
      console.log('Sending regular mint request:', JSON.stringify(requestData, null, 2));
      console.log('Traits object keys:', Object.keys(traits));
      console.log('Traits object values:', Object.values(traits));
      
      return apiRequest("POST", "/api/admin/mint-nft", requestData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: `Successfully minted ${nftQuantity} NFT(s) with detailed traits`,
      });
      setNftTheme("");
      setNftRarity("Common");
      setNftQuantity(1);
      setUniquenessResult(null);
      setSkipUniquenessCheck(false);
      // Reset traits to defaults
      setNftExpression("Serious");
      setNftMouth("Normal");
      setNftEyewear("Black sunglasses");
      setNftBeard("Thick curled beard");
      setNftHairStyle("Messy gray");
      setNftBackground("Yellow");
      setNftAccessories("");
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
    if (!websiteSettings?.nftCharacterPrompt) {
      toast({
        title: "Error",
        description: "Please set the NFT character prompt in Website Settings first",
        variant: "destructive",
      });
      return;
    }
    
    const traits = {
      expression: nftExpression,
      mouth: nftMouth,
      eyewear: nftEyewear,
      beard: nftBeard,
      hairStyle: nftHairStyle,
      background: nftBackground,
      accessories: nftAccessories.trim() || undefined,
      customTheme: nftTheme.trim() || undefined
    };
    
    mintNftMutation.mutate({ 
      traits, 
      rarity: nftRarity,
      quantity: nftQuantity,
      skipUniquenessCheck 
    });
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-800">Admin NFT Minting</CardTitle>
        <CardDescription className="text-gray-600">
          Mint NFTs with AI-generated descriptions. These will be stored in the database and can be moved to blockchain post-presale.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trait Selection Column 1 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 border-b pb-2">Character Traits</h4>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Expression</label>
              <Select value={nftExpression} onValueChange={setNftExpression}>
                <SelectTrigger className="mt-1 bg-gray-50 border-gray-300" data-testid="select-nft-expression">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Serious">Serious (base)</SelectItem>
                  <SelectItem value="Smiling">Smiling 😎</SelectItem>
                  <SelectItem value="Angry">Angry</SelectItem>
                  <SelectItem value="Surprised">Surprised</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Mouth / Extras</label>
              <Select value={nftMouth} onValueChange={setNftMouth}>
                <SelectTrigger className="mt-1 bg-gray-50 border-gray-300" data-testid="select-nft-mouth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Cigarette">Cigarette</SelectItem>
                  <SelectItem value="Cigar">Cigar</SelectItem>
                  <SelectItem value="Pipe">Pipe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Eyewear</label>
              <Select value={nftEyewear} onValueChange={setNftEyewear}>
                <SelectTrigger className="mt-1 bg-gray-50 border-gray-300" data-testid="select-nft-eyewear">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Black sunglasses">Black sunglasses (base)</SelectItem>
                  <SelectItem value="Colored sunglasses">Colored sunglasses</SelectItem>
                  <SelectItem value="No glasses">No glasses</SelectItem>
                  <SelectItem value="Round glasses">Round glasses</SelectItem>
                  <SelectItem value="Dollar eyes">Dollar eyes (when no glasses)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Trait Selection Column 2 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 border-b pb-2">Style & Appearance</h4>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Beard / Mustache</label>
              <Select value={nftBeard} onValueChange={setNftBeard}>
                <SelectTrigger className="mt-1 bg-gray-50 border-gray-300" data-testid="select-nft-beard">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Thick curled beard">Thick curled beard (base)</SelectItem>
                  <SelectItem value="Short beard">Short beard</SelectItem>
                  <SelectItem value="Goatee">Goatee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Hair Style / Color</label>
              <Select value={nftHairStyle} onValueChange={setNftHairStyle}>
                <SelectTrigger className="mt-1 bg-gray-50 border-gray-300" data-testid="select-nft-hair">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Messy gray">Messy gray (base)</SelectItem>
                  <SelectItem value="Black">Black</SelectItem>
                  <SelectItem value="Brown">Brown</SelectItem>
                  <SelectItem value="Blonde">Blonde</SelectItem>
                  <SelectItem value="Blue">Colored (blue)</SelectItem>
                  <SelectItem value="Purple">Colored (purple)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Background</label>
              <Select value={nftBackground} onValueChange={setNftBackground}>
                <SelectTrigger className="mt-1 bg-gray-50 border-gray-300" data-testid="select-nft-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yellow">Yellow</SelectItem>
                  <SelectItem value="Red">Red</SelectItem>
                  <SelectItem value="Blue">Blue</SelectItem>
                  <SelectItem value="Green">Green</SelectItem>
                  <SelectItem value="Gradient">Gradient</SelectItem>
                  <SelectItem value="Stripes">Patterned (stripes)</SelectItem>
                  <SelectItem value="Dots">Patterned (dots)</SelectItem>
                  <SelectItem value="Waves">Patterned (waves)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Settings Column */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 border-b pb-2">Generation Settings</h4>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Accessories (Optional)</label>
              <Input
                placeholder="e.g., Hat, Earrings, Chains, Headphones..."
                value={nftAccessories}
                onChange={(e) => setNftAccessories(e.target.value)}
                className="mt-1 bg-gray-50 border-gray-300"
                data-testid="input-nft-accessories"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional extra accessories for variety
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Custom Theme (Optional)</label>
              <Input
                placeholder="e.g., Space warrior, Cyber punk..."
                value={nftTheme}
                onChange={(e) => setNftTheme(e.target.value)}
                className="mt-1 bg-gray-50 border-gray-300"
                data-testid="input-nft-theme"
              />
              <p className="text-xs text-gray-500 mt-1">
                Additional theme overlay
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Rarity</label>
              <Select value={nftRarity} onValueChange={setNftRarity}>
                <SelectTrigger className="mt-1 bg-gray-50 border-gray-300" data-testid="select-nft-rarity">
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
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={nftQuantity}
                onChange={(e) => setNftQuantity(parseInt(e.target.value) || 1)}
                className="mt-1 bg-gray-50 border-gray-300"
                data-testid="input-nft-quantity"
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate multiple NFTs (max 100)
              </p>
            </div>
          </div>
        </div>
        
        {/* NFT Preview Section */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-6">
          <h4 className="font-medium text-gray-800 mb-3">NFT Generation Preview</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Character Description */}
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-600 mb-2">Base Character</div>
              <div className="text-sm font-medium text-gray-800 mb-2">
                {websiteSettings?.nftCharacterPrompt || (
                  <span className="text-red-600">⚠️ Set character prompt in Website Settings first</span>
                )}
              </div>
              
              <div className="space-y-1 text-xs text-gray-700">
                <div><span className="font-medium">Expression:</span> {nftExpression}</div>
                <div><span className="font-medium">Mouth:</span> {nftMouth}</div>
                <div><span className="font-medium">Eyewear:</span> {nftEyewear}</div>
                <div><span className="font-medium">Beard:</span> {nftBeard}</div>
                <div><span className="font-medium">Hair:</span> {nftHairStyle}</div>
                <div><span className="font-medium">Background:</span> {nftBackground}</div>
                {nftAccessories && <div><span className="font-medium">Accessories:</span> {nftAccessories}</div>}
                {nftTheme && <div><span className="font-medium">Custom Theme:</span> {nftTheme}</div>}
              </div>
            </div>
            
            {/* Generation Settings */}
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-600 mb-2">Generation Details</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rarity:</span>
                  <span className="font-medium">{nftRarity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{nftQuantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Collection Limit:</span>
                  <span className="font-medium">{websiteSettings?.maxNfts?.toLocaleString() || "Not set"}</span>
                </div>
              </div>
              
              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                <div className="text-xs text-blue-600 font-medium mb-1">🎨 AI Generation</div>
                <div className="text-xs text-gray-700">
                  Each NFT will combine the base character with selected traits for unique AI artwork and metadata.
                </div>
              </div>
            </div>
          </div>
        </div>
        
        
        {/* Uniqueness Check Section */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mt-6">
          <h4 className="font-medium text-gray-800 mb-3">🔍 Uniqueness Validation</h4>
          
          <div className="flex flex-wrap gap-3 items-center mb-3">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                const traits = {
                  expression: nftExpression,
                  mouth: nftMouth,
                  eyewear: nftEyewear,
                  beard: nftBeard,
                  hairStyle: nftHairStyle,
                  background: nftBackground,
                  accessories: nftAccessories,
                  customTheme: nftTheme
                };
                setCheckingUniqueness(true);
                checkUniquenessMutation.mutate(traits);
              }}
              disabled={checkingUniqueness}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              data-testid="button-check-uniqueness"
            >
              {checkingUniqueness ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-3 w-3" />
                  Check Uniqueness
                </>
              )}
            </Button>
            
            <div className="flex items-center space-x-2">
              <Switch 
                checked={skipUniquenessCheck}
                onCheckedChange={setSkipUniquenessCheck}
                data-testid="switch-skip-uniqueness"
              />
              <label className="text-sm text-gray-700">Skip Uniqueness Check</label>
            </div>
          </div>
          
          {/* Uniqueness Results */}
          {uniquenessResult && (
            <div className={`p-3 rounded border mt-3 ${
              uniquenessResult.isUnique ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                {uniquenessResult.isUnique ? (
                  <Check className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <X className="h-4 w-4 text-red-600 mr-2" />
                )}
                <span className={`font-medium text-sm ${
                  uniquenessResult.isUnique ? 'text-green-800' : 'text-red-800'
                }`}>
                  {uniquenessResult.message}
                </span>
              </div>
              
              {!uniquenessResult.isUnique && uniquenessResult.existingNFTs?.length > 0 && (
                <div className="text-xs text-gray-700 mt-2">
                  <strong>Similar NFTs found:</strong>
                  {uniquenessResult.existingNFTs.slice(0, 3).map((nft: any, index: number) => (
                    <div key={index} className="mt-1 pl-2 border-l border-gray-300">
                      • {nft.name} (Token #{nft.tokenId})
                    </div>
                  ))}
                  {uniquenessResult.existingNFTs.length > 3 && (
                    <div className="text-xs text-gray-500 mt-1">
                      ... and {uniquenessResult.existingNFTs.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Auto Minting Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200 mt-6">
          <h4 className="font-medium text-gray-800 mb-4 flex items-center">
            <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
            Auto NFT Minting
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto Minting Controls */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Switch 
                  checked={autoMinting}
                  onCheckedChange={setAutoMinting}
                  disabled={isAutoMinting}
                  data-testid="switch-auto-minting"
                />
                <label className="text-sm font-medium text-gray-700">
                  Enable Auto Minting
                </label>
              </div>
              
              {autoMinting && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Quantity to Mint</label>
                    <Input
                      type="number"
                      min="2"
                      max="100"
                      value={autoMintQuantity}
                      onChange={(e) => setAutoMintQuantity(parseInt(e.target.value) || 2)}
                      disabled={isAutoMinting}
                      className="mt-1 bg-white"
                      data-testid="input-auto-mint-quantity"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Min: 2, Max: 100 NFTs
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    {!isAutoMinting ? (
                      <Button 
                        onClick={startAutoMinting}
                        disabled={!websiteSettings?.nftCharacterPrompt || autoMintQuantity < 2}
                        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                        data-testid="button-start-auto-mint"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Keep Minting ({autoMintQuantity})
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopAutoMinting}
                        variant="destructive"
                        data-testid="button-stop-auto-mint"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Stop Auto Minting
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Auto Minting Status */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-xs text-gray-600 mb-2">Auto Minting Status</div>
              
              {isAutoMinting ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">🟢 Active</span>
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                      <span className="text-sm text-gray-700">Minting...</span>
                    </div>
                  </div>
                  
                  <div className="text-2xl font-bold text-blue-600">
                    {mintedCount} / {autoMintTarget}
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(mintedCount / autoMintTarget) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    Progress: {Math.round((mintedCount / autoMintTarget) * 100)}%
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-sm text-gray-500">🔴 Inactive</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Enable auto minting to start
                  </div>
                </div>
              )}
              
              <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
                <strong>Rarity Distribution:</strong><br />
                50% Common, 30% Rare, 15% Unique, 5% Legendary
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200 mt-6">
          <Button 
            onClick={handleMintNft}
            disabled={mintNftMutation.isPending || !websiteSettings?.nftCharacterPrompt}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
            data-testid="button-mint-nft"
          >
            {mintNftMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Minting...
              </>
            ) : (
              `Mint ${nftQuantity} NFT${nftQuantity > 1 ? 's' : ''} with Selected Traits`
            )}
          </Button>
          
          <div className="mt-2 text-xs text-gray-500">
            {skipUniquenessCheck ? (
              <span className="text-orange-600">⚠️ Uniqueness check skipped - duplicates may be created</span>
            ) : (
              <>NFTs will be stored in database with unique trait combinations. Users can purchase them during presale.</>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}