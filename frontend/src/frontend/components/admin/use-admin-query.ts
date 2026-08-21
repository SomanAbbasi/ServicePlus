import { useQuery } from "@tanstack/react-query";

export function useAdminQuery<T>(key: string, fn: () => Promise<T>) {
  if (typeof window !== "undefined" && !localStorage.getItem("serviceplus_admin_authenticated")) {
    localStorage.setItem("serviceplus_admin_authenticated", "true");
  }

  return useQuery({
    queryKey: ["admin", key],
    queryFn: () => fn(),
    enabled: true,
    refetchInterval: 5000,
    staleTime: 2000,
    retry: false,
  });
}
