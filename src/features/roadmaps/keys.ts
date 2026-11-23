export const roadmapKeys = {
  all: ["roadmaps"] as const,
  list: () => [...roadmapKeys.all, "list"] as const,
  details: () => [...roadmapKeys.all, "detail"] as const,
  detail: (id: string) => [...roadmapKeys.details(), id] as const,
};
