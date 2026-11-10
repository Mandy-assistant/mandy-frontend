export const taskEndpoints = {
  list: "/api/tasks",
} as const;

export const taskLabels = {
  empty: "No tasks yet.",
  loadFailed: "Couldn't load tasks.",
  retry: "Try again",
  done: "Done",
  open: "Open",
} as const;
