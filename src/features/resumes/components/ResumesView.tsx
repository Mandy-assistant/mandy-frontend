"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { Copy, FileText, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { duration, easeOut } from "@/lib/motion";
import { useHydrated } from "@/lib/use-hydrated";
import { normalizeContent } from "../content";
import { useDeleteResume, useDuplicateResume, useResumes } from "../hooks";
import type { Resume } from "../types";
import { NewResumeDialog } from "./NewResumeDialog";
import { ResumePreview } from "./ResumePreview";
import { TemplateThumb } from "./TemplateThumb";

const THUMB_SCALE = 0.36;

export const ResumesView = () => {
  const { data, isPending, isError, error, refetch } = useResumes();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Resume | null>(null);
  const del = useDeleteResume();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Command palette / deep link: /resumes?new=1
  useEffect(() => {
    if (params.get("new") !== "1") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- open once from the URL, then strip it
    setCreating(true);
    router.replace(pathname, { scroll: false });
  }, [params, router, pathname]);

  const newButton = (
    <Button onClick={() => setCreating(true)} className="h-10">
      <Plus data-icon="inline-start" /> New resume
    </Button>
  );

  return (
    <>
      <PageHeader
        overline="Resumes"
        title="Your resumes"
        description="One per kind of role. Edit with a live preview and export a clean A4 PDF."
        actions={newButton}
      />

      {isPending ? (
        <CardGridSkeleton count={3} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} title="Couldn't load your resumes" />
      ) : data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Start from your profile and Mandy fills in your experience, education and skills."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus data-icon="inline-start" /> Create your first resume
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {data.map((r, i) => (
              <ResumeCard key={r.id} resume={r} index={i} onDelete={() => setDeleting(r)} />
            ))}
          </AnimatePresence>
          <li>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="group flex h-full min-h-60 w-full flex-col items-center justify-center gap-3 rounded-xl border-[1.5px] border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary-soft/30 hover:text-primary-strong"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-strong transition-transform group-hover:scale-105">
                <Plus className="size-5" aria-hidden />
              </span>
              <span className="font-semibold">New resume</span>
              <span className="text-xs">Blank or from your profile</span>
            </button>
          </li>
        </ul>
      )}

      <NewResumeDialog open={creating} onOpenChange={setCreating} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.title ?? ""}”?`}
        description="The resume and all its versions are deleted. This can't be undone."
        onConfirm={() => {
          if (deleting) del.mutate(deleting.id);
        }}
      />
    </>
  );
};

const ResumeCard = ({ resume, index, onDelete }: { resume: Resume; index: number; onDelete: () => void }) => {
  const hydrated = useHydrated();
  const duplicate = useDuplicateResume();
  const href = `/resumes/${resume.id}`;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { duration: duration.slow, ease: easeOut, delay: Math.min(index, 8) * 0.04 } }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: duration.fast } }}
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-card transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-pop"
    >
      <div className="relative h-52 overflow-hidden bg-surface-2">
        <div aria-hidden className="absolute inset-0 bg-brand-gradient opacity-[0.08]" />
        {resume.content?.sections ? (
          <div
            aria-hidden
            className="absolute top-6 left-1/2 origin-top overflow-hidden rounded-[4px] shadow-pop transition-transform duration-300 ease-out group-hover:-translate-y-1.5"
            style={{ width: 794 * THUMB_SCALE, marginLeft: -(794 * THUMB_SCALE) / 2, height: 1123 * THUMB_SCALE }}
          >
            <div style={{ transform: `scale(${THUMB_SCALE})`, transformOrigin: "top left", width: 794 }}>
              <ResumePreview content={normalizeContent(resume.content)} template={resume.template} />
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-10 top-6 transition-transform duration-300 group-hover:-translate-y-1.5">
            <TemplateThumb template={resume.template} className="aspect-auto h-56 shadow-pop" />
          </div>
        )}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-card to-transparent" />
      </div>

      <div className="flex items-start gap-2 p-4 pt-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold">
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {resume.title}
            </Link>
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span
              className={
                resume.template === "modern"
                  ? "rounded-full bg-primary-soft px-2 py-0.5 font-medium text-primary-strong"
                  : "rounded-full bg-surface-2 px-2 py-0.5 font-medium text-foreground/80"
              }
            >
              {resume.template === "modern" ? "Modern" : "Classic"}
            </span>
            <span className="font-mono tabular-nums">v{resume.current_version}</span>
            <span aria-hidden>·</span>
            <span>
              Edited{" "}
              {hydrated ? formatDistanceToNow(parseISO(resume.updated_at), { addSuffix: true }) : resume.updated_at.slice(0, 10)}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative z-10 -mr-1 size-10 rounded-xl text-muted-foreground md:size-9"
                aria-label={`Actions for ${resume.title}`}
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem render={<Link href={href} />}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicate.mutate(resume.id)}>
              <Copy /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.li>
  );
};
