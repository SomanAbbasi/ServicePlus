import { useQuery } from "@tanstack/react-query";

export function useAdminQuery<T>(key: string, fn: () => Promise<T>) {
  const isAuth = typeof window !== "undefined" && localStorage.getItem("serviceplus_admin_authenticated") === "true";

  return useQuery({
    queryKey: ["admin", key],
    queryFn: () => fn(),
    enabled: isAuth,
    refetchInterval: 3000,
    staleTime: 2000,
    retry: false,
  });
}
