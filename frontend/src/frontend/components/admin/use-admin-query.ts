import { useQuery } from "@tanstack/react-query";

export function useAdminQuery<T>(key: string, fn: () => Promise<T>, enabled = true) {
  return useQuery({
    queryKey: ["admin", key],
    queryFn: () => fn(),
    enabled,
    refetchInterval: 5000,
    staleTime: 2000,
    retry: false,
  });
}

