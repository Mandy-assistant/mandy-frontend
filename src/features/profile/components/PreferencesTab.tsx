"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Check, Home, Laptop, MapPinned, Wallet } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { applyApiErrors } from "@/lib/api/form-errors";
import { cn } from "@/utils/cn";
import { useUpdateProfile } from "../hooks";
import { preferencesSchema, type PreferencesValues } from "../schemas";
import type { Profile, WorkMode } from "../types";
import { describedBy, Field, inputClass, SectionCard, SimpleSelect, TagInput } from "./form-kit";
import { SaveBar } from "./SaveBar";

const MODES: { value: WorkMode; label: string; hint: string; icon: typeof Laptop }[] = [
  { value: "remote", label: "Remote", hint: "Work from anywhere", icon: Laptop },
  { value: "hybrid", label: "Hybrid", hint: "A few days in office", icon: Home },
  { value: "onsite", label: "On-site", hint: "Full-time in office", icon: Building2 },
];

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "CAD", "AUD", "SGD", "AED"].map((c) => ({ value: c, label: c }));

const toValues = (p: Profile): PreferencesValues => ({
  locations: p.preferences.locations ?? [],
  work_modes: p.preferences.work_modes ?? [],
  salary_min: p.preferences.salary_min?.toString() ?? "",
  salary_max: p.preferences.salary_max?.toString() ?? "",
  currency: p.preferences.currency ?? "INR",
});

const FIELDS = ["locations", "work_modes", "salary_min", "salary_max", "currency"] as const;

export const PreferencesTab = ({ profile }: { profile: Profile }) => {
  const update = useUpdateProfile();
  const form = useForm<PreferencesValues>({ resolver: zodResolver(preferencesSchema), defaultValues: toValues(profile) });
  const { control, register, handleSubmit, formState, reset, setError } = form;
  const e = formState.errors;
  const [currency, salaryMin, salaryMax] = useWatch({ control, name: ["currency", "salary_min", "salary_max"] });

  const onSubmit = handleSubmit(async (v) => {
    try {
      const saved = await update.mutateAsync({
        preferences: {
          locations: v.locations,
          work_modes: v.work_modes,
          salary_min: v.salary_min ? Number(v.salary_min) : null,
          salary_max: v.salary_max ? Number(v.salary_max) : null,
          currency: v.currency,
        },
      });
      reset(toValues(saved));
      toast.success("Preferences saved");
    } catch (error) {
      applyApiErrors(error, setError, FIELDS);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit}>
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Work mode" description="Pick all that work for you." icon={<Laptop />} className="lg:col-span-2">
          <Controller
            control={control}
            name="work_modes"
            render={({ field }) => (
              <div role="group" aria-label="Work modes" className="grid gap-3 sm:grid-cols-3">
                {MODES.map((m) => {
                  const on = field.value.includes(m.value);
                  return (
                    <button
                      key={m.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => field.onChange(on ? field.value.filter((x) => x !== m.value) : [...field.value, m.value])}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-2xl border-[1.5px] p-4 text-left transition-[border-color,background-color,box-shadow] duration-150",
                        on ? "border-primary bg-primary-soft/60" : "border-border bg-surface hover:border-primary/40",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-11 shrink-0 place-items-center rounded-xl transition-colors",
                          on ? "bg-brand-gradient text-white" : "bg-surface-2 text-muted-foreground",
                        )}
                      >
                        <m.icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{m.label}</span>
                        <span className="block text-xs text-muted-foreground">{m.hint}</span>
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-5 place-items-center rounded-full border transition-all",
                          on ? "border-primary bg-primary text-primary-foreground" : "border-input text-transparent",
                        )}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          />
        </SectionCard>

        <SectionCard title="Preferred locations" description="Cities or regions you'd move to or work from." icon={<MapPinned />}>
          <Controller
            control={control}
            name="locations"
            render={({ field, fieldState }) => (
              <Field
                label="Locations"
                htmlFor="pr-locations"
                error={fieldState.error?.message ?? e.locations?.root?.message}
                hint="Press Enter to add."
              >
                <TagInput
                  id="pr-locations"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g. Bengaluru"
                  max={15}
                  aria-describedby={describedBy("pr-locations")}
                  suggestions={["Remote", "Bengaluru", "Chennai", "Hyderabad", "Pune"]}
                />
              </Field>
            )}
          />
        </SectionCard>

        <SectionCard title="Expected salary" description="Yearly, before tax. Only you see this." icon={<Wallet />}>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_110px]">
            <Field label="Minimum" htmlFor="pr-min" error={e.salary_min?.message}>
              <Input
                id="pr-min"
                inputMode="numeric"
                placeholder="1200000"
                aria-invalid={!!e.salary_min || undefined}
                aria-describedby={describedBy("pr-min")}
                className={cn(inputClass, "font-mono tabular-nums")}
                {...register("salary_min")}
              />
            </Field>
            <Field label="Maximum" htmlFor="pr-max" error={e.salary_max?.message}>
              <Input
                id="pr-max"
                inputMode="numeric"
                placeholder="1800000"
                aria-invalid={!!e.salary_max || undefined}
                aria-describedby={describedBy("pr-max")}
                className={cn(inputClass, "font-mono tabular-nums")}
                {...register("salary_max")}
              />
            </Field>
            <Field label="Currency" htmlFor="pr-currency" error={e.currency?.message}>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <SimpleSelect id="pr-currency" value={field.value} onChange={field.onChange} options={CURRENCIES} />
                )}
              />
            </Field>
          </div>
          <SalaryPreview min={salaryMin} max={salaryMax} currency={currency} />
        </SectionCard>
      </div>
      <SaveBar visible={formState.isDirty} saving={update.isPending} onDiscard={() => reset()} />
    </form>
  );
};

const SalaryPreview = ({ min, max, currency }: { min: string; max: string; currency: string }) => {
  const fmt = (v: string) => {
    if (!/^\d+$/.test(v)) return null;
    try {
      return new Intl.NumberFormat("en", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(
        Number(v),
      );
    } catch {
      return v;
    }
  };
  const a = fmt(min);
  const b = fmt(max);
  if (!a && !b) return null;
  return (
    <p className="mt-4 rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm text-muted-foreground" aria-live="polite">
      Looking for{" "}
      <span className="font-mono font-semibold text-foreground tabular-nums">{[a, b].filter(Boolean).join(" – ")}</span> a year
    </p>
  );
};
