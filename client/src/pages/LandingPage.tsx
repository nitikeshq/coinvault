import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import SEOHead from "@/components/SEOHead";
import { 
  Wallet, 
  Shield, 
  Zap, 
  TrendingUp, 
  CheckCircle, 
  ExternalLink, 
  Clock,
  Users,
  FileText,
  Award,
  Rocket,
  Target,
  Calendar,
  Star
} from "lucide-react";

interface WebsiteSettings {
  logoUrl?: string;
  siteName?: string;
  description?: string;
  auditReportUrl?: string;
  whitepaperUrl?: string;
}

interface PresaleConfig {
  targetAmount: string;
  tokenPrice: string;
  startDate: string;
  endDate: string;
  minInvestment: string;
  maxInvestment: string;
}

interface PresaleProgress {
  totalRaised: string;
  targetAmount: string;
  percentage: number;
  investorCount: number;
}

interface DappSettings {
  appName: string;
  displayName: string;
  isEnabled: boolean;
  cost: string;
  description: string;
}

interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export default function LandingPage() {
  const [timeRemaining, setTimeRemaining] = useState("");

  // Fetch website settings
  const { data: websiteSettings } = useQuery<WebsiteSettings>({
    queryKey: ['/api/website/settings'],
  });

  // Fetch presale configuration
  const { data: presaleConfig } = useQuery<PresaleConfig>({
    queryKey: ['/api/presale/config'],
  });

  // Fetch presale progress
  const { data: presaleProgress } = useQuery<PresaleProgress>({
    queryKey: ['/api/presale/progress'],
  });

  // Fetch enabled dapps
  const { data: dappSettings } = useQuery<DappSettings[]>({
    queryKey: ['/api/dapps/settings'],
    select: (data) => data?.filter(dapp => dapp.isEnabled) || [],
  });

  // Fetch token configuration
  const { data: tokenConfig } = useQuery<TokenConfig>({
    queryKey: ['/api/token/config'],
  });

  // Calculate time remaining
  useEffect(() => {
    if (!presaleConfig?.endDate) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(presaleConfig.endDate).getTime();
      const distance = endTime - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeRemaining("Presale Ended");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [presaleConfig?.endDate]);

  const roadmapItems = [
    {
      phase: "Phase 1",
      title: "Platform Launch",
      status: "completed",
      items: [
        "Smart Contract Development",
        "Security Audit Completion",
        "Presale Platform Launch",
        "Community Building"
      ]
    },
    {
      phase: "Phase 2", 
      title: "DApp Ecosystem",
      status: "in-progress",
      items: [
        "NFT Marketplace Launch",
        "Meme Generator Integration",
        "Referral System Activation",
        "Mobile App Development"
      ]
    },
    {
      phase: "Phase 3",
      title: "Advanced Features",
      status: "upcoming",
      items: [
        "Cross-chain Integration",
        "Advanced Trading Tools",
        "DAO Governance",
        "Staking Mechanisms"
      ]
    },
    {
      phase: "Phase 4",
      title: "Ecosystem Expansion",
      status: "upcoming", 
      items: [
        "Exchange Listings",
        "Partnership Network",
        "Global Marketing",
        "Enterprise Solutions"
      ]
    }
  ];

  return (
    <>
      <SEOHead
        title={`${websiteSettings?.siteName || 'CryptoWallet Pro'} - Revolutionary Cryptocurrency Presale`}
        description={websiteSettings?.description || "Join the future of cryptocurrency with our revolutionary presale. Secure wallet, NFT marketplace, and DApp ecosystem. Limited time offer with exclusive benefits."}
        keywords="cryptocurrency, presale, ICO, blockchain, wallet, NFT, DApp, investment, crypto, token sale"
        canonical={window.location.href}
        ogImage={websiteSettings?.logoUrl}
        siteName={websiteSettings?.siteName || "CryptoWallet Pro"}
        logoUrl={websiteSettings?.logoUrl}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": websiteSettings?.siteName || "CryptoWallet Pro",
          "description": websiteSettings?.description,
          "url": window.location.origin,
          "logo": websiteSettings?.logoUrl,
          "sameAs": []
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {websiteSettings?.logoUrl && (
                  <img 
                    src={websiteSettings.logoUrl} 
                    alt="Logo" 
                    className="h-10 w-10 rounded-lg"
                  />
                )}
                <h1 className="text-2xl font-bold text-white">
                  {websiteSettings?.siteName || "CryptoWallet Pro"}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Join Presale
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                The Future of 
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {" "}Cryptocurrency
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                {websiteSettings?.description || "Revolutionary wallet ecosystem with NFT marketplace, DApp integration, and community-driven features. Join our presale for exclusive access."}
              </p>
              
              {/* Presale Stats */}
              {presaleProgress && (
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-white mb-2">
                        ${parseFloat(presaleProgress.totalRaised).toLocaleString()}
                      </div>
                      <div className="text-gray-400">Raised</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-white mb-2">
                        {(presaleProgress?.investorCount || 0).toLocaleString()}
                      </div>
                      <div className="text-gray-400">Investors</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-white mb-2">
                        {timeRemaining}
                      </div>
                      <div className="text-gray-400">Time Remaining</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Progress Bar */}
              {presaleProgress && (
                <div className="max-w-2xl mx-auto mb-8">
                  <div className="flex justify-between text-white mb-2">
                    <span>Progress</span>
                    <span>{(presaleProgress?.percentage || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={presaleProgress?.percentage || 0} className="h-3" />
                  <div className="flex justify-between text-gray-400 text-sm mt-2">
                    <span>${parseFloat(presaleProgress.totalRaised).toLocaleString()}</span>
                    <span>${parseFloat(presaleProgress.targetAmount).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
                  Invest Now - Limited Time
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-black/20">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-4xl font-bold text-center text-white mb-16">Why Choose Our Platform?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardContent className="p-6 text-center">
                  <Shield className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Security First</h3>
                  <p className="text-gray-400">Bank-level security with multi-signature wallets and cold storage</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardContent className="p-6 text-center">
                  <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
                  <p className="text-gray-400">Instant transactions with minimal fees on BEP-20 network</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">High ROI Potential</h3>
                  <p className="text-gray-400">Early investor benefits with exclusive presale pricing</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Community Driven</h3>
                  <p className="text-gray-400">Strong community with referral rewards and governance</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* DApps Ecosystem */}
        {dappSettings && dappSettings.length > 0 && (
          <section className="py-20 px-4">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-4xl font-bold text-center text-white mb-16">DApp Ecosystem</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {dappSettings.map((dapp, index) => (
                  <Card key={index} className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="text-white">{dapp.displayName}</CardTitle>
                      <Badge className="w-fit bg-green-600">{dapp.cost} {tokenConfig?.symbol}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400">{dapp.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Roadmap */}
        <section className="py-20 px-4 bg-black/20">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-4xl font-bold text-center text-white mb-16">Roadmap</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {roadmapItems.map((phase, index) => (
                <Card key={index} className="bg-white/10 border-white/20 backdrop-blur-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{phase.phase}</CardTitle>
                      {phase.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-400" />}
                      {phase.status === 'in-progress' && <Clock className="h-5 w-5 text-yellow-400" />}
                      {phase.status === 'upcoming' && <Target className="h-5 w-5 text-gray-400" />}
                    </div>
                    <CardDescription className="text-gray-300">{phase.title}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {phase.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-gray-400 text-sm flex items-center">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Documentation Section */}
        {(websiteSettings?.auditReportUrl || websiteSettings?.whitepaperUrl) && (
          <section className="py-20 px-4">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-4xl font-bold text-center text-white mb-16">Documentation</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {websiteSettings.auditReportUrl && (
                  <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardContent className="p-8 text-center">
                      <Award className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-semibold text-white mb-4">Security Audit</h3>
                      <p className="text-gray-400 mb-6">
                        Our smart contracts have been thoroughly audited by leading security firms to ensure maximum safety for your investments.
                      </p>
                      <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        <a href={websiteSettings.auditReportUrl} target="_blank" rel="noopener noreferrer">
                          View Audit Report <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {websiteSettings.whitepaperUrl && (
                  <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardContent className="p-8 text-center">
                      <FileText className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-semibold text-white mb-4">Whitepaper</h3>
                      <p className="text-gray-400 mb-6">
                        Discover our vision, technology, and roadmap in our comprehensive whitepaper detailing the future of our ecosystem.
                      </p>
                      <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        <a href={websiteSettings.whitepaperUrl} target="_blank" rel="noopener noreferrer">
                          Read Whitepaper <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Don't Miss This Opportunity</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of investors who have already secured their position in the future of cryptocurrency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
                  Start Investing Now
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/40 py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center text-gray-400">
              <p>&copy; 2024 {websiteSettings?.siteName || "CryptoWallet Pro"}. All rights reserved.</p>
              <p className="mt-2">Invest responsibly. Cryptocurrency investments carry risk.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}