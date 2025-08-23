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
import { Copy, Upload, AlertTriangle, Wallet, CreditCard } from "lucide-react";
import upiQrImage from "../assets/upi_qr.png";
import bscQrImage from "../assets/bsc_qr.png";

export default function DepositSection() {
  const { toast } = useToast();
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
    queryKey: ['/api/auth/user'],
  });

  const { data: deposits = [] } = useQuery<any[]>({
    queryKey: ['/api/deposits'],
  });

  const upiDepositMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest('POST', '/api/deposits', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "UPI deposit request submitted successfully. Please wait for admin approval.",
      });
      setUpiForm({ amount: "", utrId: "", screenshot: null });
      queryClient.invalidateQueries({ queryKey: ['/api/deposits'] });
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
      toast({
        title: "Error",
        description: "Failed to submit UPI deposit request",
        variant: "destructive",
      });
    },
  });

  const bscDepositMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest('POST', '/api/deposits', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "BSC deposit request submitted successfully. Please wait for admin approval.",
      });
      setBscForm({ amount: "", transactionHash: "", screenshot: null });
      queryClient.invalidateQueries({ queryKey: ['/api/deposits'] });
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
      toast({
        title: "Error",
        description: "Failed to submit BSC deposit request",
        variant: "destructive",
      });
    },
  });

  const copyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleUpiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUpiForm(prev => ({ ...prev, screenshot: file }));
    }
  };

  const handleBscFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBscForm(prev => ({ ...prev, screenshot: file }));
    }
  };

  const handleUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!upiForm.amount || !upiForm.utrId) {
      toast({
        title: "Error",
        description: "Please enter deposit amount and UTR ID",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('amount', upiForm.amount);
    formData.append('transactionHash', upiForm.utrId);
    formData.append('paymentMethod', 'upi');
    if (upiForm.screenshot) {
      formData.append('screenshot', upiForm.screenshot);
    }

    upiDepositMutation.mutate(formData);
  };

  const handleBscSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bscForm.amount || !bscForm.transactionHash) {
      toast({
        title: "Error",
        description: "Please enter deposit amount and transaction hash",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('amount', bscForm.amount);
    formData.append('transactionHash', bscForm.transactionHash);
    formData.append('paymentMethod', 'bsc');
    if (bscForm.screenshot) {
      formData.append('screenshot', bscForm.screenshot);
    }

    bscDepositMutation.mutate(formData);
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Deposit Tokens</h2>
          <p className="text-gray-600">Send tokens to your wallet address or make a UPI payment for instant deposit</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Deposit Form */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Make a Deposit</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upi" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger value="upi" className="text-gray-700 data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-upi">UPI Payment</TabsTrigger>
                  <TabsTrigger value="bsc" className="text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white" data-testid="tab-bsc">BSC Transfer</TabsTrigger>
                </TabsList>

                {/* UPI Tab */}
                <TabsContent value="upi" className="space-y-6 mt-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">UPI Payment</h3>
                        <p className="text-sm text-gray-600">Pay via PhonePe, GPay, Paytm, or any UPI app</p>
                      </div>
                    </div>
                    
                    {/* UPI QR Code */}
                    <div className="text-center mb-6">
                      <div className="bg-white p-6 rounded-xl inline-block border border-gray-200 shadow-sm">
                        <img 
                          src={upiQrImage} 
                          alt="UPI QR Code" 
                          className="w-48 h-48 object-contain"
                          data-testid="upi-qr-code"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-3 font-medium">Scan with any UPI app to pay</p>
                    </div>

                    {/* UPI Instructions */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                      <p className="text-sm font-medium text-gray-800 mb-3">Payment Steps:</p>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700 flex items-center">
                          <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full text-xs flex items-center justify-center mr-2 font-semibold">1</span>
                          Open any UPI app (PhonePe, GPay, Paytm)
                        </p>
                        <p className="text-sm text-gray-700 flex items-center">
                          <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full text-xs flex items-center justify-center mr-2 font-semibold">2</span>
                          Scan QR code above
                        </p>
                        <p className="text-sm text-gray-700 flex items-center">
                          <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full text-xs flex items-center justify-center mr-2 font-semibold">3</span>
                          Enter amount and complete payment
                        </p>
                        <p className="text-sm text-gray-700 flex items-center">
                          <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full text-xs flex items-center justify-center mr-2 font-semibold">4</span>
                          Fill form below with payment details
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* UPI Verification Form */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 mb-1">Payment Verification</p>
                        <p className="text-gray-700 text-xs">Enter your payment details for quick verification and instant token credit.</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleUpiSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="upi-amount" className="text-gray-700">Deposit Amount *</Label>
                      <Input
                        id="upi-amount"
                        type="number"
                        step="0.01"
                        value={upiForm.amount}
                        onChange={(e) => setUpiForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="Enter amount paid via UPI"
                        className="bg-gray-50 border-gray-300 text-gray-900"
                        data-testid="input-upi-amount"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="utr-id" className="text-gray-700">UTR ID/Transaction Reference *</Label>
                      <Input
                        id="utr-id"
                        value={upiForm.utrId}
                        onChange={(e) => setUpiForm(prev => ({ ...prev, utrId: e.target.value }))}
                        placeholder="Enter UTR ID from payment receipt"
                        className="bg-gray-50 border-gray-300 text-gray-900"
                        data-testid="input-utr-id"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="upi-screenshot" className="text-gray-700">Payment Screenshot (Optional)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Upload your payment confirmation screenshot</p>
                        <p className="text-xs text-gray-500 mb-3">Supports: JPG, PNG, WebP (Max 5MB)</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUpiFileChange}
                          className="hidden"
                          id="upi-screenshot-upload"
                          data-testid="input-upi-screenshot"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('upi-screenshot-upload')?.click()}
                          className="border-purple-500 text-purple-600 hover:bg-purple-50"
                          data-testid="button-choose-upi-file"
                        >
                          Choose Screenshot
                        </Button>
                        {upiForm.screenshot && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ File selected: {upiForm.screenshot.name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold transition-colors text-white"
                      disabled={upiDepositMutation.isPending}
                      data-testid="button-submit-upi"
                    >
                      {upiDepositMutation.isPending ? "Submitting..." : "Submit UPI Payment"}
                    </Button>
                  </form>
                </TabsContent>

                {/* BSC Tab */}
                <TabsContent value="bsc" className="space-y-6 mt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Wallet className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">BSC Transfer</h3>
                        <p className="text-sm text-gray-600">Send USDT, BNB, CAKE or other BSC tokens</p>
                      </div>
                    </div>

                    {/* Supported Tokens */}
                    <div className="mb-6">
                      <p className="text-sm font-medium text-gray-800 mb-3">Supported BEP-20 Tokens:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <span className="text-yellow-600 font-bold text-sm">₿</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-800">BNB</p>
                          <p className="text-xs text-gray-500">Binance Coin</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                          <div className="w-8 h-8 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <span className="text-green-600 font-bold text-sm">₮</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-800">USDT</p>
                          <p className="text-xs text-gray-500">Tether USD</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                          <div className="w-8 h-8 bg-orange-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-sm">🥞</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-800">CAKE</p>
                          <p className="text-xs text-gray-500">PancakeSwap</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">+</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-800">More</p>
                          <p className="text-xs text-gray-500">BSC Tokens</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Crypto QR Code */}
                    <div className="text-center mb-6">
                      <div className="bg-white p-6 rounded-xl inline-block border border-gray-200 shadow-sm">
                        <img 
                          src={bscQrImage} 
                          alt="BSC Wallet QR Code" 
                          className="w-64 h-64 object-contain"
                          data-testid="crypto-qr-code"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-3 font-medium">Scan QR code with your crypto wallet</p>
                    </div>

                    {/* Wallet Address */}
                    {user?.walletAddress && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                        <p className="text-sm font-medium text-gray-800 mb-3">Wallet Address (BEP-20 Network)</p>
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <code className="text-sm font-mono text-gray-800 break-all mr-3" data-testid="text-crypto-address">
                            {user.walletAddress}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyAddress}
                            className="p-2 hover:bg-gray-200 text-blue-600 shrink-0"
                            data-testid="button-copy-crypto-address"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-orange-600 mt-2 font-medium">
                          ⚠️ Only send BEP-20 tokens to this address. Sending tokens from other networks will result in permanent loss!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* BSC Verification Form */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 mb-1">Transaction Verification</p>
                        <p className="text-gray-700 text-xs">Enter your transaction details for quick verification and instant token credit.</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleBscSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="bsc-amount" className="text-gray-700">Deposit Amount *</Label>
                      <Input
                        id="bsc-amount"
                        type="number"
                        step="0.00000001"
                        value={bscForm.amount}
                        onChange={(e) => setBscForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="Enter amount sent in tokens"
                        className="bg-gray-50 border-gray-300 text-gray-900"
                        data-testid="input-bsc-amount"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="transaction-hash" className="text-gray-700">Transaction Hash *</Label>
                      <Input
                        id="transaction-hash"
                        value={bscForm.transactionHash}
                        onChange={(e) => setBscForm(prev => ({ ...prev, transactionHash: e.target.value }))}
                        placeholder="Enter BSC transaction hash (0x...)"
                        className="bg-gray-50 border-gray-300 text-gray-900"
                        data-testid="input-transaction-hash"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bsc-screenshot" className="text-gray-700">Transaction Screenshot (Optional)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Upload screenshot from BSCScan or wallet</p>
                        <p className="text-xs text-gray-500 mb-3">Supports: JPG, PNG, WebP (Max 5MB)</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBscFileChange}
                          className="hidden"
                          id="bsc-screenshot-upload"
                          data-testid="input-bsc-screenshot"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('bsc-screenshot-upload')?.click()}
                          className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          data-testid="button-choose-bsc-file"
                        >
                          Choose Screenshot
                        </Button>
                        {bscForm.screenshot && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ File selected: {bscForm.screenshot.name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition-colors text-white"
                      disabled={bscDepositMutation.isPending}
                      data-testid="button-submit-bsc"
                    >
                      {bscDepositMutation.isPending ? "Submitting..." : "Submit BSC Transaction"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Important Notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 mb-1">Important Notes:</p>
                    <ul className="text-gray-700 space-y-1 text-xs">
                      <li>• BSC: Only send BEP-20 tokens to the address above</li>
                      <li>• UPI: Pay exact amount and provide correct UTR ID</li>
                      <li>• Processing time: 5-15 minutes after verification</li>
                      <li>• Minimum deposit: 10 tokens or ₹100 via UPI</li>
                      <li>• Contact support if payment is not credited within 30 minutes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deposit History */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Deposit History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deposits.length > 0 ? (
                  deposits.map((deposit: any) => (
                    <div
                      key={deposit.id}
                      className="border border-gray-200 rounded-lg p-4"
                      data-testid={`deposit-history-${deposit.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">Amount: {deposit.amount}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(deposit.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          deposit.status === 'approved' ? 'bg-green-100 text-green-700' :
                          deposit.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {deposit.status}
                        </div>
                      </div>
                      {deposit.transactionHash && (
                        <p className="text-sm text-gray-500 break-all">
                          Ref: {deposit.transactionHash}
                        </p>
                      )}
                      {deposit.adminNotes && (
                        <p className="text-sm text-gray-700 mt-2">
                          Note: {deposit.adminNotes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No deposits found</p>
                    <p className="text-sm text-gray-400 mt-2">Your deposit history will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}