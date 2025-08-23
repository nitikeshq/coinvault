import { useQuery } from "@tanstack/react-query";

export function useWebsiteSettings() {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["/api/website/settings"],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Return default values if no settings found
  const defaultSettings = {
    siteName: "CryptoWallet Pro",
    logoUrl: "",
    faviconUrl: "",
    description: "Secure BEP-20 cryptocurrency wallet with PancakeSwap integration",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
  };

  return {
    settings: settings || defaultSettings,
    isLoading,
    error,
  };
}