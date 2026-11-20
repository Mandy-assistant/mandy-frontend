import { api, type Page } from "@/lib/api/client";
import type {
  Milestone,
  MilestoneCreate,
  MilestoneUpdate,
  Roadmap,
  RoadmapCreate,
  RoadmapDetail,
  RoadmapGenerate,
  RoadmapUpdate,
} from "./types";

export const roadmapsApi = {
  // The contract doesn't page roadmaps; accept a Page too so a later backend change doesn't break the list.
  list: async (signal?: AbortSignal) => {
    const data = await api.get<Roadmap[] | Page<Roadmap>>("/roadmaps", { signal });
    return Array.isArray(data) ? data : data.items;
  },
  get: (id: string, signal?: AbortSignal) => api.get<RoadmapDetail>(`/roadmaps/${id}`, { signal }),
  create: (body: RoadmapCreate) => api.post<RoadmapDetail>("/roadmaps", body),
  update: (id: string, body: RoadmapUpdate) => api.patch<RoadmapDetail>(`/roadmaps/${id}`, body),
  remove: (id: string) => api.delete(`/roadmaps/${id}`),
  generate: (body: RoadmapGenerate) => api.post<RoadmapDetail>("/roadmaps/generate", body),
  createMilestone: (roadmapId: string, body: MilestoneCreate) => api.post<Milestone>(`/roadmaps/${roadmapId}/milestones`, body),
  updateMilestone: (id: string, body: MilestoneUpdate) => api.patch<Milestone>(`/milestones/${id}`, body),
  removeMilestone: (id: string) => api.delete(`/milestones/${id}`),
  reorder: (roadmapId: string, ids: string[]) => api.put<RoadmapDetail>(`/roadmaps/${roadmapId}/milestones/order`, { ids }),
};
