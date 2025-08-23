import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, User, LogOut, Settings, Copy, Sparkles, Trophy, TrendingUp, FileText } from "lucide-react";
import { Link } from "wouter";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface NavigationProps {
  activeSection: 'wallet' | 'deposit' | 'swap' | 'news' | 'admin' | 'dapps' | 'advertisements' | 'market';
  onSectionChange: (section: 'wallet' | 'deposit' | 'swap' | 'news' | 'admin' | 'dapps' | 'advertisements' | 'market') => void;
  user?: any;
  isAdmin?: boolean;
}

export default function Navigation({ activeSection, onSectionChange, user, isAdmin }: NavigationProps) {
  const { settings } = useWebsiteSettings();
  const { toast } = useToast();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Fetch enabled dapps to show/hide the Dapps menu
  const { data: enabledDapps = [] } = useQuery<any[]>({
    queryKey: ["/api/dapps/settings"],
    retry: false,
  });

  const hasDappsEnabled = enabledDapps.length > 0;
  
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const copyWalletAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={`${settings?.siteName || 'CryptoWallet Pro'} Logo`} 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wallet className="text-white h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              )}
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{settings?.siteName || "CryptoWallet Pro"}</h1>
            </div>
            
            {/* Mobile Navigation */}
            <div className="flex items-center space-x-1 sm:space-x-6">
              {/* Documentation Links - Mobile Optimized */}
              {(settings?.auditReportUrl || settings?.whitepaperUrl) && (
                <div className="hidden sm:flex sm:space-x-4">
                  {settings?.auditReportUrl && (
                    <a 
                      href={settings.auditReportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors font-medium text-gray-600 text-sm"
                      data-testid="nav-audit-report"
                    >
                      Audit
                    </a>
                  )}
                  {settings?.whitepaperUrl && (
                    <a 
                      href={settings.whitepaperUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors font-medium text-gray-600 text-sm"
                      data-testid="nav-whitepaper"
                    >
                      Whitepaper
                    </a>
                  )}
                  <div className="border-l border-gray-300 mx-2"></div>
                </div>
              )}
              
              {/* Mobile Doc Links Dropdown */}
              {(settings?.auditReportUrl || settings?.whitepaperUrl) && (
                <div className="sm:hidden relative">
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="text-gray-600 hover:text-blue-600 p-1 rounded"
                    data-testid="mobile-docs-menu"
                  >
                    <FileText className="h-5 w-5" />
                  </button>
                  {showMobileMenu && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-32 z-50">
                      {settings?.whitepaperUrl && (
                        <a 
                          href={settings.whitepaperUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                          data-testid="mobile-whitepaper"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          Whitepaper
                        </a>
                      )}
                      {settings?.auditReportUrl && (
                        <a 
                          href={settings.auditReportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                          data-testid="mobile-audit"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          Audit Report
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Desktop Navigation Buttons */}
              <div className="hidden lg:flex lg:space-x-6">
                <button 
                  onClick={() => onSectionChange('wallet')}
                  className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                    activeSection === 'wallet' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                  }`}
                  data-testid="nav-wallet"
                >
                  Wallet
                </button>
                <button 
                  onClick={() => onSectionChange('news')}
                  className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                    activeSection === 'news' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                  }`}
                  data-testid="nav-news"
                >
                  News
                </button>
                <button 
                  onClick={() => onSectionChange('deposit')}
                  className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                    activeSection === 'deposit' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                  }`}
                  data-testid="nav-deposit"
                >
                  Deposit
                </button>
                {hasDappsEnabled && (
                  <button 
                    onClick={() => onSectionChange('dapps')}
                    className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                      activeSection === 'dapps' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                    }`}
                    data-testid="nav-dapps"
                  >
                    <Sparkles className="h-3 w-3 mr-1 inline" />
                    Dapps
                  </button>
                )}
                <button 
                  onClick={() => onSectionChange('advertisements')}
                  className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                    activeSection === 'advertisements' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                  }`}
                  data-testid="nav-advertisements"
                >
                  <Trophy className="h-3 w-3 mr-1 inline" />
                  Board
                </button>
                <button 
                  onClick={() => onSectionChange('market')}
                  className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                    activeSection === 'market' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                  }`}
                  data-testid="nav-market"
                >
                  <TrendingUp className="h-3 w-3 mr-1 inline" />
                  Market
                </button>
              </div>

              {/* Mobile Navigation Buttons - Compact */}
              <div className="flex lg:hidden space-x-1">
                <button 
                  onClick={() => onSectionChange('wallet')}
                  className={`p-2 rounded transition-colors ${
                    activeSection === 'wallet' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                  }`}
                  data-testid="nav-wallet-mobile"
                  title="Wallet"
                >
                  <Wallet className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onSectionChange('deposit')}
                  className={`p-2 rounded transition-colors ${
                    activeSection === 'deposit' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                  }`}
                  data-testid="nav-deposit-mobile"
                  title="Deposit"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onSectionChange('market')}
                  className={`p-2 rounded transition-colors ${
                    activeSection === 'market' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                  }`}
                  data-testid="nav-market-mobile"
                  title="Market"
                >
                  <TrendingUp className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onSectionChange('admin')}
                  className={`hover:bg-purple-100 hover:text-purple-600 hidden sm:flex ${
                    activeSection === 'admin' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'
                  }`}
                  data-testid="button-admin"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              
              {/* Mobile Admin Icon */}
              {isAdmin && (
                <button 
                  onClick={() => onSectionChange('admin')}
                  className={`sm:hidden p-2 rounded transition-colors ${
                    activeSection === 'admin' ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-purple-600'
                  }`}
                  data-testid="button-admin-mobile"
                  title="Admin"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout} 
                className="hover:bg-red-100 hover:text-red-600 text-gray-600 hidden sm:flex"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              
              {/* Mobile Logout Icon */}
              <button
                onClick={handleLogout}
                className="sm:hidden p-2 rounded text-red-600 hover:bg-red-50 transition-colors"
                data-testid="button-logout-mobile"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}