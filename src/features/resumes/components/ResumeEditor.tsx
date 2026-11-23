"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Eye, FileX2, History, LayoutTemplate, Loader2, PenLine, UserRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Shimmer } from "@/components/shared/skeletons";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/features/profile/components/form-kit";
import { profileApi } from "@/features/profile/api";
import { profileKeys } from "@/features/profile/keys";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { cn } from "@/utils/cn";
import { normalizeContent, profileToContent } from "../content";
import { useResume } from "../hooks";
import type { Resume, ResumeContent, Section, Template } from "../types";
import { useAutosave } from "../use-autosave";
import { HeaderEditor } from "./HeaderEditor";
import { SaveIndicator } from "./SaveIndicator";
import { PrintCopy, ScaledPreview } from "./ScaledPreview";
import { SectionsEditor } from "./SectionsEditor";
import { VersionHistory } from "./VersionHistory";

export const TEMPLATES = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic" },
] as const satisfies readonly { value: Template; label: string }[];

export const ResumeEditor = ({ id }: { id: string }) => {
  const { data, isPending, isError, error, refetch } = useResume(id);

  if (isPending) return <EditorSkeleton />;
  if (isError) {
    if (error instanceof ApiError && error.status === 404)
      return (
        <EmptyState
          icon={FileX2}
          title="This resume doesn't exist"
          description="It may have been deleted."
          action={
            <Button nativeButton={false} render={<Link href="/resumes" />} variant="outline">
              <ArrowLeft data-icon="inline-start" /> All resumes
            </Button>
          }
        />
      );
    return <ErrorState error={error} onRetry={() => refetch()} title="Couldn't open this resume" />;
  }
  return <EditorLoaded key={data.id} resume={data} />;
};

type Draft = { title: string; template: Template; content: ResumeContent };

const EditorLoaded = ({ resume }: { resume: Resume }) => {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => ({
    title: resume.title,
    template: resume.template,
    content: normalizeContent(resume.content),
  }));
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const autosave = useAutosave(resume.id, draft, revision);
  const { data: live } = useResume(resume.id);
  const currentVersion = live?.current_version ?? resume.current_version;

  const edit = useCallback((fn: (d: Draft) => Draft) => {
    setDraft(fn);
    setRevision((r) => r + 1);
  }, []);
  const setContent = (fn: (c: ResumeContent) => ResumeContent) => edit((d) => ({ ...d, content: fn(d.content) }));
  const patchSection = (sid: string, patch: Partial<Section>) =>
    setContent((c) => ({ ...c, sections: c.sections.map((s) => (s.id === sid ? { ...s, ...patch } : s)) }));

  const replaceFromServer = (r: Resume) => {
    setDraft({ title: r.title, template: r.template, content: normalizeContent(r.content) });
    const next = revision + 1;
    setRevision(next);
    autosave.markSaved(next);
  };

  const importProfile = async () => {
    setImporting(true);
    try {
      const profile = await qc.fetchQuery({ queryKey: profileKeys.detail(), queryFn: ({ signal }) => profileApi.get(signal) });
      setContent((c) => profileToContent(profile, c));
      toast.success("Filled from your profile");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setImporting(false);
    }
  };

  const exportPdf = async () => {
    await autosave.flush();
    window.print();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-card sm:p-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/resumes" />}
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 rounded-xl md:size-10"
            aria-label="Back to resumes"
          >
            <ArrowLeft />
          </Button>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Resume title</span>
            <input
              value={draft.title}
              onChange={(e) => edit((d) => ({ ...d, title: e.target.value }))}
              onBlur={(e) => !e.target.value.trim() && edit((d) => ({ ...d, title: "Untitled resume" }))}
              className="h-11 w-full min-w-0 truncate rounded-xl bg-transparent px-2 text-lg font-bold tracking-tight outline-none hover:bg-surface-2/60 focus-visible:bg-surface-2/60 md:h-10"
            />
          </label>
          <SaveIndicator status={autosave.status} onRetry={() => void autosave.retry()} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Template"
            size="sm"
            value={draft.template}
            onChange={(template) => edit((d) => ({ ...d, template }))}
            options={TEMPLATES.map((t) => ({ ...t, icon: <LayoutTemplate /> }))}
          />
          <Button variant="outline" className="h-10 rounded-xl md:h-9" onClick={() => setImportOpen(true)} disabled={importing}>
            {importing ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <UserRound data-icon="inline-start" />}
            <span className="max-sm:sr-only">Import from profile</span>
          </Button>
          <Button variant="outline" className="h-10 rounded-xl md:h-9" onClick={() => setHistoryOpen(true)}>
            <History data-icon="inline-start" />
            <span className="max-sm:sr-only">History</span>
          </Button>
          <Button className="h-10 rounded-xl max-sm:flex-1 md:h-9" onClick={exportPdf}>
            <Download data-icon="inline-start" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Mobile: Edit / Preview */}
      <div className="lg:hidden">
        <Segmented
          label="Editor view"
          value={view}
          onChange={setView}
          className="w-full"
          options={[
            { value: "edit", label: "Edit", icon: <PenLine /> },
            { value: "preview", label: "Preview", icon: <Eye /> },
          ]}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,11fr)_minmax(0,10fr)]">
        <div className={cn("flex min-w-0 flex-col gap-3", view === "preview" && "max-lg:hidden")}>
          <HeaderEditor header={draft.content.header} onChange={(header) => setContent((c) => ({ ...c, header }))} />
          <SectionsEditor
            sections={draft.content.sections}
            onReorder={(sections) => setContent((c) => ({ ...c, sections }))}
            onChange={patchSection}
          />
          <p className="px-1 text-xs text-muted-foreground">
            Drag the handle (or focus it and press Space, then the arrow keys) to reorder sections. The eye hides a section from
            the PDF.
          </p>
        </div>

        <div className={cn("min-w-0 lg:sticky lg:top-4", view === "edit" && "max-lg:hidden")}>
          <div className="rounded-2xl border bg-surface-2/70 p-3 sm:p-5 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
            <ScaledPreview content={draft.content} template={draft.template} />
          </div>
        </div>
      </div>

      <PrintCopy content={draft.content} template={draft.template} />

      <VersionHistory
        resumeId={resume.id}
        currentVersion={currentVersion}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        beforeSave={autosave.flush}
        onRestored={replaceFromServer}
      />
      <ConfirmDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Fill from your profile?"
        description="Header, summary, experience, education and skills are replaced with your profile data. Projects stay. You can undo by restoring a version."
        confirmLabel="Import"
        destructive={false}
        onConfirm={importProfile}
      />
    </div>
  );
};

const EditorSkeleton = () => (
  <div role="status" aria-label="Loading resume" className="flex flex-col gap-4">
    <Shimmer className="h-[68px] rounded-xl" />
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Shimmer key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <Shimmer className="aspect-[210/297] rounded-2xl max-lg:hidden" />
    </div>
  </div>
);
