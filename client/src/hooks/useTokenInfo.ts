import { useQuery } from "@tanstack/react-query";

export function useTokenInfo() {
  const { data: tokenConfig } = useQuery({
    queryKey: ["/api/token/config"],
    retry: false,
  });

  return {
    tokenSymbol: tokenConfig?.tokenSymbol || "TOKEN",
    tokenName: tokenConfig?.tokenName || "Token",
    tokenConfig,
  };
}