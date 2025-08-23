import { useState } from "react";
import Navigation from "@/components/Navigation";
import WalletDashboard from "@/components/WalletDashboard";
import DepositSection from "@/components/DepositSection";
import SwapTrading from "@/components/SwapTrading";
import NewsSection from "@/components/NewsSection";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [activeSection, setActiveSection] = useState<'wallet' | 'deposit' | 'swap' | 'news'>('wallet');
  const { user } = useAuth();

  const { data: socialLinks = [] } = useQuery<any[]>({
    queryKey: ['/api/social-links'],
  });

  const renderSection = () => {
    switch (activeSection) {
      case 'wallet':
        return <WalletDashboard />;
      case 'deposit':
        return <DepositSection />;
      case 'swap':
        return <SwapTrading />;
      case 'news':
        return <NewsSection />;
      default:
        return <WalletDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-crypto-navy text-white">
      <Navigation 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        user={user}
      />
      
      <div className="pt-20 pb-20 md:pb-8">
        {renderSection()}
      </div>

      {/* Footer */}
      <footer className="bg-crypto-gray/30 border-t border-white/10 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 crypto-gradient rounded-lg flex items-center justify-center">
                  <i className="fas fa-wallet text-white text-lg"></i>
                </div>
                <h3 className="text-xl font-bold">CryptoWallet Pro</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Secure, simple, and powerful BEP-20 token wallet for everyone.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Secure Wallet</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Token Swap</a></li>
                <li><a href="#" className="hover:text-white transition-colors">News & Updates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect With Us</h4>
              <div className="grid grid-cols-4 gap-2">
                {socialLinks.map((link: any) => (
                  <a 
                    key={link.id} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-crypto-blue rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                    data-testid={`link-social-${link.platform}`}
                  >
                    <i className={`fab fa-${link.platform} text-white`}></i>
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">&copy; 2024 CryptoWallet Pro. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0 text-sm text-gray-400">
              <span>Made with ❤️ for crypto community</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
