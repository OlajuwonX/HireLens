import { QueryClient } from "@tanstack/react-query";

export const QUERY_DEFAULTS = {
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  retry: 1,
  refetchOnWindowFocus: false,
} as const;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: QUERY_DEFAULTS,
      mutations: { retry: 0 },
    },
  });
}
