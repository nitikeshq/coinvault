import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  LogOut,
  Settings,
  Sparkles,
  Trophy,
  TrendingUp,
  FileText,
  Menu,
  X,
  CreditCard,
} from "lucide-react";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface NavigationProps {
  activeSection:
    | "wallet"
    | "deposit"
    | "press"
    | "admin"
    | "admin-new"
    | "dapps"
    | "advertisements"
    | "market";
  onSectionChange: (
    section:
      | "wallet"
      | "deposit"
      | "press"
      | "admin"
      | "admin-new"
      | "dapps"
      | "advertisements"
      | "market"
  ) => void;
  user?: any;
  isAdmin?: boolean;
}

export default function Navigation({
  activeSection,
  onSectionChange,
  user,
  isAdmin,
}: NavigationProps) {
  const { settings, isLoading } = useWebsiteSettings() as {
    settings: any;
    isLoading: boolean;
  };
  const { toast } = useToast();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const queryClient = useQueryClient();

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
  const handleMobileSectionChange = (
    section:
      | "wallet"
      | "deposit"
      | "press"
      | "admin"
      | "admin-new"
      | "dapps"
      | "advertisements"
      | "market"
  ) => {
    onSectionChange(section);
    // Mobile menu will auto-close via useEffect above
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include", // if you’re using cookies/sessions
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Logout failed");

      // Clear cached user info
      queryClient.setQueryData(["/api/me"], null);
      queryClient.clear();

      toast({
        title: "Logged out",
        description: "Successfully logged out of your wallet.",
      });

      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
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
                  alt={`${settings?.siteName || "Logo"}`}
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
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                  {settings.siteName}
                </h1>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {isAdmin && (
                <button
                  onClick={() => onSectionChange("admin")}
                  className={`p-2 rounded-lg transition-colors ${
                    activeSection === "admin"
                      ? "text-purple-600 bg-purple-50"
                      : "text-gray-600 hover:text-purple-600 hover:bg-gray-100"
                  }`}
                >
                  <Settings className="h-5 w-5" />
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => onSectionChange("admin-new")}
                  className={`p-2 rounded-lg transition-colors ${
                    activeSection === "admin-new"
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                </button>
              )}

              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors ml-2"
              >
                {showMobileMenu ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => onSectionChange("wallet")}
                className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                  activeSection === "wallet"
                    ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600"
                }`}
              >
                Wallet
              </button>
              <button
                onClick={() => onSectionChange("deposit")}
                className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                  activeSection === "deposit"
                    ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600"
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => onSectionChange("press")}
                className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                  activeSection === "press"
                    ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600"
                }`}
              >
                Press
              </button>
              {hasDappsEnabled && (
                <button
                  onClick={() => onSectionChange("dapps")}
                  className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                    activeSection === "dapps"
                      ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                      : "text-gray-600"
                  }`}
                >
                  <Sparkles className="h-3 w-3 mr-1 inline" />
                  Dapps
                </button>
              )}
              <button
                onClick={() => onSectionChange("advertisements")}
                className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                  activeSection === "advertisements"
                    ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600"
                }`}
              >
                <Trophy className="h-3 w-3 mr-1 inline" />
                Board
              </button>
              <button
                onClick={() => onSectionChange("market")}
                className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                  activeSection === "market"
                    ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600"
                }`}
              >
                <TrendingUp className="h-3 w-3 mr-1 inline" />
                Market
              </button>

              {/* Desktop User Actions */}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSectionChange("admin")}
                  className={`hover:bg-purple-100 hover:text-purple-600 ${
                    activeSection === "admin"
                      ? "bg-purple-100 text-purple-600"
                      : "text-gray-600"
                  }`}
                  title="Admin (Classic)"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSectionChange("admin-new")}
                  className={`hover:bg-blue-100 hover:text-blue-600 ${
                    activeSection === "admin-new"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600"
                  }`}
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
