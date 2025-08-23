import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  TrendingUp, 
  Sparkles, 
  Trophy, 
  User, 
  Copy, 
  Settings, 
  LogOut, 
  FileText,
  ChevronUp,
  ChevronDown,
  Home
} from "lucide-react";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useQuery } from "@tanstack/react-query";

interface MobileNavigationProps {
  activeSection: 'wallet' | 'deposit' | 'swap' | 'news' | 'admin' | 'dapps' | 'advertisements' | 'market';
  onSectionChange: (section: 'wallet' | 'deposit' | 'swap' | 'news' | 'admin' | 'dapps' | 'advertisements' | 'market') => void;
  user?: any;
  isAdmin?: boolean;
}

export default function MobileNavigation({ activeSection, onSectionChange, user, isAdmin }: MobileNavigationProps) {
  const { settings } = useWebsiteSettings();
  const [showExpandedMenu, setShowExpandedMenu] = useState(false);
  const [showDocMenu, setShowDocMenu] = useState(false);

  // Fetch enabled dapps to show/hide the Dapps button
  const { data: enabledDapps = [] } = useQuery<any[]>({
    queryKey: ["/api/dapps/settings"],
    retry: false,
  });

  const hasDappsEnabled = enabledDapps.length > 0;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Close expanded menu when section changes
  useEffect(() => {
    setShowExpandedMenu(false);
  }, [activeSection]);

  return (
    <>
      {/* Top Mobile Header */}
      <nav className="fixed top-0 w-full z-50 bg-white shadow-sm border-b border-gray-200 md:hidden">
        <div className="px-3 py-2">
          <div className="flex justify-between items-center">
            {/* Logo and Site Name */}
            <div className="flex items-center space-x-2 flex-shrink-0 min-w-0 max-w-[120px]">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={`${settings?.siteName || 'Crypto Wallet'} Logo`} 
                  className="w-7 h-7 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                  <Wallet className="text-white h-4 w-4" />
                </div>
              )}
              <h1 className="text-sm font-bold text-gray-800 truncate">
                {settings?.siteName || "Crypto Wallet"}
              </h1>
            </div>

            {/* Documentation Links & User Actions */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Documentation Dropdown */}
              {(settings?.auditReportUrl || settings?.whitepaperUrl) && (
                <div className="relative">
                  <button
                    onClick={() => setShowDocMenu(!showDocMenu)}
                    className="p-1.5 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100"
                    data-testid="mobile-docs-toggle"
                    aria-label="Documentation"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                  {showDocMenu && (
                    <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-32 z-50">
                      {settings?.whitepaperUrl && (
                        <a 
                          href={settings.whitepaperUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                          data-testid="mobile-whitepaper-link"
                          onClick={() => setShowDocMenu(false)}
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
                          data-testid="mobile-audit-link"
                          onClick={() => setShowDocMenu(false)}
                        >
                          Audit Report
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Admin Button */}
              {isAdmin && (
                <button 
                  onClick={() => onSectionChange('admin')}
                  className={`p-1.5 rounded-full transition-colors ${
                    activeSection === 'admin' ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-purple-600 hover:bg-gray-100'
                  }`}
                  data-testid="mobile-admin-button"
                  aria-label="Admin Panel"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                data-testid="mobile-logout-button"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Expandable Menu */}
      {showExpandedMenu && (
        <div className="fixed bottom-20 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg md:hidden">
          <div className="grid grid-cols-1 gap-1 p-2">
            <button 
              onClick={() => onSectionChange('news')}
              className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                activeSection === 'news' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              data-testid="mobile-news-button"
            >
              <User className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">News</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg md:hidden">
        <div className="flex items-center">
          {/* Main Navigation Items */}
          <div className="flex justify-around flex-1 py-2">
            <button 
              onClick={() => onSectionChange('wallet')}
              className={`flex flex-col items-center p-2 transition-colors ${
                activeSection === 'wallet' ? 'text-blue-600' : 'text-gray-600'
              }`}
              data-testid="mobile-wallet-nav"
            >
              <Wallet className="h-6 w-6" />
              <span className="text-xs mt-1 font-medium">Wallet</span>
            </button>
            
            <button 
              onClick={() => onSectionChange('market')}
              className={`flex flex-col items-center p-2 transition-colors ${
                activeSection === 'market' ? 'text-blue-600' : 'text-gray-600'
              }`}
              data-testid="mobile-market-nav"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-xs mt-1 font-medium">Market</span>
            </button>
            
            {hasDappsEnabled && (
              <button 
                onClick={() => onSectionChange('dapps')}
                className={`flex flex-col items-center p-2 transition-colors ${
                  activeSection === 'dapps' ? 'text-blue-600' : 'text-gray-600'
                }`}
                data-testid="mobile-dapps-nav"
              >
                <Sparkles className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">DApps</span>
              </button>
            )}
            
            <button 
              onClick={() => onSectionChange('advertisements')}
              className={`flex flex-col items-center p-2 transition-colors ${
                activeSection === 'advertisements' ? 'text-blue-600' : 'text-gray-600'
              }`}
              data-testid="mobile-leaderboard-nav"
            >
              <Trophy className="h-6 w-6" />
              <span className="text-xs mt-1 font-medium">Board</span>
            </button>
          </div>

          {/* Expandable Menu Toggle */}
          <div className="border-l border-gray-200 px-2 py-2">
            <button
              onClick={() => setShowExpandedMenu(!showExpandedMenu)}
              className={`flex flex-col items-center p-2 transition-colors ${
                showExpandedMenu ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
              } rounded-lg`}
              data-testid="mobile-menu-toggle"
              aria-label="More options"
            >
              {showExpandedMenu ? (
                <ChevronDown className="h-6 w-6" />
              ) : (
                <ChevronUp className="h-6 w-6" />
              )}
              <span className="text-xs mt-1 font-medium">More</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Content Padding Spacer */}
      <div className="md:hidden h-16"></div>
    </>
  );
}