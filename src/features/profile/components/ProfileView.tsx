"use client";

import { Briefcase, GraduationCap, Mail, MapPin, Settings2, Sparkles, UserRound, Wrench, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Overline } from "@/components/shared/PageHeader";
import { DetailSkeleton } from "@/components/shared/skeletons";
import { ErrorState } from "@/components/shared/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { duration, easeOut } from "@/lib/motion";
import { initials } from "../format";
import { useProfile } from "../hooks";
import type { Profile } from "../types";
import { CompletenessRing } from "./CompletenessRing";
import { EducationTab } from "./EducationTab";
import { ExperienceTab } from "./ExperienceTab";
import { OverviewTab } from "./OverviewTab";
import { PreferencesTab } from "./PreferencesTab";
import { SkillsTab } from "./SkillsTab";

const TABS = ["overview", "experience", "education", "skills", "preferences"] as const;
type Tab = (typeof TABS)[number];

const TAB_META: Record<Tab, { label: string; icon: LucideIcon }> = {
  overview: { label: "Overview", icon: UserRound },
  experience: { label: "Experience", icon: Briefcase },
  education: { label: "Education", icon: GraduationCap },
  skills: { label: "Skills", icon: Wrench },
  preferences: { label: "Preferences", icon: Settings2 },
};

/** The first thing still missing, to nudge the completeness meter up. */
const nextStep = (p: Profile): { label: string; tab: Tab } | null => {
  if (!p.headline) return { label: "Add a headline", tab: "overview" };
  if (!p.summary) return { label: "Write a short summary", tab: "overview" };
  if (!p.experience.length) return { label: "Add your experience", tab: "experience" };
  if (!p.education.length) return { label: "Add your education", tab: "education" };
  if (p.skills.length < 3) return { label: "List at least 3 skills", tab: "skills" };
  if (!p.target_roles.length) return { label: "Pick target roles", tab: "overview" };
  if (!Object.values(p.links).some(Boolean)) return { label: "Link GitHub or LinkedIn", tab: "overview" };
  if (!p.preferences.work_modes.length) return { label: "Set job preferences", tab: "preferences" };
  return null;
};

export const ProfileView = () => {
  const { data: profile, isPending, isError, error, refetch } = useProfile();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : "overview";

  const setTab = (next: Tab) => {
    const sp = new URLSearchParams(params.toString());
    if (next === "overview") sp.delete("tab");
    else sp.set("tab", next);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  if (isPending) return <DetailSkeleton />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} title="Couldn't load your profile" />;

  const step = nextStep(profile);
  const counts: Partial<Record<Tab, number>> = {
    experience: profile.experience.length,
    education: profile.education.length,
    skills: profile.skills.length,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-card sm:p-7">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-brand-gradient opacity-[0.07]" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -right-20 size-72 rounded-full bg-brand-gradient opacity-25 blur-3xl"
        />
        <div className="relative flex flex-wrap items-center gap-5 sm:gap-7">
          <div className="grid size-20 shrink-0 place-items-center rounded-[28px] bg-brand-gradient text-2xl font-bold tracking-tight text-white shadow-glow sm:size-24 sm:text-3xl">
            {initials(profile.full_name)}
          </div>
          <div className="min-w-[220px] flex-1">
            <Overline className="text-primary-strong">Career profile</Overline>
            <h1 className="mt-1 truncate text-2xl font-bold sm:text-[28px]">{profile.full_name || "Your name"}</h1>
            <p className="mt-0.5 text-[15px] text-muted-foreground">
              {profile.headline || "Add a headline so recruiters know what you do"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.location && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden /> {profile.location}
                </span>
              )}
              {profile.email && (
                <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" aria-hidden /> <span className="truncate">{profile.email}</span>
                </span>
              )}
              {profile.target_roles.slice(0, 3).map((r) => (
                <span key={r} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-strong">
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div className="flex w-full items-center gap-4 rounded-[20px] border bg-surface/70 p-3 pr-5 backdrop-blur sm:w-auto">
            <CompletenessRing value={profile.completeness} size={92} />
            <div className="min-w-0">
              <Overline>Profile strength</Overline>
              <p className="mt-0.5 font-semibold">
                {profile.completeness >= 100 ? "All set" : profile.completeness >= 70 ? "Looking strong" : "Getting there"}
              </p>
              {step ? (
                <button
                  type="button"
                  onClick={() => setTab(step.tab)}
                  className="mt-1 inline-flex min-h-8 items-center gap-1 text-[13px] font-medium text-primary-strong hover:underline"
                >
                  <Sparkles className="size-3.5" aria-hidden /> {step.label}
                </button>
              ) : (
                <p className="mt-1 text-[13px] text-muted-foreground">Resumes can be built from this.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-5">
        <div className="-mx-4 scrollbar-none overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabsList className="h-auto! w-max gap-1 rounded-2xl bg-surface-2 p-1">
            {TABS.map((t) => {
              const { label, icon: Icon } = TAB_META[t];
              return (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="h-10 flex-none gap-2 rounded-xl px-3.5 md:h-9 data-active:bg-surface data-active:shadow-card dark:data-active:bg-surface-hover"
                >
                  <Icon aria-hidden />
                  {label}
                  {counts[t] ? (
                    <span className="rounded-full bg-primary-soft px-1.5 font-mono text-[11px] text-primary-strong tabular-nums">
                      {counts[t]}
                    </span>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.base, ease: easeOut }}
          >
            <TabsContent value={tab} keepMounted={false}>
              {tab === "overview" && <OverviewTab profile={profile} />}
              {tab === "experience" && <ExperienceTab items={profile.experience} />}
              {tab === "education" && <EducationTab items={profile.education} />}
              {tab === "skills" && <SkillsTab skills={profile.skills} />}
              {tab === "preferences" && <PreferencesTab profile={profile} />}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};
