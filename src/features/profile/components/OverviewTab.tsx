"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, Globe, IdCard, Link2, Target, TextQuote } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applyApiErrors } from "@/lib/api/form-errors";
import { useUpdateProfile } from "../hooks";
import { overviewSchema, type OverviewValues } from "../schemas";
import type { Profile } from "../types";
import { describedBy, Field, inputClass, SectionCard, TagInput, textareaClass } from "./form-kit";
import { SaveBar } from "./SaveBar";

const ROLE_SUGGESTIONS = [
  "Frontend Engineer",
  "Full-stack Engineer",
  "ML Engineer",
  "Backend Engineer",
  "Data Scientist",
  "Software Engineer Intern",
];

const toValues = (p: Profile): OverviewValues => ({
  full_name: p.full_name ?? "",
  email: p.email ?? "",
  headline: p.headline ?? "",
  summary: p.summary ?? "",
  location: p.location ?? "",
  phone: p.phone ?? "",
  links: {
    github: p.links.github ?? "",
    linkedin: p.links.linkedin ?? "",
    portfolio: p.links.portfolio ?? "",
    website: p.links.website ?? "",
  },
  target_roles: p.target_roles ?? [],
});

const FIELDS = [
  "full_name",
  "email",
  "headline",
  "summary",
  "location",
  "phone",
  "links.github",
  "links.linkedin",
  "links.portfolio",
  "links.website",
  "target_roles",
] as const;

const LINKS = [
  { key: "github", label: "GitHub", placeholder: "https://github.com/you" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/you" },
  { key: "portfolio", label: "Portfolio", placeholder: "https://you.dev" },
  { key: "website", label: "Website", placeholder: "https://blog.you.dev" },
] as const;

const nullable = (v: string) => (v.trim() ? v.trim() : null);

export const OverviewTab = ({ profile }: { profile: Profile }) => {
  const update = useUpdateProfile();
  const form = useForm<OverviewValues>({ resolver: zodResolver(overviewSchema), defaultValues: toValues(profile) });
  const { register, formState, control, handleSubmit, reset, setError } = form;
  const e = formState.errors;
  const summaryLength = useWatch({ control, name: "summary" })?.length ?? 0;

  const onSubmit = handleSubmit(async (v) => {
    try {
      const saved = await update.mutateAsync({
        full_name: v.full_name,
        email: v.email,
        headline: nullable(v.headline),
        summary: nullable(v.summary),
        location: nullable(v.location),
        phone: nullable(v.phone),
        links: {
          github: nullable(v.links.github),
          linkedin: nullable(v.links.linkedin),
          portfolio: nullable(v.links.portfolio),
          website: nullable(v.links.website),
        },
        target_roles: v.target_roles,
      });
      reset(toValues(saved));
      toast.success("Profile saved");
    } catch (error) {
      applyApiErrors(error, setError, FIELDS);
    }
  });

  const text = (
    id: keyof OverviewValues,
    label: string,
    opts: { placeholder?: string; type?: string; autoComplete?: string; optional?: boolean } = {},
  ) => (
    <Field label={label} htmlFor={`pf-${id}`} error={e[id]?.message as string | undefined} optional={opts.optional}>
      <Input
        id={`pf-${id}`}
        type={opts.type ?? "text"}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete}
        aria-invalid={!!e[id] || undefined}
        aria-describedby={describedBy(`pf-${id}`)}
        className={inputClass}
        {...register(id)}
      />
    </Field>
  );

  return (
    <form noValidate onSubmit={onSubmit}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <SectionCard title="Basics" description="How you appear on resumes and to Mandy." icon={<IdCard />}>
            <div className="grid gap-4 sm:grid-cols-2">
              {text("full_name", "Full name", { autoComplete: "name" })}
              {text("email", "Email", { type: "email", autoComplete: "email" })}
              <div className="sm:col-span-2">
                {text("headline", "Headline", { placeholder: "Frontend developer learning ML", optional: true })}
              </div>
              {text("location", "Location", { placeholder: "Chennai, India", autoComplete: "address-level2", optional: true })}
              {text("phone", "Phone", { type: "tel", placeholder: "+91 98765 43210", autoComplete: "tel", optional: true })}
            </div>
          </SectionCard>

          <SectionCard
            title="About you"
            description="A short professional summary. It becomes your resume summary."
            icon={<TextQuote />}
          >
            <Field
              label="Summary"
              htmlFor="pf-summary"
              error={e.summary?.message}
              hint={<span className="font-mono tabular-nums">{summaryLength} / 2000</span>}
            >
              <Textarea
                id="pf-summary"
                rows={6}
                placeholder="Developer with 2 years of React experience, now moving into machine learning…"
                aria-invalid={!!e.summary || undefined}
                aria-describedby={describedBy("pf-summary")}
                className={textareaClass}
                {...register("summary")}
              />
            </Field>
          </SectionCard>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <SectionCard title="Links" description="Where people can see your work." icon={<Link2 />}>
            <div className="flex flex-col gap-4">
              {LINKS.map(({ key, label, placeholder }) => {
                const id = `pf-link-${key}`;
                const err = e.links?.[key]?.message;
                return (
                  <Field key={key} label={label} htmlFor={id} error={err} optional>
                    <div className="relative">
                      {key === "website" ? (
                        <Globe
                          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden
                        />
                      ) : (
                        <AtSign
                          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden
                        />
                      )}
                      <Input
                        id={id}
                        type="url"
                        inputMode="url"
                        placeholder={placeholder}
                        aria-invalid={!!err || undefined}
                        aria-describedby={describedBy(id)}
                        className={`${inputClass} pl-10`}
                        {...register(`links.${key}`)}
                      />
                    </div>
                  </Field>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Target roles" description="Mandy tailors jobs, news and resumes to these." icon={<Target />}>
            <Controller
              control={control}
              name="target_roles"
              render={({ field, fieldState }) => (
                <Field
                  label="Roles"
                  htmlFor="pf-roles"
                  error={fieldState.error?.message ?? e.target_roles?.root?.message}
                  hint="Press Enter or comma to add."
                >
                  <TagInput
                    id="pf-roles"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="e.g. ML Engineer"
                    max={12}
                    invalid={!!fieldState.error}
                    aria-describedby={describedBy("pf-roles")}
                    suggestions={ROLE_SUGGESTIONS}
                  />
                </Field>
              )}
            />
          </SectionCard>
        </div>
      </div>

      <SaveBar visible={formState.isDirty} saving={update.isPending} onDiscard={() => reset()} />
    </form>
  );
};
