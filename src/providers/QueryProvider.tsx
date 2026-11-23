"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api/errors";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
    mutationMeta: {
      /** Set when the mutation shows its own error UI (e.g. form field errors). */
      silentError?: boolean;
    };
  }
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // A 4xx won't fix itself; retry network/5xx once.
        retry: (count, error) => count < 1 && (!(error instanceof ApiError) || error.isNetworkError || error.status >= 500),
      },
      mutations: { retry: false },
    },
    // FE-14: every failed mutation shows the backend message, unless it handles errors itself.
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (!mutation.meta?.silentError) toast.error(errorMessage(error));
      },
    }),
  });

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools buttonPosition="bottom-left" />}
    </QueryClientProvider>
  );
};
