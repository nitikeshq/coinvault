import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Coins, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StakingConfig {
  tokenApr: string;
  nftApr: string;
  minStakingDays: number;
  maxStakingDays: number;
  isEnabled: boolean;
}

interface UserStaking {
  id: string;
  stakingType: string;
  tokenAmount: string;
  nftId: string | null;
  apr: string;
  stakingDays: number;
  startDate: string;
  endDate: string;
  totalInterest: string;
  accruedInterest: string;
  status: string;
  createdAt: string;
}

interface UserNft {
  id: string;
  nftId: string;
  mintedAt: string;
  nft: {
    name: string;
    imageUrl: string;
    rarity: string;
  };
}

export default function StakingDapp() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stakingType, setStakingType] = useState<"token" | "nft">("token");
  const [tokenAmount, setTokenAmount] = useState("");
  const [selectedNft, setSelectedNft] = useState("");
  const [stakingDays, setStakingDays] = useState(30);

  // Fetch staking configuration
  const { data: stakingConfig } = useQuery<StakingConfig>({
    queryKey: ["/api/staking/config"],
    retry: false,
  });

  // Fetch user's token balance
  const { data: tokenBalance } = useQuery<{ balance: string; usdValue: string }>({
    queryKey: ["/api/user/token/balance"],
    retry: false,
  });

  // Fetch user's NFTs (not staked)
  const { data: userNfts = [] } = useQuery<UserNft[]>({
    queryKey: ["/api/user/nfts/available"],
    retry: false,
  });

  // Fetch user's active stakings
  const { data: userStakings = [] } = useQuery<UserStaking[]>({
    queryKey: ["/api/staking/user"],
    retry: false,
  });

  // Create staking mutation
  const createStakingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/staking/create", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Staking Created",
        description: "Your staking has been created successfully!",
      });
      setTokenAmount("");
      setSelectedNft("");
      queryClient.invalidateQueries({ queryKey: ["/api/staking/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/token/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/nfts/available"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create staking",
        variant: "destructive",
      });
    },
  });

  // Withdraw staking mutation
  const withdrawStakingMutation = useMutation({
    mutationFn: async (stakingId: string) => {
      return apiRequest(`/api/staking/${stakingId}/withdraw`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Staking Withdrawn",
        description: "Your staking has been withdrawn successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staking/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/token/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/nfts/available"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to withdraw staking",
        variant: "destructive",
      });
    },
  });

  if (!stakingConfig?.isEnabled) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Staking Not Available</h3>
            <p className="text-muted-foreground">
              Staking is currently disabled. Please check back later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStake = () => {
    if (stakingType === "token") {
      if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid token amount",
          variant: "destructive",
        });
        return;
      }
      
      if (parseFloat(tokenAmount) > parseFloat(tokenBalance?.balance || "0")) {
        toast({
          title: "Error",
          description: "Insufficient token balance",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!selectedNft) {
        toast({
          title: "Error",
          description: "Please select an NFT to stake",
          variant: "destructive",
        });
        return;
      }
    }

    if (stakingDays < (stakingConfig?.minStakingDays || 30) || 
        stakingDays > (stakingConfig?.maxStakingDays || 365)) {
      toast({
        title: "Error",
        description: `Staking period must be between ${stakingConfig?.minStakingDays} and ${stakingConfig?.maxStakingDays} days`,
        variant: "destructive",
      });
      return;
    }

    const data = {
      stakingType,
      stakingDays,
      ...(stakingType === "token" 
        ? { tokenAmount: parseFloat(tokenAmount) }
        : { nftId: selectedNft }
      )
    };

    createStakingMutation.mutate(data);
  };

  const calculateInterest = (principal: number, apr: number, days: number) => {
    return (principal * (apr / 100) * days) / 365;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const canWithdraw = (endDate: string) => {
    return getDaysRemaining(endDate) === 0;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" data-testid="staking-title">Staking</h1>
        <p className="text-muted-foreground">
          Stake your tokens or NFTs to earn rewards
        </p>
      </div>

      <Tabs defaultValue="stake" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stake" data-testid="tab-stake">Stake</TabsTrigger>
          <TabsTrigger value="my-stakings" data-testid="tab-my-stakings">My Stakings</TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="space-y-6">
          {/* Staking Options */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className={`cursor-pointer transition-all ${stakingType === "token" ? "ring-2 ring-blue-500" : ""}`} 
                  onClick={() => setStakingType("token")} data-testid="card-token-staking">
              <CardHeader className="text-center">
                <Coins className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <CardTitle>Token Staking</CardTitle>
                <CardDescription>
                  APR: {stakingConfig?.tokenApr}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Stake your tokens and earn daily rewards
                </p>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all ${stakingType === "nft" ? "ring-2 ring-blue-500" : ""}`} 
                  onClick={() => setStakingType("nft")} data-testid="card-nft-staking">
              <CardHeader className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <CardTitle>NFT Staking</CardTitle>
                <CardDescription>
                  APR: {stakingConfig?.nftApr}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Stake your NFTs for higher rewards
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Staking Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {stakingType === "token" ? "Stake Tokens" : "Stake NFT"}
              </CardTitle>
              <CardDescription>
                Configure your staking options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stakingType === "token" ? (
                <div className="space-y-2">
                  <Label htmlFor="token-amount">Token Amount</Label>
                  <Input
                    id="token-amount"
                    type="number"
                    placeholder="Enter amount to stake"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    data-testid="input-token-amount"
                  />
                  <p className="text-sm text-muted-foreground">
                    Available: {tokenBalance?.balance || "0"} tokens
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="nft-select">Select NFT</Label>
                  <Select value={selectedNft} onValueChange={setSelectedNft}>
                    <SelectTrigger data-testid="select-nft">
                      <SelectValue placeholder="Choose an NFT to stake" />
                    </SelectTrigger>
                    <SelectContent>
                      {userNfts.map((userNft) => (
                        <SelectItem key={userNft.id} value={userNft.id}>
                          {userNft.nft.name} ({userNft.nft.rarity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {userNfts.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No NFTs available for staking
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="staking-days">Staking Period (Days)</Label>
                <Input
                  id="staking-days"
                  type="number"
                  min={stakingConfig?.minStakingDays}
                  max={stakingConfig?.maxStakingDays}
                  value={stakingDays}
                  onChange={(e) => setStakingDays(parseInt(e.target.value) || 30)}
                  data-testid="input-staking-days"
                />
                <p className="text-sm text-muted-foreground">
                  Range: {stakingConfig?.minStakingDays} - {stakingConfig?.maxStakingDays} days
                </p>
              </div>

              {/* Estimated Rewards */}
              {(stakingType === "token" ? tokenAmount : selectedNft) && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-semibold">Estimated Rewards</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Principal:</span>
                      <span>
                        {stakingType === "token" 
                          ? `${tokenAmount} tokens`
                          : "1 NFT"
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>APR:</span>
                      <span>
                        {stakingType === "token" 
                          ? stakingConfig?.tokenApr
                          : stakingConfig?.nftApr
                        }%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{stakingDays} days</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total Interest:</span>
                      <span>
                        {stakingType === "token" && tokenAmount
                          ? calculateInterest(
                              parseFloat(tokenAmount),
                              parseFloat(stakingConfig?.tokenApr || "0"),
                              stakingDays
                            ).toFixed(4)
                          : selectedNft
                          ? calculateInterest(
                              1,
                              parseFloat(stakingConfig?.nftApr || "0"),
                              stakingDays
                            ).toFixed(4)
                          : "0"
                        } tokens
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleStake}
                disabled={createStakingMutation.isPending}
                className="w-full"
                data-testid="button-create-staking"
              >
                {createStakingMutation.isPending ? "Creating..." : "Start Staking"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-stakings" className="space-y-6">
          {userStakings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Active Stakings</h3>
                <p className="text-muted-foreground">
                  You don't have any active stakings yet. Start staking to earn rewards!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {userStakings.map((staking) => (
                <Card key={staking.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {staking.stakingType === "token" ? "Token Staking" : "NFT Staking"}
                        </CardTitle>
                        <CardDescription>
                          Started on {formatDate(staking.startDate)}
                        </CardDescription>
                      </div>
                      <Badge variant={staking.status === "active" ? "default" : "secondary"}>
                        {staking.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-semibold">
                          {staking.stakingType === "token" 
                            ? `${staking.tokenAmount} tokens`
                            : "1 NFT"
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">APR</p>
                        <p className="font-semibold">{staking.apr}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-semibold">{staking.stakingDays} days</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">End Date</p>
                        <p className="font-semibold">{formatDate(staking.endDate)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Accrued Interest</p>
                        <p className="font-semibold text-green-600">
                          {parseFloat(staking.accruedInterest).toFixed(4)} tokens
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Days Remaining</p>
                        <p className="font-semibold">
                          {getDaysRemaining(staking.endDate)} days
                        </p>
                      </div>
                    </div>

                    {staking.status === "active" && (
                      <div className="flex justify-end">
                        <Button
                          onClick={() => withdrawStakingMutation.mutate(staking.id)}
                          disabled={!canWithdraw(staking.endDate) || withdrawStakingMutation.isPending}
                          variant={canWithdraw(staking.endDate) ? "default" : "outline"}
                          data-testid={`button-withdraw-${staking.id}`}
                        >
                          {canWithdraw(staking.endDate) 
                            ? (withdrawStakingMutation.isPending ? "Withdrawing..." : "Withdraw")
                            : "Locked"
                          }
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}