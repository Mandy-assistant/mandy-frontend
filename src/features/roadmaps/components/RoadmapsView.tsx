"use client";

import { Map as MapIcon, Plus, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Stagger, StaggerItem } from "@/components/motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { useRoadmaps } from "../hooks";
import { PlanWithAiDialog } from "./PlanWithAiDialog";
import { RoadmapCard } from "./RoadmapCard";
import { RoadmapFormDialog } from "./RoadmapFormDialog";

const ORDER = { active: 0, paused: 1, completed: 2 } as const;

export const RoadmapsView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roadmaps = useRoadmaps();
  const [creating, setCreating] = useState(false);
  const [planning, setPlanning] = useState(false);

  // Close dialogs when this kept-alive route is hidden.
  useEffect(
    () => () => {
      setCreating(false);
      setPlanning(false);
    },
    [],
  );

  // Command palette: /roadmaps?new=1 opens the create dialog.
  const wantsNew = searchParams.get("new") === "1";
  useEffect(() => {
    if (!wantsNew) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a URL flag, then clearing it
    setCreating(true);
    router.replace(pathname, { scroll: false });
  }, [wantsNew, router, pathname]);

  const sorted = roadmaps.data ? [...roadmaps.data].sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.updated_at.localeCompare(a.updated_at)) : null;
  const active = sorted?.filter((r) => r.status === "active").length ?? 0;

  const actions = (
    <>
      <Button variant="outline" className="h-11 sm:h-9" onClick={() => setPlanning(true)}>
        <Sparkles data-icon="inline-start" className="text-primary" />
        Plan with AI
      </Button>
      <Button className="h-11 sm:h-9" onClick={() => setCreating(true)}>
        <Plus data-icon="inline-start" />
        New roadmap
      </Button>
    </>
  );

  return (
    <>
      <PageHeader
        overline="Learning"
        title="Roadmaps"
        description={sorted && sorted.length > 0 ? `${active} active · ${sorted.length} total. Break big goals into milestones.` : "Break big goals into milestones and track your progress."}
        actions={actions}
      />

      {roadmaps.isError ? (
        <ErrorState error={roadmaps.error} onRetry={() => roadmaps.refetch()} title="Couldn't load your roadmaps" />
      ) : !sorted ? (
        <CardGridSkeleton count={3} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={MapIcon}
          title="No roadmaps yet"
          description="Start with a goal like “Become an ML Engineer”. Write the milestones yourself or let Mandy draft them."
          action={<div className="flex flex-wrap justify-center gap-2">{actions}</div>}
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((roadmap) => (
            <StaggerItem key={roadmap.id} className="h-full">
              <RoadmapCard roadmap={roadmap} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <RoadmapFormDialog open={creating} onOpenChange={setCreating} />
      <PlanWithAiDialog open={planning} onOpenChange={setPlanning} />
    </>
  );
};
