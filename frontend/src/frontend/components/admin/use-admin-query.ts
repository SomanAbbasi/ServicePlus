import { useQuery } from "@tanstack/react-query";

export function useAdminQuery<T>(key: string, fn: () => Promise<T>) {
  const isAuth = typeof window !== "undefined" && localStorage.getItem("serviceplus_admin_authenticated") === "true";

  return useQuery({
    queryKey: ["admin", key],
    queryFn: () => fn(),
    enabled: isAuth,
    staleTime: 30_000,
    retry: false,
  });
}
