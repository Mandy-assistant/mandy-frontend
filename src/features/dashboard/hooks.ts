"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userTimeZone } from "@/lib/greeting";
import { dashboardApi } from "./api";
import { dashboardKeys } from "./keys";
import type { FocusSessionCreate } from "./types";

export const useDashboardSummary = () =>
  useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: ({ signal }) => dashboardApi.summary(userTimeZone(), signal),
  });

export const useCompleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dashboardApi.completeTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["roadmaps"] });
    },
  });
};

export const useLogFocusSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: FocusSessionCreate) => dashboardApi.logFocusSession(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: dashboardKeys.all }),
  });
};
