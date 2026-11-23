export const assistantKeys = {
  all: ["assistant"] as const,
  status: () => [...assistantKeys.all, "status"] as const,
};
