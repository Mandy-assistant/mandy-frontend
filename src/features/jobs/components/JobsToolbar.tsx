"use client";

import { KanbanSquare, Search, Table2, X } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_META } from "../status";
import { JOB_STATUSES, isJobStatus, type JobStatus } from "../types";
import type { JobsView } from "../use-jobs-params";
import { StatusDot } from "./bits";

const ALL = "all";
const statusItems = [{ value: ALL, label: "All statuses" }, ...JOB_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))];

type JobsToolbarProps = {
  search: string;
  onSearch: (q: string) => void;
  status?: JobStatus;
  onStatus: (status: JobStatus | undefined) => void;
  view: JobsView;
  onView: (view: JobsView) => void;
};

export const JobsToolbar = ({ search, onSearch, status, onStatus, view, onView }: JobsToolbarProps) => (
  <div className="mb-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
    <InputGroup className="h-11 rounded-md bg-card sm:h-9 sm:max-w-xs">
      <InputGroupAddon>
        <Search aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search company, role, tags…"
        aria-label="Search jobs"
        enterKeyHint="search"
      />
      {search && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => onSearch("")}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>

    <div className="flex items-center gap-2.5 sm:contents">
      <Select items={statusItems} value={status ?? ALL} onValueChange={(v) => onStatus(isJobStatus(v) ? v : undefined)}>
        <SelectTrigger aria-label="Filter by status" className="h-11! flex-1 rounded-md bg-card sm:h-9! sm:w-44 sm:flex-none">
          <SelectValue>
            {(v: string) =>
              isJobStatus(v) ? (
                <>
                  <StatusDot status={v} />
                  {STATUS_META[v].label}
                </>
              ) : (
                "All statuses"
              )
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          <SelectSeparator />
          {JOB_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              <StatusDot status={s} />
              {STATUS_META[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Tabs value={view} onValueChange={(v) => onView(v === "table" ? "table" : "board")} className="sm:ml-auto">
        <TabsList aria-label="View" className="h-11! rounded-md bg-surface-2 sm:h-9!">
          <TabsTrigger value="board" className="gap-1.5 rounded-[9px] px-3">
            <KanbanSquare aria-hidden />
            Board
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-1.5 rounded-[9px] px-3">
            <Table2 aria-hidden />
            Table
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  </div>
);
