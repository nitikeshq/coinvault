import { Button } from "@/components/ui/button";
import { Wallet, User, LogOut, Settings } from "lucide-react";
import { Link } from "wouter";

interface NavigationProps {
  activeSection: 'wallet' | 'deposit' | 'swap' | 'news';
  onSectionChange: (section: 'wallet' | 'deposit' | 'swap' | 'news') => void;
  user?: any;
}

export default function Navigation({ activeSection, onSectionChange, user }: NavigationProps) {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 crypto-gradient rounded-lg flex items-center justify-center">
                <Wallet className="text-white h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold">CryptoWallet Pro</h1>
            </div>
            
            <div className="hidden md:flex space-x-6">
              <button 
                onClick={() => onSectionChange('wallet')}
                className={`hover:text-crypto-gold transition-colors ${activeSection === 'wallet' ? 'text-crypto-gold' : ''}`}
                data-testid="nav-wallet"
              >
                Wallet
              </button>
              <button 
                onClick={() => onSectionChange('swap')}
                className={`hover:text-crypto-gold transition-colors ${activeSection === 'swap' ? 'text-crypto-gold' : ''}`}
                data-testid="nav-swap"
              >
                Swap
              </button>
              <button 
                onClick={() => onSectionChange('news')}
                className={`hover:text-crypto-gold transition-colors ${activeSection === 'news' ? 'text-crypto-gold' : ''}`}
                data-testid="nav-news"
              >
                News
              </button>
              <button 
                onClick={() => onSectionChange('deposit')}
                className={`hover:text-crypto-gold transition-colors ${activeSection === 'deposit' ? 'text-crypto-gold' : ''}`}
                data-testid="nav-deposit"
              >
                Deposit
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              {user?.walletAddress && (
                <div className="hidden md:block text-sm text-gray-300" data-testid="text-wallet-address">
                  {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                </div>
              )}
              <Link href="/admin">
                <Button variant="ghost" size="sm" data-testid="button-admin">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-crypto-dark border-t border-white/10 z-50">
        <div className="flex justify-around py-2">
          <button 
            onClick={() => onSectionChange('wallet')}
            className={`flex flex-col items-center p-2 ${activeSection === 'wallet' ? 'text-crypto-gold' : 'text-gray-400 hover:text-white'}`}
            data-testid="mobile-nav-wallet"
          >
            <Wallet className="h-5 w-5" />
            <span className="text-xs mt-1">Wallet</span>
          </button>
          <button 
            onClick={() => onSectionChange('swap')}
            className={`flex flex-col items-center p-2 ${activeSection === 'swap' ? 'text-crypto-gold' : 'text-gray-400 hover:text-white'}`}
            data-testid="mobile-nav-swap"
          >
            <i className="fas fa-exchange-alt text-lg"></i>
            <span className="text-xs mt-1">Swap</span>
          </button>
          <button 
            onClick={() => onSectionChange('news')}
            className={`flex flex-col items-center p-2 ${activeSection === 'news' ? 'text-crypto-gold' : 'text-gray-400 hover:text-white'}`}
            data-testid="mobile-nav-news"
          >
            <i className="fas fa-newspaper text-lg"></i>
            <span className="text-xs mt-1">News</span>
          </button>
          <button 
            onClick={() => onSectionChange('deposit')}
            className={`flex flex-col items-center p-2 ${activeSection === 'deposit' ? 'text-crypto-gold' : 'text-gray-400 hover:text-white'}`}
            data-testid="mobile-nav-deposit"
          >
            <i className="fas fa-plus-circle text-lg"></i>
            <span className="text-xs mt-1">Deposit</span>
          </button>
        </div>
      </nav>
    </>
  );
}
