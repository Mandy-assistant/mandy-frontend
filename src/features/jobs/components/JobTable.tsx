"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Page } from "@/lib/api/client";
import { cn } from "@/utils/cn";
import { formatDate, formatSalary } from "../format";
import type { Job, JobSort, JobSortField } from "../types";
import { CompanyLogo, StatusBadge } from "./bits";

type JobTableProps = {
  page: Page<Job>;
  sort: JobSort;
  onSort: (sort: JobSort) => void;
  onPage: (page: number) => void;
  onOpen: (job: Job) => void;
  /** Dim while the next page/sort loads. */
  fetching?: boolean;
};

const COLUMNS: { field: JobSortField; label: string; className?: string }[] = [
  { field: "company", label: "Company" },
  { field: "role", label: "Role" },
  { field: "status", label: "Status" },
  { field: "applied_at", label: "Applied" },
];

const SortButton = ({ field, label, sort, onSort }: { field: JobSortField; label: string; sort: JobSort; onSort: (s: JobSort) => void }) => {
  const active = sort.replace(/^-/, "") === field;
  const desc = sort.startsWith("-");
  const Icon = !active ? ArrowUpDown : desc ? ArrowDown : ArrowUp;
  return (
    <button
      type="button"
      onClick={() => onSort(active && !desc ? `-${field}` : field)}
      className={cn(
        "-ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold tracking-[0.08em] uppercase outline-none hover:bg-surface-hover focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <Icon className={cn("size-3.5", !active && "opacity-50")} aria-hidden />
    </button>
  );
};

export const JobTable = ({ page, sort, onSort, onPage, onOpen, fetching }: JobTableProps) => {
  const ariaSort = (field: JobSortField) =>
    sort.replace(/^-/, "") === field ? (sort.startsWith("-") ? "descending" : "ascending") : undefined;

  const rowKey = (e: KeyboardEvent, job: Job) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(job);
    }
  };

  return (
    <div className={cn("transition-opacity", fetching && "opacity-60")} aria-busy={fetching}>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {COLUMNS.map((c) => (
                <TableHead key={c.field} aria-sort={ariaSort(c.field)} className={cn("h-11 first:pl-5", c.className)}>
                  <SortButton field={c.field} label={c.label} sort={sort} onSort={onSort} />
                </TableHead>
              ))}
              <TableHead className="hidden text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase lg:table-cell">Location</TableHead>
              <TableHead className="pr-5 text-right text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Salary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.items.map((job) => (
              <TableRow
                key={job.id}
                tabIndex={0}
                onClick={() => onOpen(job)}
                onKeyDown={(e) => rowKey(e, job)}
                aria-label={`Open ${job.role} at ${job.company}`}
                className="cursor-pointer outline-none hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:shadow-[inset_3px_0_0_var(--color-primary)]"
              >
                <TableCell className="py-3 pl-5">
                  <span className="flex items-center gap-2.5">
                    <CompanyLogo company={job.company} size="sm" />
                    <span className="max-w-48 truncate font-semibold">{job.company}</span>
                  </span>
                </TableCell>
                <TableCell className="max-w-64 truncate">{job.role}</TableCell>
                <TableCell>
                  <StatusBadge status={job.status} />
                </TableCell>
                <TableCell className="font-mono text-muted-foreground tabular-nums">{formatDate(job.applied_at) ?? "—"}</TableCell>
                <TableCell className="hidden max-w-48 truncate text-muted-foreground lg:table-cell">{job.location || "—"}</TableCell>
                <TableCell className="pr-5 text-right font-mono tabular-nums">{formatSalary(job) ?? <span className="text-muted-foreground">—</span>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Phones: card list */}
      <Stagger className="flex flex-col gap-2.5 md:hidden" key={`${page.page}-${sort}`}>
        {page.items.map((job) => (
          <StaggerItem key={job.id} distance={10}>
            <button
              type="button"
              onClick={() => onOpen(job)}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg border bg-card p-3.5 text-left shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <CompanyLogo company={job.company} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{job.role}</span>
                <span className="flex items-center gap-1 truncate text-[13px] text-muted-foreground">
                  {job.company}
                  {job.location && (
                    <>
                      <span aria-hidden>·</span>
                      <MapPin className="size-3 shrink-0" aria-hidden />
                      <span className="truncate">{job.location}</span>
                    </>
                  )}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge status={job.status} />
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{formatDate(job.applied_at, "MMM d") ?? ""}</span>
              </span>
            </button>
          </StaggerItem>
        ))}
      </Stagger>

      <Pagination page={page} onPage={onPage} />
    </div>
  );
};

const Pagination = ({ page, onPage }: { page: Page<Job>; onPage: (p: number) => void }) => {
  const from = page.total === 0 ? 0 : (page.page - 1) * page.size + 1;
  const to = Math.min(page.total, page.page * page.size);
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        <span className="font-mono tabular-nums">
          {from}–{to}
        </span>{" "}
        of <span className="font-mono tabular-nums">{page.total}</span> jobs
      </p>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon" className="max-md:size-11" disabled={page.page <= 1} onClick={() => onPage(page.page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <span className="min-w-16 text-center font-mono text-sm tabular-nums">
          {page.page} / {Math.max(1, page.pages)}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="max-md:size-11"
          disabled={page.page >= page.pages}
          onClick={() => onPage(page.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
};
