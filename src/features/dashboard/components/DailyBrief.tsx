"use client";

import { toast } from "sonner";
import { Stagger, StaggerItem } from "@/components/motion";
import { ErrorState } from "@/components/shared/states";
import { AskMandy } from "@/features/assistant/components/AskMandy";
import { useDashboardSummary, useLogFocusSession } from "../hooks";
import { usePomodoro } from "../pomodoro";
import { useNow } from "../use-now";
import { BentoSkeleton } from "./BentoSkeleton";
import { BriefHeader, BriefHeaderSkeleton } from "./BriefHeader";
import { FocusCard } from "./FocusCard";
import { ForYouCard } from "./ForYouCard";
import { JobPulseCard } from "./JobPulseCard";
import { StreakCard } from "./StreakCard";
import { TodayTimeline } from "./TodayTimeline";

const STEP = 0.06;

/** FE-06: Home — Mandy's daily brief. */
export const DailyBrief = () => {
  const summary = useDashboardSummary();
  const now = useNow();
  const logSession = useLogFocusSession();
  const pomodoro = usePomodoro({
    onFinish: (session) => {
      logSession.mutate(session);
      toast.success("Focus session finished", { description: "Nice work. Take a 5-minute break." });
    },
  });

  const focusTaskId = summary.data?.focus_task?.id ?? null;
  const onFocusCommand = () => {
    pomodoro.start(pomodoro.taskId ?? focusTaskId);
    toast.success("New 25-minute focus session started");
  };

  const data = summary.data;

  return (
    <Stagger step={STEP} className="flex flex-col gap-[22px]">
      <StaggerItem distance={24}>{data ? <BriefHeader summary={data} now={now} /> : <BriefHeaderSkeleton />}</StaggerItem>
      <StaggerItem distance={24}>
        <AskMandy onFocusCommand={onFocusCommand} />
      </StaggerItem>

      {summary.isPending ? (
        <BentoSkeleton />
      ) : summary.isError ? (
        <ErrorState error={summary.error} onRetry={() => summary.refetch()} title="Couldn't load your brief" />
      ) : (
        data && (
          <Stagger step={STEP} delay={STEP * 2} className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-3">
            <StaggerItem distance={24} className="md:col-span-2">
              <FocusCard summary={data} pomodoro={pomodoro} now={now} />
            </StaggerItem>
            {/* On xl the Focus card sets the row height; Today fills it and scrolls instead of stretching the row. */}
            <StaggerItem distance={24} className="relative xl:min-h-[420px]">
              <TodayTimeline entries={data.timeline ?? []} now={now} />
            </StaggerItem>
            <StaggerItem distance={24}>
              <StreakCard streak={data.streak} />
            </StaggerItem>
            <StaggerItem distance={24}>
              <JobPulseCard summary={data} />
            </StaggerItem>
            <StaggerItem distance={24}>
              <ForYouCard news={data.latest_news ?? []} />
            </StaggerItem>
          </Stagger>
        )
      )}
    </Stagger>
  );
};
