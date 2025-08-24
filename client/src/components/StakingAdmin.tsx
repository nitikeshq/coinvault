import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, Save, AlertCircle, Coins, Users, Timer } from "lucide-react";

interface StakingConfig {
  tokenApr: string;
  nftApr: string;
  minStakingDays: number;
  maxStakingDays: number;
  isEnabled: boolean;
}

interface StakingOverview {
  totalActiveStakings: number;
  totalTokensStaked: string;
  totalNftsStaked: number;
  totalInterestPaid: string;
}

export default function StakingAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<StakingConfig>({
    tokenApr: "12.00",
    nftApr: "15.00",
    minStakingDays: 30,
    maxStakingDays: 365,
    isEnabled: false,
  });

  // Fetch staking configuration
  const { data: stakingConfig, isLoading } = useQuery<StakingConfig>({
    queryKey: ["/api/staking/config"],
    onSuccess: (data) => {
      if (data) {
        setConfig(data);
      }
    },
  });

  // Fetch staking overview
  const { data: overview } = useQuery<StakingOverview>({
    queryKey: ["/api/admin/staking/overview"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update staking configuration
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: StakingConfig) => {
      return apiRequest("/api/staking/config", {
        method: "POST",
        body: JSON.stringify(newConfig),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staking configuration updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staking/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staking/overview"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update staking configuration",
        variant: "destructive",
      });
    },
  });

  // Calculate interest manually
  const calculateInterestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/cron/calculate-interest", {
        method: "POST",
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Interest Calculated",
        description: `Processed ${data.result.processed} active stakings`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staking/overview"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate interest",
        variant: "destructive",
      });
    },
  });

  const handleConfigChange = (field: keyof StakingConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Validate configuration
    if (parseFloat(config.tokenApr) < 0 || parseFloat(config.tokenApr) > 1000) {
      toast({
        title: "Error",
        description: "Token APR must be between 0% and 1000%",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(config.nftApr) < 0 || parseFloat(config.nftApr) > 1000) {
      toast({
        title: "Error",
        description: "NFT APR must be between 0% and 1000%",
        variant: "destructive",
      });
      return;
    }

    if (config.minStakingDays < 1 || config.minStakingDays > config.maxStakingDays) {
      toast({
        title: "Error",
        description: "Invalid staking period range",
        variant: "destructive",
      });
      return;
    }

    updateConfigMutation.mutate(config);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading staking configuration...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staking Overview */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Stakings</p>
                  <p className="text-xl font-bold">{overview.totalActiveStakings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Tokens Staked</p>
                  <p className="text-xl font-bold">{parseFloat(overview.totalTokensStaked).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">NFTs Staked</p>
                  <p className="text-xl font-bold">{overview.totalNftsStaked}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Timer className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Interest Paid</p>
                  <p className="text-xl font-bold">{parseFloat(overview.totalInterestPaid).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staking Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Staking Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Staking */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-semibold">Enable Staking</h3>
              <p className="text-sm text-muted-foreground">
                Allow users to stake tokens and NFTs
              </p>
            </div>
            <Switch
              checked={config.isEnabled}
              onCheckedChange={(checked) => handleConfigChange('isEnabled', checked)}
              data-testid="switch-staking-enabled"
            />
          </div>

          {config.isEnabled && (
            <>
              {/* APR Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="token-apr">Token Staking APR (%)</Label>
                  <Input
                    id="token-apr"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000"
                    value={config.tokenApr}
                    onChange={(e) => handleConfigChange('tokenApr', e.target.value)}
                    data-testid="input-token-apr"
                  />
                  <p className="text-xs text-muted-foreground">
                    Annual percentage rate for token staking
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nft-apr">NFT Staking APR (%)</Label>
                  <Input
                    id="nft-apr"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000"
                    value={config.nftApr}
                    onChange={(e) => handleConfigChange('nftApr', e.target.value)}
                    data-testid="input-nft-apr"
                  />
                  <p className="text-xs text-muted-foreground">
                    Annual percentage rate for NFT staking
                  </p>
                </div>
              </div>

              {/* Staking Period Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-days">Minimum Staking Days</Label>
                  <Input
                    id="min-days"
                    type="number"
                    min="1"
                    max="365"
                    value={config.minStakingDays}
                    onChange={(e) => handleConfigChange('minStakingDays', parseInt(e.target.value) || 1)}
                    data-testid="input-min-days"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum number of days for staking
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-days">Maximum Staking Days</Label>
                  <Input
                    id="max-days"
                    type="number"
                    min="1"
                    max="3650"
                    value={config.maxStakingDays}
                    onChange={(e) => handleConfigChange('maxStakingDays', parseInt(e.target.value) || 365)}
                    data-testid="input-max-days"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of days for staking
                  </p>
                </div>
              </div>

              <Separator />

              {/* Admin Actions */}
              <div className="space-y-4">
                <h3 className="font-semibold">Admin Actions</h3>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={updateConfigMutation.isPending}
                    className="flex items-center space-x-2"
                    data-testid="button-save-staking-config"
                  >
                    <Save className="h-4 w-4" />
                    <span>
                      {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                    </span>
                  </Button>

                  <Button
                    onClick={() => calculateInterestMutation.mutate()}
                    disabled={calculateInterestMutation.isPending}
                    variant="outline"
                    className="flex items-center space-x-2"
                    data-testid="button-calculate-interest"
                  >
                    <Timer className="h-4 w-4" />
                    <span>
                      {calculateInterestMutation.isPending ? "Calculating..." : "Calculate Interest"}
                    </span>
                  </Button>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">Interest Calculation</p>
                      <p className="text-blue-700">
                        Interest is calculated daily for all active stakings. You can manually trigger 
                        calculation or set up a cron job to run the /api/cron/calculate-interest endpoint.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}