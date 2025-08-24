import { useQuery } from "@tanstack/react-query";

export function useWebsiteSettings() {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["/api/website/settings"],
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
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