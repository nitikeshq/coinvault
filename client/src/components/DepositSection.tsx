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

export default function DepositSection() {
  const { toast } = useToast();
  const [depositForm, setDepositForm] = useState({
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

  const depositMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest('POST', '/api/deposits', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Deposit request submitted successfully. Please wait for admin approval.",
      });
      setDepositForm({ amount: "", transactionHash: "", screenshot: null });
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
        description: "Failed to submit deposit request",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDepositForm(prev => ({ ...prev, screenshot: file }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositForm.amount) {
      toast({
        title: "Error",
        description: "Please enter deposit amount",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('amount', depositForm.amount);
    if (depositForm.transactionHash) {
      formData.append('transactionHash', depositForm.transactionHash);
    }
    if (depositForm.screenshot) {
      formData.append('screenshot', depositForm.screenshot);
    }

    depositMutation.mutate(formData);
  };

  // Generate QR code data (wallet address)
  const qrCodeData = user?.walletAddress || "";

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
              <Tabs defaultValue="direct" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger value="direct" className="text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white" data-testid="tab-direct">Direct Transfer</TabsTrigger>
                  <TabsTrigger value="verify" className="text-gray-700 data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-verify">Verify Transaction</TabsTrigger>
                </TabsList>

                <TabsContent value="direct" className="space-y-6 mt-6">
                  {/* Payment Method Selection */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Crypto Transfer */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Crypto Transfer</h3>
                          <p className="text-sm text-gray-600">Send BEP-20 tokens directly</p>
                        </div>
                      </div>
                      
                      {/* Crypto QR Code */}
                      <div className="text-center mb-4">
                        <div className="bg-white p-4 rounded-xl inline-block border border-gray-200">
                          <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300" data-testid="crypto-qr-code">
                            <div className="text-center">
                              <div className="text-4xl mb-2">📱</div>
                              <p className="text-gray-600 text-xs">Wallet QR</p>
                              <p className="text-gray-500 text-xs">Scan to send</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Scan QR code with your crypto wallet</p>
                      </div>

                      {/* Wallet Address */}
                      {user?.walletAddress && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Wallet Address (BEP-20)</p>
                          <div className="flex items-center justify-between">
                            <code className="text-xs font-mono text-gray-800 break-all mr-2" data-testid="text-crypto-address">
                              {user.walletAddress}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={copyAddress}
                              className="p-1 hover:bg-gray-200 text-blue-600"
                              data-testid="button-copy-crypto-address"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* UPI Transfer */}
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">UPI Payment</h3>
                          <p className="text-sm text-gray-600">Pay via PhonePe, GPay, Paytm</p>
                        </div>
                      </div>
                      
                      {/* UPI QR Code */}
                      <div className="text-center mb-4">
                        <div className="bg-white p-4 rounded-xl inline-block border border-gray-200">
                          <img 
                            src={upiQrImage} 
                            alt="UPI QR Code" 
                            className="w-40 h-40 object-contain"
                            data-testid="upi-qr-code"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Scan with any UPI app</p>
                      </div>

                      {/* UPI Instructions */}
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Quick Payment</p>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-700">• Open any UPI app</p>
                          <p className="text-xs text-gray-700">• Scan QR code above</p>
                          <p className="text-xs text-gray-700">• Enter amount and pay</p>
                          <p className="text-xs text-gray-700">• Screenshot & verify below</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="verify" className="space-y-4 mt-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 mb-1">Transaction Verification</p>
                        <p className="text-gray-700 text-xs">Upload your payment screenshot for quick verification and instant token credit.</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="amount" className="text-gray-700">Deposit Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.00000001"
                        value={depositForm.amount}
                        onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="Enter amount paid"
                        className="bg-gray-50 border-gray-300 text-gray-900"
                        data-testid="input-deposit-amount"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="screenshot" className="text-gray-700">Payment Screenshot *</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Upload your payment confirmation screenshot</p>
                        <p className="text-xs text-gray-500 mb-3">Supports: JPG, PNG, WebP (Max 5MB)</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="screenshot-upload"
                          data-testid="input-screenshot"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('screenshot-upload')?.click()}
                          className="border-purple-500 text-purple-600 hover:bg-purple-50"
                          data-testid="button-choose-file"
                        >
                          Choose Screenshot
                        </Button>
                        {depositForm.screenshot && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ File selected: {depositForm.screenshot.name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="transactionHash" className="text-gray-700">Transaction ID/UTR (Optional)</Label>
                      <Input
                        id="transactionHash"
                        value={depositForm.transactionHash}
                        onChange={(e) => setDepositForm(prev => ({ ...prev, transactionHash: e.target.value }))}
                        placeholder="Enter transaction reference number"
                        className="bg-gray-50 border-gray-300 text-gray-900"
                        data-testid="input-transaction-hash"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold transition-colors text-white"
                      disabled={depositMutation.isPending}
                      data-testid="button-submit-deposit"
                    >
                      {depositMutation.isPending ? "Verifying..." : "Submit for Verification"}
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
                      <li>• Crypto: Only send BEP-20 tokens to the address above</li>
                      <li>• UPI: Pay exact amount and upload screenshot immediately</li>
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