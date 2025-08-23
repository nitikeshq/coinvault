import { Button } from "@/components/ui/button";
import { Wallet, User, LogOut, Settings, Copy } from "lucide-react";
import { Link } from "wouter";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useToast } from "@/hooks/use-toast";

interface NavigationProps {
  activeSection: 'wallet' | 'deposit' | 'swap' | 'news' | 'admin';
  onSectionChange: (section: 'wallet' | 'deposit' | 'swap' | 'news' | 'admin') => void;
  user?: any;
  isAdmin?: boolean;
}

export default function Navigation({ activeSection, onSectionChange, user, isAdmin }: NavigationProps) {
  const { settings } = useWebsiteSettings();
  const { toast } = useToast();
  
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
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={`${settings.siteName} Logo`} 
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wallet className="text-white h-5 w-5" />
                </div>
              )}
              <h1 className="text-xl font-bold text-gray-800">{settings.siteName}</h1>
            </div>
            
            <div className="flex space-x-6">
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
                <button
                  onClick={copyWalletAddress}
                  className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full font-mono transition-colors flex items-center space-x-1 cursor-pointer"
                  data-testid="button-copy-wallet-address"
                  title="Click to copy full wallet address"
                >
                  <span>{user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}</span>
                  <Copy className="h-3 w-3" />
                </button>
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
    </>
  );
}