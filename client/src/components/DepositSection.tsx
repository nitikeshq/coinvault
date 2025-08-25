import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Copy, Upload, AlertTriangle, Wallet, CreditCard, Calculator } from "lucide-react";
import { useTokenInfo } from "@/hooks/useTokenInfo";

export default function DepositSection() {
  const { toast } = useToast();
  const { tokenConfig } = useTokenInfo();
  
  const [upiForm, setUpiForm] = useState({
    amount: "",
    utrId: "",
    screenshot: null as File | null,
  });
  
  const [bscForm, setBscForm] = useState({
    amount: "",
    transactionHash: "",
    screenshot: null as File | null,
  });

  const { data: user } = useQuery<any>({
    queryKey: ['/api/me'],
  });

  const { data: deposits = [] } = useQuery<any[]>({
    queryKey: ['/api/deposits'],
  });

  // Fetch enabled deposit settings
  const { data: depositSettings = [] } = useQuery<any[]>({
    queryKey: ['/api/deposit-settings'],
  });

  // Fetch token price for calculation
  const { data: tokenPrice } = useQuery<any>({
    queryKey: ['/api/token/price'],
  });

  // INR to USD conversion rate (approximately 83 INR = 1 USD)
  const INR_TO_USD_RATE = 83;

  // Calculate token amounts for USD (used for BSC deposits)
  const calculateTokens = (usdAmount: string) => {
    if (!usdAmount || !tokenPrice?.priceUsd) return "0";
    const amount = parseFloat(usdAmount);
    const price = parseFloat(tokenPrice.priceUsd);
    if (isNaN(amount) || isNaN(price) || price === 0) return "0";
    return (amount / price).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Calculate token amounts for INR (used for UPI deposits)
  const calculateTokensFromINR = (inrAmount: string) => {
    if (!inrAmount || !tokenPrice?.priceUsd) return "0";
    const amount = parseFloat(inrAmount);
    const price = parseFloat(tokenPrice.priceUsd);
    if (isNaN(amount) || isNaN(price) || price === 0) return "0";
    // Convert INR to USD first, then calculate tokens
    const usdAmount = amount / INR_TO_USD_RATE;
    return (usdAmount / price).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Get token price in INR
  const getTokenPriceInINR = () => {
    if (!tokenPrice?.priceUsd) return "0";
    const usdPrice = parseFloat(tokenPrice.priceUsd);
    return (usdPrice * INR_TO_USD_RATE).toFixed(2);
  };

  // UPI deposit mutation
  const upiDepositMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/deposits", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deposits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/balance'] });
      setUpiForm({ amount: "", utrId: "", screenshot: null });
      toast({
        title: "UPI deposit submitted!",
        description: "Your deposit request has been submitted for review.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication required",
          description: "Please log in to submit a deposit request.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission failed",
          description: error.message || "Failed to submit deposit request. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // BSC deposit mutation
  const bscDepositMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/deposits", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deposits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/balance'] });
      setBscForm({ amount: "", transactionHash: "", screenshot: null });
      toast({
        title: "BSC deposit submitted!",
        description: "Your deposit request has been submitted for review.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication required", 
          description: "Please log in to submit a deposit request.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission failed",
          description: error.message || "Failed to submit deposit request. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!upiForm.amount || !upiForm.utrId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('amount', upiForm.amount);
    formData.append('paymentMethod', 'upi');
    formData.append('utrId', upiForm.utrId);
    if (upiForm.screenshot) {
      formData.append('screenshot', upiForm.screenshot);
    }

    upiDepositMutation.mutate(formData);
  };

  const handleBscSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bscForm.amount || !bscForm.transactionHash) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('amount', bscForm.amount);
    formData.append('paymentMethod', 'bsc');
    formData.append('transactionHash', bscForm.transactionHash);
    if (bscForm.screenshot) {
      formData.append('screenshot', bscForm.screenshot);
    }

    bscDepositMutation.mutate(formData);
  };

  // Filter only enabled deposit settings
  const enabledSettings = depositSettings.filter((setting: any) => setting.isEnabled);

  if (enabledSettings.length === 0) {
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Deposit Tokens</h2>
            <p className="text-gray-600">Deposit functionality is currently not available</p>
          </div>
        </div>
      </section>
    );
  }

  const getFormDataByMethod = (method: string): any => {
    return method === 'upi' ? upiForm : bscForm;
  };

  const setFormDataByMethod = (method: string, data: any) => {
    if (method === 'upi') {
      setUpiForm(data);
    } else {
      setBscForm(data);
    }
  };

  const handleSubmitByMethod = (method: string) => {
    return method === 'upi' ? handleUpiSubmit : handleBscSubmit;
  };

  const getMutationByMethod = (method: string) => {
    return method === 'upi' ? upiDepositMutation : bscDepositMutation;
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Deposit Tokens</h2>
          <p className="text-gray-600">Send tokens to your wallet address or make a payment for instant deposit</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Deposit Form */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Make a Deposit</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={enabledSettings[0]?.paymentMethod} className="w-full">
                <TabsList className={`grid w-full bg-gray-100 ${enabledSettings.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {enabledSettings.map((setting: any) => (
                    <TabsTrigger 
                      key={setting.paymentMethod}
                      value={setting.paymentMethod} 
                      className={`text-gray-700 data-[state=active]:text-white ${
                        setting.paymentMethod === 'upi' 
                          ? 'data-[state=active]:bg-purple-600' 
                          : 'data-[state=active]:bg-blue-600'
                      }`}
                      data-testid={`tab-${setting.paymentMethod}`}
                    >
                      {setting.displayName}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Dynamic Deposit Method Tabs */}
                {enabledSettings.map((setting: any) => {
                  const formData = getFormDataByMethod(setting.paymentMethod);
                  const setFormData = setFormDataByMethod;
                  const handleSubmit = handleSubmitByMethod(setting.paymentMethod);
                  const mutation = getMutationByMethod(setting.paymentMethod);

                  return (
                    <TabsContent key={setting.paymentMethod} value={setting.paymentMethod} className="space-y-6 mt-6">
                      <div className={`${setting.paymentMethod === 'upi' ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'} border rounded-xl p-6`}>
                        <div className="flex items-center space-x-3 mb-6">
                          <div className={`w-12 h-12 ${setting.paymentMethod === 'upi' ? 'bg-purple-600' : 'bg-blue-600'} rounded-lg flex items-center justify-center`}>
                            {setting.paymentMethod === 'upi' ? (
                              <CreditCard className="h-6 w-6 text-white" />
                            ) : (
                              <Wallet className="h-6 w-6 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{setting.displayName}</h3>
                            <p className="text-sm text-gray-600">
                              {setting.description || 
                                (setting.paymentMethod === 'upi' 
                                  ? 'Pay via PhonePe, GPay, Paytm, or any UPI app' 
                                  : 'Send cryptocurrency to the wallet address'
                                )
                              }
                            </p>
                          </div>
                        </div>
                        
                        {/* QR Code */}
                        {setting.qrCodeUrl && (
                          <div className="text-center mb-6">
                            <div className="bg-white p-6 rounded-xl inline-block border border-gray-200 shadow-sm">
                              <img 
                                src={setting.qrCodeUrl} 
                                alt={`${setting.displayName} QR Code`} 
                                className="w-48 h-48 object-contain"
                                data-testid={`${setting.paymentMethod}-qr-code`}
                              />
                            </div>
                            <p className="text-sm text-gray-600 mt-3 font-medium">
                              {setting.paymentMethod === 'upi' ? 'Scan with any UPI app to pay' : 'Scan to send cryptocurrency'}
                            </p>
                          </div>
                        )}

                        {/* Wallet Address for non-UPI methods */}
                        {setting.paymentMethod !== 'upi' && setting.walletAddress && (
                          <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                            <p className="text-sm font-medium text-gray-800 mb-2">Wallet Address:</p>
                            <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                              <code className="text-sm font-mono text-gray-800 break-all flex-1" data-testid="wallet-address">
                                {setting.walletAddress}
                              </code>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(setting.walletAddress);
                                  toast({
                                    title: "Copied!",
                                    description: "Wallet address copied to clipboard",
                                  });
                                }}
                                data-testid="button-copy-address"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Payment Verification Form */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-yellow-800 mb-1">Payment Verification</p>
                            <p className="text-gray-700 text-xs">Enter your payment details for quick verification and instant token credit.</p>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor={`${setting.paymentMethod}-amount`} className="text-gray-700">
                            Deposit Amount ({setting.paymentMethod === 'upi' ? 'INR' : 'USD'}) *
                          </Label>
                          <Input
                            id={`${setting.paymentMethod}-amount`}
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData(setting.paymentMethod, { ...formData, amount: e.target.value })}
                            placeholder={`Enter amount in ${setting.paymentMethod === 'upi' ? 'INR' : 'USD'}`}
                            className="bg-gray-50 border-gray-300 text-gray-900"
                            data-testid={`input-${setting.paymentMethod}-amount`}
                            required
                          />
                          {formData.amount && tokenPrice && (
                            <div className={`mt-2 p-3 bg-gradient-to-r ${
                              setting.paymentMethod === 'upi' 
                                ? 'from-purple-50 to-blue-50 border-purple-200' 
                                : 'from-blue-50 to-indigo-50 border-blue-200'
                            } border rounded-lg`}>
                              <div className="flex items-center space-x-2">
                                <Calculator className={`h-4 w-4 ${setting.paymentMethod === 'upi' ? 'text-purple-600' : 'text-blue-600'}`} />
                                <span className={`text-sm font-medium ${setting.paymentMethod === 'upi' ? 'text-purple-800' : 'text-blue-800'}`}>Token Calculation</span>
                              </div>
                              <div className={`mt-1 text-lg font-bold ${setting.paymentMethod === 'upi' ? 'text-purple-900' : 'text-blue-900'}`} data-testid="text-token-calculation">
                                ≈ {setting.paymentMethod === 'upi' ? calculateTokensFromINR(formData.amount) : calculateTokens(formData.amount)} {(tokenConfig as any)?.tokenSymbol || "TOKEN"}
                              </div>
                              <div className={`text-xs mt-1 ${setting.paymentMethod === 'upi' ? 'text-purple-600' : 'text-blue-600'}`}>
                                {setting.paymentMethod === 'upi' 
                                  ? `At current rate: ₹${getTokenPriceInINR()} per ${(tokenConfig as any)?.tokenSymbol || "TOKEN"}`
                                  : `At current rate: $${parseFloat(tokenPrice?.priceUsd || "0").toFixed(4)} per ${(tokenConfig as any)?.tokenSymbol || "TOKEN"}`
                                }
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor={`${setting.paymentMethod}-ref`} className="text-gray-700">
                            {setting.paymentMethod === 'upi' ? 'UTR ID/Transaction Reference' : 'Transaction Hash'} *
                          </Label>
                          <Input
                            id={`${setting.paymentMethod}-ref`}
                            value={setting.paymentMethod === 'upi' ? (formData as any).utrId : (formData as any).transactionHash}
                            onChange={(e) => {
                              const field = setting.paymentMethod === 'upi' ? 'utrId' : 'transactionHash';
                              setFormData(setting.paymentMethod, { ...formData, [field]: e.target.value });
                            }}
                            placeholder={setting.paymentMethod === 'upi' ? 'Enter UTR ID from payment receipt' : 'Enter transaction hash (0x...)'}
                            className="bg-gray-50 border-gray-300 text-gray-900"
                            data-testid={`input-${setting.paymentMethod}-ref`}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`${setting.paymentMethod}-screenshot`} className="text-gray-700">Payment Screenshot (Optional)</Label>
                          <div className="mt-1 flex items-center space-x-2">
                            <Input
                              id={`${setting.paymentMethod}-screenshot`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setFormData(setting.paymentMethod, { ...formData, screenshot: file });
                              }}
                              className="bg-gray-50 border-gray-300 text-gray-900"
                              data-testid={`input-${setting.paymentMethod}-screenshot`}
                            />
                            <Upload className="h-5 w-5 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Upload a screenshot of your payment for faster verification
                          </p>
                        </div>

                        <Button
                          type="submit"
                          className={`w-full py-3 rounded-lg font-semibold transition-colors text-white ${
                            setting.paymentMethod === 'upi' 
                              ? 'bg-purple-600 hover:bg-purple-700' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          disabled={mutation.isPending}
                          data-testid={`button-submit-${setting.paymentMethod}`}
                        >
                          {mutation.isPending ? "Submitting..." : `Submit ${setting.displayName}`}
                        </Button>
                      </form>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>

          {/* Deposit History */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Recent Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {deposits.length > 0 ? (
                  deposits.map((deposit: any) => (
                    <div key={deposit.id} className="border border-gray-200 rounded-lg p-4" data-testid={`deposit-${deposit.id}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-block w-3 h-3 rounded-full ${
                            deposit.status === 'approved' ? 'bg-green-500' :
                            deposit.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></span>
                          <span className="font-medium text-gray-900">{deposit.paymentMethod?.toUpperCase() || 'BSC'}</span>
                        </div>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          deposit.status === 'approved' ? 'bg-green-100 text-green-800' :
                          deposit.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {deposit.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Amount: <span className="font-medium">${deposit.amount}</span></p>
                        <p>Date: {new Date(deposit.createdAt).toLocaleDateString()}</p>
                        {deposit.adminNotes && (
                          <p className="mt-1 text-xs text-gray-500">
                            Note: {deposit.adminNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No deposits found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}