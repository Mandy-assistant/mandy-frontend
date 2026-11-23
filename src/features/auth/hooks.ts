"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./api";

export const authKeys = {
  status: ["auth", "status"] as const,
  me: ["auth", "me"] as const,
  passkeys: ["auth", "passkeys"] as const,
};

export const useAuthStatus = () =>
  useQuery({ queryKey: authKeys.status, queryFn: ({ signal }) => authApi.status(signal), staleTime: 60_000 });

export const useCurrentUser = () =>
  useQuery({ queryKey: authKeys.me, queryFn: ({ signal }) => authApi.me(signal), staleTime: 5 * 60_000 });

/** "Lock Mandy": ends the session, clears every cached query and returns to the unlock screen. */
export const useLock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    meta: { silentError: true },
    onSettled: () => {
      // Don't clear() here: mounted queries would refetch with the dead session and race this navigation.
      void queryClient.cancelQueries();
      // Hard navigation on purpose: with Cache Components, visited routes stay mounted (hidden) and would
      // refetch with the dead session. A full load drops them and every in-memory trace of the session,
      // including the query cache.
      window.location.replace("/unlock");
    },
  });
};

export const usePasskeys = () => useQuery({ queryKey: authKeys.passkeys, queryFn: ({ signal }) => authApi.passkeys(signal) });
