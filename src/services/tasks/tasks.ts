import { taskEndpoints } from "@/constants/task";
import { mockTasks } from "@/mocks/tasks";
import { api } from "@/services/request";
import type { Task } from "@/types/task";

export const tasksApi = {
  list: (signal?: AbortSignal) => api.get<Task[]>(taskEndpoints.list, { mock: mockTasks, signal }),
};
