import { Button } from "@/components/ui/button";
import { Wallet, User, LogOut, Settings } from "lucide-react";
import { Link } from "wouter";

interface NavigationProps {
  activeSection: 'wallet' | 'deposit' | 'swap' | 'news' | 'admin';
  onSectionChange: (section: 'wallet' | 'deposit' | 'swap' | 'news' | 'admin') => void;
  user?: any;
  isAdmin?: boolean;
}

export default function Navigation({ activeSection, onSectionChange, user, isAdmin }: NavigationProps) {
  const handleLogout = () => {
    // Use auth hook logout function instead
    window.location.href = "/api/logout";
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Wallet className="text-white h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">CryptoWallet Pro</h1>
            </div>
            
            <div className="hidden md:flex space-x-6">
              <button 
                onClick={() => onSectionChange('wallet')}
                className={`hover:text-blue-600 transition-colors font-medium ${
                  activeSection === 'wallet' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                }`}
                data-testid="nav-wallet"
              >
                Wallet
              </button>
              <button 
                onClick={() => onSectionChange('swap')}
                className={`hover:text-blue-600 transition-colors font-medium ${
                  activeSection === 'swap' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                }`}
                data-testid="nav-swap"
              >
                Swap
              </button>
              <button 
                onClick={() => onSectionChange('news')}
                className={`hover:text-blue-600 transition-colors font-medium ${
                  activeSection === 'news' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                }`}
                data-testid="nav-news"
              >
                News
              </button>
              <button 
                onClick={() => onSectionChange('deposit')}
                className={`hover:text-blue-600 transition-colors font-medium ${
                  activeSection === 'deposit' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                }`}
                data-testid="nav-deposit"
              >
                Deposit
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              {user?.walletAddress && (
                <div className="hidden md:block text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-mono" data-testid="text-wallet-address">
                  {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                </div>
              )}
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onSectionChange('admin')}
                  className={`hover:bg-purple-100 hover:text-purple-600 ${
                    activeSection === 'admin' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'
                  }`}
                  data-testid="button-admin"
                >
                  <Settings className="h-4 w-4" />
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
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="flex justify-around py-2">
          <button 
            onClick={() => onSectionChange('wallet')}
            className={`flex flex-col items-center p-2 ${
              activeSection === 'wallet' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid="mobile-nav-wallet"
          >
            <Wallet className="h-5 w-5" />
            <span className="text-xs mt-1">Wallet</span>
          </button>
          <button 
            onClick={() => onSectionChange('swap')}
            className={`flex flex-col items-center p-2 ${
              activeSection === 'swap' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid="mobile-nav-swap"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-xs mt-1">Swap</span>
          </button>
          <button 
            onClick={() => onSectionChange('news')}
            className={`flex flex-col items-center p-2 ${
              activeSection === 'news' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid="mobile-nav-news"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-xs mt-1">News</span>
          </button>
          <button 
            onClick={() => onSectionChange('deposit')}
            className={`flex flex-col items-center p-2 ${
              activeSection === 'deposit' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid="mobile-nav-deposit"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-xs mt-1">Deposit</span>
          </button>
        </div>
      </nav>
    </>
  );
}