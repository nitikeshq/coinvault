import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import WalletDashboard from "@/components/WalletDashboard";
import DepositSection from "@/components/DepositSection";
import SwapTrading from "@/components/SwapTrading";
import NewsSection from "@/components/NewsSection";
import Admin from "@/pages/Admin";
import DappsSection from "@/components/DappsSection";
import AdvertisementsPage from "@/pages/Advertisements";
import MarketSection from "@/components/MarketSection";
import { PresaleCountdown } from "@/components/PresaleCountdown";
import { UserProfile } from "@/components/UserProfile";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

export default function Home() {
  const [activeSection, setActiveSection] = useState<'wallet' | 'deposit' | 'swap' | 'news' | 'admin' | 'dapps' | 'advertisements' | 'market'>('wallet');
  const [showProfile, setShowProfile] = useState(false);
  const { user, isAdmin } = useAuth();
  const { settings: websiteSettings } = useWebsiteSettings() as { settings: any };

  const { data: socialLinks = [] } = useQuery<any[]>({
    queryKey: ['/api/social-links'],
  });

  // Update document title based on website settings
  useEffect(() => {
    document.title = websiteSettings?.siteName || "Crypto Wallet";
  }, [websiteSettings]);

  const renderSection = () => {
    switch (activeSection) {
      case 'wallet':
        return (
          <div className="container mx-auto px-4 space-y-6">
            <WalletDashboard onSectionChange={setActiveSection} />
            <PresaleCountdown />
          </div>
        );
      case 'deposit':
        return <DepositSection />;
      case 'swap':
        return <SwapTrading />;
      case 'news':
        return <NewsSection />;
      case 'dapps':
        return <DappsSection />;
      case 'advertisements':
        return <AdvertisementsPage />;
      case 'market':
        return <MarketSection />;
      case 'admin':
        return isAdmin ? <Admin /> : (
          <div className="container mx-auto px-4 space-y-6">
            <WalletDashboard onSectionChange={setActiveSection} />
            <PresaleCountdown />
          </div>
        );
      default:
        return (
          <div className="container mx-auto px-4 space-y-6">
            <WalletDashboard onSectionChange={setActiveSection} />
            <PresaleCountdown />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="relative z-10">
        {/* Responsive Navigation */}
        <Navigation 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          user={user}
          isAdmin={isAdmin}
        />
        
        {/* User Profile Modal */}
        {showProfile && (
          <UserProfile onClose={() => setShowProfile(false)} />
        )}
        
        <div className="pt-20 pb-8 md:pb-8 pb-20">
          {renderSection()}
        </div>

        {/* Clean Footer - Hidden on mobile */}
        <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 mt-16 hidden md:block">
          <div className="container mx-auto px-4 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  {websiteSettings?.siteName && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{websiteSettings.siteName}</h3>
                      {websiteSettings?.description && (
                        <p className="text-sm text-purple-600">{websiteSettings.description}</p>
                      )}
                    </div>
                  )}
                </div>
                {websiteSettings?.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {websiteSettings.description}
                  </p>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold mb-6 text-gray-800">Wallet Features</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    Secure Cold Storage
                  </a></li>
                  <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    PancakeSwap Trading
                  </a></li>
                  <li><a href="#" className="text-gray-600 hover:text-green-600 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Real-time Analytics
                  </a></li>
                  <li><a href="#" className="text-gray-600 hover:text-orange-600 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                    Mobile PWA Support
                  </a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-6 text-gray-800">Security & Support</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                    24/7 Help Center
                  </a></li>
                  <li><a href="#" className="text-gray-600 hover:text-red-600 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                    Security Audits
                  </a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                    Privacy Policy
                  </a></li>
                  <li><a href="#" className="text-gray-600 hover:text-pink-600 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                    Terms of Service
                  </a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-6 text-gray-800">Join Our Community</h4>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {socialLinks.map((link: any) => (
                    <a 
                      key={link.id} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 border border-gray-200 rounded-xl flex items-center justify-center hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 group"
                      data-testid={`link-social-${link.platform}`}
                    >
                      <i className={`fab fa-${link.platform} text-gray-600 group-hover:text-purple-600 transition-colors`}></i>
                    </a>
                  ))}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>📱 Download our mobile app</p>
                  <p>🔔 Get instant notifications</p>
                  <p>💬 Join our Discord community</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-6">
                {websiteSettings?.siteName && (
                  <p className="text-sm text-gray-500">&copy; 2024 {websiteSettings.siteName}. All rights reserved.</p>
                )}
                <div className="hidden md:flex items-center space-x-4">
                  <span className="px-3 py-1 bg-green-100 text-green-600 text-xs rounded-full border border-green-200">
                    Secure & Encrypted
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs rounded-full border border-blue-200">
                    BEP-20 Compatible
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
                <div className="text-sm text-gray-500">
                  Made with 💎 for crypto enthusiasts
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}