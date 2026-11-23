"use client";

import { Briefcase, Plus, SearchX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/skeletons";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { BOARD_PAGE_SIZE, TABLE_PAGE_SIZE, useJobs } from "../hooks";
import { JOB_STATUSES, type Job } from "../types";
import { useJobsParams } from "../use-jobs-params";
import { useIsMobile } from "../use-media-query";
import { BoardSkeleton, JobBoard } from "./JobBoard";
import { JobDetailSheet } from "./JobDetailSheet";
import { JobFormDialog } from "./JobFormDialog";
import { JobsTabs } from "./JobsTabs";
import { JobsToolbar } from "./JobsToolbar";
import { JobTable } from "./JobTable";

type FormState = { open: boolean; job?: Job };

export const JobsView = () => {
  const { view, q, status, sort, page, isNew, update } = useJobsParams();
  const mobile = useIsMobile();

  const [search, setSearch] = useState(q);
  const [form, setForm] = useState<FormState>({ open: false });
  const [detail, setDetail] = useState<{ open: boolean; job: Job | null }>({ open: false, job: null });

  const board = useJobs({ q: q || undefined, status, size: BOARD_PAGE_SIZE }, view === "board");
  const table = useJobs({ q: q || undefined, status, sort, page, size: TABLE_PAGE_SIZE }, view === "table");
  const active = view === "board" ? board : table;
  const filtered = !!q || !!status;

  // Debounced search → ?q=
  useEffect(() => {
    const next = search.trim();
    if (next === q) return;
    const t = setTimeout(() => update({ q: next }), 300);
    return () => clearTimeout(t);
  }, [search, q, update]);

  // ?new=1 (command palette): open the create form, then drop the param.
  useEffect(() => {
    if (!isNew) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a URL flag
    setForm({ open: true });
    update({ new: null });
  }, [isNew, update]);

  // The route stays mounted (hidden) after navigating away: close overlays then.
  useEffect(
    () => () => {
      setForm((f) => ({ ...f, open: false }));
      setDetail((d) => ({ ...d, open: false }));
    },
    [],
  );

  // Past the last page (e.g. after deleting its only row): step back.
  const lastPage = table.data?.pages ?? 0;
  useEffect(() => {
    if (view === "table" && lastPage > 0 && page > lastPage) update({ page: lastPage });
  }, [view, page, lastPage, update]);

  // Keep the open sheet in sync with the freshest list copy.
  const items = active.data?.items;
  const detailJob = useMemo(
    () => (detail.job ? (items?.find((j) => j.id === detail.job!.id) ?? detail.job) : null),
    [items, detail.job],
  );

  const openJob = (job: Job) => setDetail({ open: true, job });
  const openCreate = () => setForm({ open: true });
  const clearFilters = () => {
    setSearch("");
    update({ q: null, status: null });
  };

  const addButton = (
    <Button onClick={openCreate} className="max-md:h-11">
      <Plus data-icon="inline-start" aria-hidden />
      Add job
    </Button>
  );

  let content: React.ReactNode;
  if (active.isPending) {
    content = view === "board" ? <BoardSkeleton /> : <TableSkeleton rows={8} cols={5} />;
  } else if (active.isError && !active.data) {
    content = <ErrorState title="Couldn't load your jobs" error={active.error} onRetry={() => active.refetch()} />;
  } else if (active.data.total === 0 && !filtered) {
    content = (
      <EmptyState
        icon={Briefcase}
        title="No jobs yet"
        description="Add roles you're eyeing or have applied to, then drag them across the board as things move."
        action={addButton}
        className="py-16"
      />
    );
  } else if (active.data.items.length === 0) {
    content = (
      <EmptyState
        icon={SearchX}
        title="No matching jobs"
        description={q ? `Nothing matches “${q}”${status ? " with this status" : ""}.` : "No jobs with this status yet."}
        action={
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    );
  } else if (view === "board") {
    content = <JobBoard jobs={active.data.items} statuses={status ? [status] : JOB_STATUSES} mobile={mobile} onOpen={openJob} />;
  } else {
    content = (
      <JobTable
        page={active.data}
        sort={sort}
        onSort={(s) => update({ sort: s })}
        onPage={(p) => update({ page: p })}
        onOpen={openJob}
        fetching={active.isPlaceholderData}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Job tracker"
        description={
          view === "board"
            ? "Drag a card to change its status, or tap it to open details."
            : "Sort by any column, or open a job to see its details."
        }
        actions={addButton}
      />
      <JobsTabs active="tracker" />

      <JobsToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={(s) => update({ status: s ?? null })}
        view={view}
        onView={(v) => update({ view: v })}
      />

      <p className="sr-only" aria-live="polite">
        {active.data && !active.isPending ? `${active.data.total} jobs` : ""}
      </p>

      {content}

      <JobFormDialog
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        mobile={mobile}
        job={form.job}
        defaultStatus={status}
      />
      <JobDetailSheet
        open={detail.open}
        onOpenChange={(open) => setDetail((d) => ({ ...d, open }))}
        job={detailJob}
        mobile={mobile}
        onEdit={(job) => setForm({ open: true, job })}
      />
    </>
  );
};
