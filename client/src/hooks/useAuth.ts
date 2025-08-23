import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, LoginUser, RegisterUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
        });
        if (response.status === 401) {
          // Return null for unauthenticated users instead of throwing
          return null;
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        // For network errors or other issues, return null
        console.log("Auth check failed:", error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000, // Reduce to 1 minute for better session detection
    gcTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const response = await apiRequest("POST", "/api/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/me"], data.user);
      toast({
        title: "Welcome!",
        description: "Successfully logged in to your wallet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterUser) => {
      const response = await apiRequest("POST", "/api/register", userData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/me"], data.user);
      toast({
        title: "Welcome to CryptoWallet Pro!",
        description: "Your account has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/me"], null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "Successfully logged out of your wallet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
  };
}