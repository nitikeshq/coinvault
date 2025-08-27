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
  Video,
  User,
  Search,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import UserSearch from "@/components/UserSearch";

interface NavigationProps {
  activeSection:
    | "wallet"
    | "deposit"
    | "press"
    | "admin"
    | "admin-new"
    | "dapps"
    | "advertisements"
    | "market"
    | "feed";
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
      | "feed"
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
  const [location, navigate] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
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

  // Fetch feed settings to show/hide the Feed tab
  const { data: feedSettings } = useQuery<any>({
    queryKey: ["/api/feed/settings"],
    retry: false,
  });

  const isFeedEnabled = feedSettings?.isEnabled;

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

  const handleProfileClick = () => {
    if (user?.id) {
      navigate(`/profile/${user.id}`);
    } else {
      toast({
        title: "Error",
        description: "Unable to access profile. Please try logging in again.",
        variant: "destructive",
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
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {/* Simplified Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Core Navigation */}
              <button
                onClick={() => onSectionChange("wallet")}
                className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                  activeSection === "wallet"
                    ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600"
                }`}
              >
                <Wallet className="h-4 w-4 mr-1 inline" />
                Wallet
              </button>

              <button
                onClick={() => onSectionChange("market")}
                className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                  activeSection === "market"
                    ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600"
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-1 inline" />
                Market
              </button>

              {feedSettings?.isEnabled && (
                <button
                  onClick={() => onSectionChange("feed")}
                  className={`hover:text-blue-600 transition-colors font-medium text-sm ${
                    activeSection === "feed"
                      ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                      : "text-gray-600"
                  }`}
                >
                  <Video className="h-4 w-4 mr-1 inline" />
                  Feed
                </button>
              )}

              {/* More Menu for Secondary Items */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                    <MoreHorizontal className="h-4 w-4 mr-1" />
                    More
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onSectionChange("deposit")}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Deposit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSectionChange("press")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Press
                  </DropdownMenuItem>
                  {hasDappsEnabled && (
                    <DropdownMenuItem onClick={() => onSectionChange("dapps")}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Dapps
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onSectionChange("advertisements")}>
                    <Trophy className="h-4 w-4 mr-2" />
                    Board
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onSectionChange("admin")}>
                        <Settings className="h-4 w-4 mr-2" />
                        Admin (Classic)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSectionChange("admin-new")}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Admin (Enhanced)
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* User Actions */}
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserSearch(true)}
                className="hover:bg-blue-100 hover:text-blue-600 text-gray-600"
                title="Search Users"
              >
                <Search className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleProfileClick}
                className="hover:bg-green-100 hover:text-green-600 text-gray-600"
                title="My Profile"
              >
                <User className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hover:bg-red-100 hover:text-red-600 text-gray-600"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {showMobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg z-50">
            <div className="px-4 py-4 space-y-2">
              <button
                onClick={() => handleMobileSectionChange("wallet")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeSection === "wallet"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Wallet
              </button>
              <button
                onClick={() => handleMobileSectionChange("deposit")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeSection === "deposit"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => handleMobileSectionChange("press")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeSection === "press"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Press
              </button>
              {hasDappsEnabled && (
                <button
                  onClick={() => handleMobileSectionChange("dapps")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                    activeSection === "dapps"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Dapps
                </button>
              )}
              <button
                onClick={() => handleMobileSectionChange("advertisements")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                  activeSection === "advertisements"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Board
              </button>
              <button
                onClick={() => handleMobileSectionChange("market")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                  activeSection === "market"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Market
              </button>
              {feedSettings?.isEnabled && (
                <button
                  onClick={() => handleMobileSectionChange("feed")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                    activeSection === "feed"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Feed
                </button>
              )}
              <button
                onClick={() => {
                  handleProfileClick();
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4 mr-2" />
                My Profile
              </button>
              {isAdmin && (
                <>
                  <hr className="my-2" />
                  <button
                    onClick={() => handleMobileSectionChange("admin")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                      activeSection === "admin"
                        ? "bg-purple-50 text-purple-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin (Classic)
                  </button>
                  <button
                    onClick={() => handleMobileSectionChange("admin-new")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                      activeSection === "admin-new"
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Admin (Enhanced)
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* User Search Modal */}
      <UserSearch
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
      />
    </>
  );
}
