import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, User, LogOut, Settings, Copy, Sparkles, Trophy, TrendingUp, FileText, Menu, X, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface NavigationProps {
  activeSection: 'wallet' | 'deposit' | 'swap' | 'news' | 'admin' | 'admin-new' | 'dapps' | 'advertisements' | 'market';
  onSectionChange: (section: 'wallet' | 'deposit' | 'swap' | 'news' | 'admin' | 'admin-new' | 'dapps' | 'advertisements' | 'market') => void;
  user?: any;
  isAdmin?: boolean;
}

export default function Navigation({ activeSection, onSectionChange, user, isAdmin }: NavigationProps) {
  const { settings, isLoading } = useWebsiteSettings() as { settings: any; isLoading: boolean };
  const { toast } = useToast();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  // Track when settings have loaded to prevent menu closing
  useEffect(() => {
    if (!isLoading && !settingsLoaded) {
      setSettingsLoaded(true);
    }
  }, [isLoading, settingsLoaded]);
  
  // Fetch enabled dapps to show/hide the Dapps menu
  const { data: enabledDapps = [] } = useQuery<any[]>({
    queryKey: ["/api/dapps/settings"],
    retry: false,
  });

  const hasDappsEnabled = enabledDapps.length > 0;
  
  // Close mobile menu only when section changes, not when settings load
  useEffect(() => {
    setShowMobileMenu(false);
  }, [activeSection]);

  // Handle mobile menu section change
  const handleMobileSectionChange = (section: 'wallet' | 'deposit' | 'swap' | 'news' | 'admin' | 'admin-new' | 'dapps' | 'advertisements' | 'market') => {
    onSectionChange(section);
    // Mobile menu will auto-close via useEffect above
  };
  
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
      {/* Main Navigation Header */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex justify-between items-center">
            {/* Logo and Site Name */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={`${settings?.siteName || 'Logo'}`} 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
                />
              ) : (
                settings?.siteName && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Wallet className="text-white h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                )
              )}
              {settings?.siteName && (
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{settings.siteName}</h1>
              )}
            </div>
            
            {/* Mobile Menu Button - Always visible on mobile */}
            <div className="md:hidden flex items-center space-x-2">
              {/* User actions for mobile */}
              {isAdmin && (
                <button 
                  onClick={() => onSectionChange('admin')}
                  className={`p-2 rounded-lg transition-colors ${
                    activeSection === 'admin' ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-purple-600 hover:bg-gray-100'
                  }`}
                  data-testid="mobile-admin-button"
                  aria-label="Admin Panel (Classic)"
                >
                  <Settings className="h-5 w-5" />
                </button>
              )}
              {isAdmin && (
                <button 
                  onClick={() => onSectionChange('admin-new')}
                  className={`p-2 rounded-lg transition-colors ${
                    activeSection === 'admin-new' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                  }`}
                  data-testid="mobile-admin-new-button"
                  aria-label="Admin Panel (Enhanced)"
                >
                  <Sparkles className="h-5 w-5" />
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                data-testid="mobile-logout-button"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
              
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors ml-2"
                data-testid="mobile-menu-toggle"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Desktop Navigation - Only visible on desktop */}
            <div className="hidden md:flex items-center space-x-1 sm:space-x-6">
              {/* Documentation Links */}
              {(settings?.auditReportUrl || settings?.whitepaperUrl) && (
                <div className="flex space-x-4">
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
              
              {/* Desktop Navigation Buttons */}
              <div className="flex space-x-6">
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
                  onClick={() => onSectionChange('deposit')}
                  className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                    activeSection === 'deposit' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                  }`}
                  data-testid="nav-deposit"
                >
                  Deposit
                </button>
                <button 
                  onClick={() => onSectionChange('press')}
                  className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                    activeSection === 'press' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                  }`}
                  data-testid="nav-press"
                >
                  Press
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
              
              {/* Desktop User Actions */}
              <div className="flex items-center space-x-3">
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onSectionChange('admin')}
                    className={`hover:bg-purple-100 hover:text-purple-600 ${
                      activeSection === 'admin' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'
                    }`}
                    data-testid="button-admin"
                    title="Admin (Classic)"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onSectionChange('admin-new')}
                    className={`hover:bg-blue-100 hover:text-blue-600 ${
                      activeSection === 'admin-new' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                    }`}
                    data-testid="button-admin-new"
                    title="Admin (Enhanced)"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout} 
                  className="hover:bg-red-100 hover:text-red-600 text-gray-600"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown Menu - Only visible on mobile when menu is open */}
      {showMobileMenu && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="container mx-auto px-4 py-4">
            <div className="space-y-3">
              {/* Navigation Items */}
              <button 
                onClick={() => handleMobileSectionChange('wallet')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                  activeSection === 'wallet' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid="mobile-nav-wallet"
              >
                <Wallet className="h-5 w-5 mr-3" />
                Wallet
              </button>
              
              <button 
                onClick={() => handleMobileSectionChange('deposit')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                  activeSection === 'deposit' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid="mobile-nav-deposit"
              >
                <CreditCard className="h-5 w-5 mr-3" />
                Deposit
              </button>
              
              
              <button 
                onClick={() => handleMobileSectionChange('press')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                  activeSection === 'press' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid="mobile-nav-press"
              >
                <FileText className="h-5 w-5 mr-3" />
                Press
              </button>
              
              {hasDappsEnabled && (
                <button 
                  onClick={() => handleMobileSectionChange('dapps')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                    activeSection === 'dapps' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="mobile-nav-dapps"
                >
                  <Sparkles className="h-5 w-5 mr-3" />
                  DApps
                </button>
              )}
              
              <button 
                onClick={() => handleMobileSectionChange('advertisements')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                  activeSection === 'advertisements' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid="mobile-nav-advertisements"
              >
                <Trophy className="h-5 w-5 mr-3" />
                Board
              </button>
              
              <button 
                onClick={() => handleMobileSectionChange('market')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                  activeSection === 'market' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid="mobile-nav-market"
              >
                <TrendingUp className="h-5 w-5 mr-3" />
                Market
              </button>

              {/* Documentation Links */}
              {(settings?.auditReportUrl || settings?.whitepaperUrl) && (
                <>
                  <div className="border-t border-gray-200 my-3"></div>
                  {settings?.whitepaperUrl && (
                    <a 
                      href={settings.whitepaperUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center text-gray-700 hover:bg-gray-50"
                      data-testid="mobile-nav-whitepaper"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <FileText className="h-5 w-5 mr-3" />
                      Whitepaper
                    </a>
                  )}
                  {settings?.auditReportUrl && (
                    <a 
                      href={settings.auditReportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center text-gray-700 hover:bg-gray-50"
                      data-testid="mobile-nav-audit"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <FileText className="h-5 w-5 mr-3" />
                      Audit Report
                    </a>
                  )}
                </>
              )}

              {/* Admin and Logout */}
              <div className="border-t border-gray-200 my-3"></div>
              
              {isAdmin && (
                <button 
                  onClick={() => handleMobileSectionChange('admin')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                    activeSection === 'admin' ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="mobile-nav-admin"
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Admin (Classic)
                </button>
              )}
              {isAdmin && (
                <button 
                  onClick={() => handleMobileSectionChange('admin-new')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                    activeSection === 'admin-new' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="mobile-nav-admin-new"
                >
                  <Sparkles className="h-5 w-5 mr-3" />
                  Admin (Enhanced)
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center text-red-600 hover:bg-red-50"
                data-testid="mobile-nav-logout"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}