"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/utils/ApiError";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Retry only network failures; a 4xx/5xx will not fix itself.
        retry: (failureCount, error) => (error instanceof ApiError && !error.isNetworkError ? false : failureCount < 2),
      },
      mutations: { retry: false },
    },
  });

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  // One client per browser session (and per request on the server), never shared between users.
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
