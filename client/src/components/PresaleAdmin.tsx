import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Target, DollarSign, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PresaleConfig {
  id: string;
  targetAmount: string;
  currentAmount: string;
  initialLiquidity: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export function PresaleAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState<Partial<PresaleConfig>>({});

  const { data: presaleConfig, isLoading } = useQuery<PresaleConfig>({
    queryKey: ['/api/presale/config'],
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (config: Partial<PresaleConfig>) => {
      const res = await apiRequest('PUT', '/api/admin/presale/config', config);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presale/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/presale/progress'] });
      setIsEditing(false);
      setEditedConfig({});
      toast({
        title: "Success",
        description: "Presale configuration updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update presale configuration",
        variant: "destructive",
      });
    },
  });

  const updateLiquidityMutation = useMutation({
    mutationFn: async (currentAmount: string) => {
      const res = await apiRequest('POST', '/api/admin/presale/liquidity', { currentAmount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presale/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/presale/progress'] });
      toast({
        title: "Success",
        description: "Liquidity amount updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update liquidity",
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedConfig({
      targetAmount: presaleConfig?.targetAmount,
      initialLiquidity: presaleConfig?.initialLiquidity,
      endDate: presaleConfig?.endDate ? new Date(presaleConfig.endDate).toISOString().slice(0, 16) : '',
      isActive: presaleConfig?.isActive,
    });
  };

  const handleSaveChanges = () => {
    if (!editedConfig.targetAmount || !editedConfig.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    updateConfigMutation.mutate(editedConfig);
  };

  const handleUpdateLiquidity = () => {
    const amount = prompt("Enter new current liquidity amount:");
    if (amount && !isNaN(parseFloat(amount))) {
      updateLiquidityMutation.mutate(amount);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading presale configuration...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Presale Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isEditing ? (
            <>
              {/* Display Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4" />
                    Target Amount (USD)
                  </Label>
                  <div className="text-2xl font-bold text-green-600">
                    ${parseFloat(presaleConfig?.targetAmount || "0").toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4" />
                    Initial Liquidity (USD)
                  </Label>
                  <div className="text-2xl font-bold text-blue-600">
                    ${parseFloat(presaleConfig?.initialLiquidity || "0").toLocaleString()}
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    End Date
                  </Label>
                  <div className="text-lg font-semibold text-gray-700">
                    {presaleConfig?.endDate ? new Date(presaleConfig.endDate).toLocaleDateString() : "Not set"}
                  </div>
                </div>

                <div>
                  <Label className="mb-2">Status</Label>
                  <div className={`text-lg font-semibold ${presaleConfig?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {presaleConfig?.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleStartEdit} data-testid="button-edit-presale">
                  Edit Configuration
                </Button>
                <Button variant="outline" onClick={handleUpdateLiquidity}>
                  Update Current Liquidity
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="targetAmount">Target Amount (USD)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    value={editedConfig.targetAmount || ""}
                    onChange={(e) => setEditedConfig(prev => ({ ...prev, targetAmount: e.target.value }))}
                    placeholder="1000000"
                    data-testid="input-target-amount"
                  />
                </div>

                <div>
                  <Label htmlFor="initialLiquidity">Initial Liquidity (USD)</Label>
                  <Input
                    id="initialLiquidity"
                    type="number"
                    value={editedConfig.initialLiquidity || ""}
                    onChange={(e) => setEditedConfig(prev => ({ ...prev, initialLiquidity: e.target.value }))}
                    placeholder="50000"
                    data-testid="input-initial-liquidity"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={editedConfig.endDate || ""}
                    onChange={(e) => setEditedConfig(prev => ({ ...prev, endDate: e.target.value }))}
                    data-testid="input-end-date"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editedConfig.isActive || false}
                    onChange={(e) => setEditedConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4"
                    data-testid="checkbox-is-active"
                  />
                  <Label htmlFor="isActive">Presale is Active</Label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleSaveChanges} 
                  disabled={updateConfigMutation.isPending}
                  data-testid="button-save-config"
                >
                  {updateConfigMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedConfig({});
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Presale Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-600">Current Raised</div>
              <div className="text-2xl font-bold text-blue-600">
                ${parseFloat(presaleConfig?.currentAmount || "0").toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-600">Days Remaining</div>
              <div className="text-2xl font-bold text-orange-600">
                {presaleConfig?.endDate ? 
                  Math.max(0, Math.ceil((new Date(presaleConfig.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
                }
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-600">Progress</div>
              <div className="text-2xl font-bold text-green-600">
                {presaleConfig ? 
                  (((parseFloat(presaleConfig.currentAmount) + parseFloat(presaleConfig.initialLiquidity)) / parseFloat(presaleConfig.targetAmount)) * 100).toFixed(1) 
                  : 0
                }%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}