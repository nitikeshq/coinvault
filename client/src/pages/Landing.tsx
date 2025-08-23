import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Shield, TrendingUp, Smartphone, Globe, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const { data: websiteSettings } = useQuery<any>({
    queryKey: ['/api/website/settings'],
  });

  const siteName = websiteSettings?.siteName || "Crypto Wallet";

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-crypto-navy text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-effect border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 crypto-gradient rounded-lg flex items-center justify-center">
                <Wallet className="text-white h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold">{siteName}</h1>
            </div>
            <Button 
              onClick={handleLogin}
              className="bg-crypto-blue hover:bg-blue-600"
              data-testid="button-login"
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 gradient-bg">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Your Gateway to 
              <span className="text-crypto-gold"> Secure</span>
              <br />Cryptocurrency Trading
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Experience the future of digital finance with our advanced BEP-20 token wallet. 
              Trade, store, and manage your crypto assets with institutional-grade security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="bg-crypto-gold hover:bg-yellow-500 text-black font-semibold"
                data-testid="button-get-started"
              >
                Get Started Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-crypto-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Why Choose {siteName}?</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built for both beginners and professionals, our platform combines security, 
              simplicity, and advanced trading features.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-crypto-gray/20 border-white/10">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-crypto-blue mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Bank-Grade Security</h4>
                <p className="text-gray-400">
                  Your assets are protected with multi-layer security protocols and cold storage technology.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-crypto-gray/20 border-white/10">
              <CardContent className="p-6 text-center">
                <Smartphone className="h-12 w-12 text-crypto-green mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Mobile-First Design</h4>
                <p className="text-gray-400">
                  Access your wallet anywhere with our responsive PWA that works seamlessly on all devices.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-crypto-gray/20 border-white/10">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-crypto-gold mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Real-Time Trading</h4>
                <p className="text-gray-400">
                  Connect directly to PancakeSwap for live trading with real-time price updates and charts.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-crypto-gray/20 border-white/10">
              <CardContent className="p-6 text-center">
                <Globe className="h-12 w-12 text-crypto-blue mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Global Access</h4>
                <p className="text-gray-400">
                  Trade from anywhere in the world with automatic currency conversion and localization.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-crypto-gray/20 border-white/10">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-crypto-green mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">User-Friendly</h4>
                <p className="text-gray-400">
                  Designed for everyone - from crypto newcomers to experienced traders.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-crypto-gray/20 border-white/10">
              <CardContent className="p-6 text-center">
                <Wallet className="h-12 w-12 text-crypto-gold mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">BEP-20 Native</h4>
                <p className="text-gray-400">
                  Purpose-built for Binance Smart Chain tokens with full BEP-20 standard support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 crypto-gradient">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Start Your Crypto Journey?</h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust our platform for their digital asset management.
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            className="bg-white text-crypto-navy hover:bg-gray-100 font-semibold"
            data-testid="button-start-trading"
          >
            Start Trading Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-crypto-gray/30 border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 crypto-gradient rounded-lg flex items-center justify-center">
              <Wallet className="text-white h-4 w-4" />
            </div>
            <span className="font-semibold">{siteName}</span>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; 2024 {siteName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
