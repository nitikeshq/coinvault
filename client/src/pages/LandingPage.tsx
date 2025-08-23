import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  Gift, 
  Star, 
  Heart, 
  ArrowRight,
  CheckCircle,
  Sparkles 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

export default function LandingPage() {
  const [referralCode, setReferralCode] = useState("");
  const { toast } = useToast();
  const { settings } = useWebsiteSettings();

  // Extract referral code from URL on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref') || urlParams.get('referral');
    if (refCode) {
      setReferralCode(refCode);
      toast({
        title: "Referral Code Applied!",
        description: `Welcome! You were referred by: ${refCode}`,
      });
    }
  }, [toast]);

  const handleRegister = () => {
    // Redirect to auth with referral code
    const authUrl = referralCode 
      ? `/api/auth/google?referral=${encodeURIComponent(referralCode)}`
      : '/api/auth/google';
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={`${settings?.siteName || 'Crypto Wallet'} Logo`} 
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wallet className="text-white h-5 w-5" />
                </div>
              )}
              <h1 className="text-xl font-bold text-white">{settings?.siteName || "Crypto Wallet"}</h1>
            </div>
            <Button 
              variant="outline" 
              className="text-white border-white/30 hover:bg-white/10"
              onClick={handleRegister}
            >
              Join Now
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
              <Sparkles className="h-4 w-4 mr-1" />
              Referral Rewards Active
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Next-Gen <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Crypto Wallet
              </span> & NFT Marketplace
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join the future of decentralized finance with secure wallet management, 
              NFT trading, meme marketplace, and exclusive referral rewards.
            </p>
            
            {/* Referral Code Input */}
            <Card className="max-w-md mx-auto mb-8 bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-center">
                  <Gift className="h-5 w-5 mr-2" />
                  Referral Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="referral" className="text-gray-300">
                    Enter Referral Code (Optional)
                  </Label>
                  <Input
                    id="referral"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Enter referral code"
                    className="bg-white/20 border-white/30 text-white placeholder-gray-400"
                    data-testid="input-referral-code"
                  />
                  {referralCode && (
                    <div className="flex items-center text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Referral code applied: {referralCode}
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleRegister}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  data-testid="button-register"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Register & Start Trading
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Platform Features</h2>
            <p className="text-gray-300 text-lg">Everything you need in one powerful platform</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Wallet Feature */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Secure Wallet</h3>
                <p className="text-gray-300">
                  Advanced BEP-20 token management with military-grade security
                </p>
              </CardContent>
            </Card>

            {/* NFT Marketplace */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">NFT Trading</h3>
                <p className="text-gray-300">
                  Create, buy, and sell NFTs with competitive bidding system
                </p>
              </CardContent>
            </Card>

            {/* Meme Marketplace */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Meme Market</h3>
                <p className="text-gray-300">
                  Generate and vote on memes with community rewards
                </p>
              </CardContent>
            </Card>

            {/* Referral System */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Referral Rewards</h3>
                <p className="text-gray-300">
                  Earn bonuses for every friend you bring to the platform
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Why Choose Us?</h2>
              <p className="text-gray-300 text-lg">Built for the next generation of crypto enthusiasts</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Advanced Trading</h3>
                <p className="text-gray-300">
                  Professional-grade trading tools with real-time market data
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Exclusive Rewards</h3>
                <p className="text-gray-300">
                  Earn tokens, NFTs, and special bonuses through community participation
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Community Driven</h3>
                <p className="text-gray-300">
                  Join a thriving community of traders, creators, and innovators
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of users already trading, creating, and earning on our platform
            </p>
            
            <Button 
              size="lg"
              onClick={handleRegister}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3 text-lg"
              data-testid="button-register-cta"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started Now
            </Button>
            
            {referralCode && (
              <div className="mt-4 text-green-400">
                <p className="text-sm">🎁 Special referral bonus will be applied to your account!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-black/30 border-t border-white/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} {settings?.siteName || "Crypto Wallet"}. 
            Powered by the future of decentralized finance.
          </p>
        </div>
      </footer>
    </div>
  );
}