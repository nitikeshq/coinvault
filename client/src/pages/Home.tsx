import { useState } from "react";
import Navigation from "@/components/Navigation";
import WalletDashboard from "@/components/WalletDashboard";
import DepositSection from "@/components/DepositSection";
import SwapTrading from "@/components/SwapTrading";
import NewsSection from "@/components/NewsSection";
import AdminPanel from "@/components/AdminPanel";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [activeSection, setActiveSection] = useState<'wallet' | 'deposit' | 'swap' | 'news' | 'admin'>('wallet');
  const { user, isAdmin } = useAuth();

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
      case 'admin':
        return isAdmin ? <AdminPanel /> : <WalletDashboard />;
      default:
        return <WalletDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10">
        <Navigation 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          user={user}
          isAdmin={isAdmin}
        />
        
        <div className="pt-20 pb-20 md:pb-8">
          {renderSection()}
        </div>

        {/* Enhanced Footer */}
        <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 mt-16">
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
                  <div>
                    <h3 className="text-xl font-bold text-white">CryptoWallet Pro</h3>
                    <p className="text-sm text-purple-400">Professional Edition</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  The most secure and user-friendly BEP-20 token wallet with integrated trading, 
                  real-time analytics, and enterprise-grade security.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-6 text-white">Wallet Features</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    Secure Cold Storage
                  </a></li>
                  <li><a href="#" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    PancakeSwap Trading
                  </a></li>
                  <li><a href="#" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Real-time Analytics
                  </a></li>
                  <li><a href="#" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                    Mobile PWA Support
                  </a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-6 text-white">Security & Support</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                    24/7 Help Center
                  </a></li>
                  <li><a href="#" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                    Security Audits
                  </a></li>
                  <li><a href="#" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                    Privacy Policy
                  </a></li>
                  <li><a href="#" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center">
                    <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                    Terms of Service
                  </a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-6 text-white">Join Our Community</h4>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {socialLinks.map((link: any) => (
                    <a 
                      key={link.id} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center hover:border-purple-400/50 hover:bg-purple-500/30 transition-all duration-300 group"
                      data-testid={`link-social-${link.platform}`}
                    >
                      <i className={`fab fa-${link.platform} text-gray-300 group-hover:text-purple-300 transition-colors`}></i>
                    </a>
                  ))}
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>📱 Download our mobile app</p>
                  <p>🔔 Get instant notifications</p>
                  <p>💬 Join our Discord community</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-6">
                <p className="text-sm text-gray-400">&copy; 2024 CryptoWallet Pro. All rights reserved.</p>
                <div className="hidden md:flex items-center space-x-4">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                    Secure & Encrypted
                  </span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                    BEP-20 Compatible
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
                <div className="text-sm text-gray-400">
                  Made with 💎 for crypto enthusiasts
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `
      }} />
    </div>
  );
}