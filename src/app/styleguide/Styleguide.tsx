"use client";

import { Inbox, Plus, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AnimatedNumber, Pressable, Stagger, StaggerItem } from "@/components/motion";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Orb } from "@/components/shared/Orb";
import { Overline, PageHeader } from "@/components/shared/PageHeader";
import { CardGridSkeleton, ListSkeleton } from "@/components/shared/skeletons";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";

const swatches: { group: string; tokens: string[] }[] = [
  { group: "Surfaces", tokens: ["background", "surface", "surface-2", "surface-hover", "muted", "border", "input"] },
  { group: "Text", tokens: ["foreground", "muted-foreground"] },
  { group: "Brand", tokens: ["primary", "primary-strong", "primary-soft", "cyan", "cyan-soft", "accent"] },
  { group: "Status", tokens: ["success", "success-soft", "warning", "warning-soft", "destructive", "destructive-soft", "info", "info-soft"] },
  { group: "Job pipeline", tokens: ["status-saved", "status-applied", "status-interview", "status-offer", "status-rejected"] },
  { group: "Priority", tokens: ["priority-high", "priority-medium", "priority-low"] },
  { group: "Focus & stage", tokens: ["focus", "focus-foreground", "focus-muted", "stage", "stage-foreground", "stage-muted"] },
];

// Tokens whose CSS variable name differs from the utility name.
const cssVar: Record<string, string> = { focus: "focus-bg", stage: "stage-bg" };

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-card">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </section>
);

export const Styleguide = () => {
  const [replay, setReplay] = useState(0);
  const [progress, setProgress] = useState(42);

  return (
    <main className="mx-auto flex max-w-page flex-col gap-6 px-4 py-10">
      <PageHeader overline="Dev only" title="Mandy styleguide" description="Tokens, primitives and motion. Toggle the theme to check both." actions={<ThemeToggle />} />

      <Section title="Colour tokens">
        {swatches.map(({ group, tokens }) => (
          <div key={group} className="flex flex-col gap-2">
            <Overline>{group}</Overline>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
              {tokens.map((t) => (
                <div key={t} className="overflow-hidden rounded-lg border">
                  <div className="h-14" style={{ background: `var(--${cssVar[t] ?? t})` }} />
                  <p className="px-2.5 py-2 font-mono text-[11px]">{t}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-16 rounded-lg bg-brand-gradient" />
          <div className="grid h-16 place-items-center rounded-lg border bg-surface text-2xl font-extrabold text-brand-gradient">Gradient text</div>
          <div className="flex items-center gap-3">
            {["shadow-card", "shadow-pop", "shadow-glow"].map((s) => (
              <div key={s} className={`grid h-16 flex-1 place-items-center rounded-lg bg-surface font-mono text-[11px] ${s}`}>
                {s.replace("shadow-", "")}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Type, radius & orb">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-[28px] font-bold tracking-tight">Heading 28 / 700</p>
            <p className="text-base font-semibold">Title 16 / 600</p>
            <p>Body 14 / 400 — Inter</p>
            <p className="text-muted-foreground">Muted body</p>
            <p className="font-mono tabular-nums">25:00 · 1,284 — JetBrains Mono</p>
            <Overline>Overline 11 / 600</Overline>
          </div>
          <div className="flex items-end gap-3">
            {["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl"].map((r) => (
              <div key={r} className={`grid size-16 place-items-center border bg-primary-soft font-mono text-[10px] text-primary-strong ${r}`}>
                {r.replace("rounded-", "")}
              </div>
            ))}
          </div>
          <div className="flex items-end gap-4">
            <Orb size={28} />
            <Orb size={48} />
            <Orb size={88} thinking />
          </div>
        </div>
      </Section>

      <Section title="Buttons, badges & inputs">
        <div className="flex flex-wrap items-center gap-2">
          <Button>
            <Plus data-icon="inline-start" />
            Primary
          </Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Sparkle">
            <Sparkles />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-strong">ML Engineer</span>
          <span className="rounded-full bg-info-soft px-2.5 py-0.5 text-xs font-medium text-info">Applied</span>
          <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">Interview</span>
          <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">Offer</span>
          <span className="rounded-full bg-destructive-soft px-2.5 py-0.5 text-xs font-medium text-destructive">Rejected</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Add a task and press Enter" aria-label="Example input" />
          <Input placeholder="Invalid" aria-invalid aria-label="Invalid example" />
          <Textarea placeholder="Notes" aria-label="Example textarea" />
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <Checkbox defaultChecked /> Checkbox
            </label>
            <label className="flex items-center gap-2">
              <Switch defaultChecked /> Switch
            </label>
          </div>
        </div>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Overview</TabsTrigger>
            <TabsTrigger value="b">Experience</TabsTrigger>
          </TabsList>
          <TabsContent value="a" className="text-muted-foreground">
            Tab content A
          </TabsContent>
          <TabsContent value="b" className="text-muted-foreground">
            Tab content B
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Motion">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setReplay((n) => n + 1)}>
            Replay stagger
          </Button>
          <Button variant="outline" onClick={() => setProgress((p) => (p + 23) % 101)}>
            Change progress
          </Button>
          <Button variant="outline" onClick={() => toast.success("Task added for today", { action: { label: "Undo", onClick: () => {} } })}>
            Success toast
          </Button>
          <Button variant="outline" onClick={() => toast.error("Couldn't save the job")}>
            Error toast
          </Button>
          <Button variant="outline" onClick={() => toast.info("Interview with Vercel on Friday")}>
            Info toast
          </Button>
          <ConfirmDialog
            trigger={<Button variant="destructive">Confirm dialog</Button>}
            title="Delete this job?"
            description="Its status history goes too. This can't be undone."
            onConfirm={() => {
              toast.success("Deleted");
            }}
          />
        </div>
        <Stagger key={replay} className="grid gap-3 sm:grid-cols-4">
          {["Stagger", "items", "rise in", "one by one"].map((t) => (
            <StaggerItem key={t}>
              <Pressable className="grid h-20 cursor-pointer place-items-center rounded-lg border bg-surface font-medium shadow-card">{t}</Pressable>
            </StaggerItem>
          ))}
        </Stagger>
        <div className="flex flex-wrap items-center gap-8">
          <p className="text-4xl font-bold">
            <AnimatedNumber key={replay} value={1284} />
          </p>
          <div className="w-64">
            <Progress value={progress} />
          </div>
        </div>
      </Section>

      <Section title="States">
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState icon={Inbox} title="No saved articles yet" description="Tap the bookmark on any story to keep it here." action={<Button size="sm">Browse news</Button>} />
          <ErrorState error={new ApiError("Job not found", 404)} onRetry={() => {}} />
        </div>
        <ListSkeleton rows={3} />
        <CardGridSkeleton count={3} />
      </Section>
    </main>
  );
};
