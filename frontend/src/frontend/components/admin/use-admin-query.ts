import { useQuery } from "@tanstack/react-query";

export function useAdminQuery<T>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: ["admin", key], queryFn: () => fn(), staleTime: 30_000 });
}
