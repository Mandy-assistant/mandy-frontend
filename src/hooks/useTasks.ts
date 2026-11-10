import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/services/tasks/tasks";
import type { Task } from "@/types/task";
import type { ApiError } from "@/utils/ApiError";

export const tasksQueryKey = ["tasks"] as const;

export const useTasks = () =>
  useQuery<Task[], ApiError>({
    queryKey: tasksQueryKey,
    queryFn: ({ signal }) => tasksApi.list(signal),
  });
