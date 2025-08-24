import { useQuery } from "@tanstack/react-query";

export function useWebsiteSettings() {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["/api/website/settings"],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Return empty defaults if no settings found - let admin configure
  const defaultSettings = {
    siteName: "",
    logoUrl: "",
    faviconUrl: "",
    description: "",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
  };

  return {
    settings: settings || defaultSettings,
    isLoading,
    error,
  };
}