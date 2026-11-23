import type { Profile } from "@/features/profile/types";
import type { ResumeContent, Section, SectionItem, SectionType } from "./types";

/** Client-side id for sections/items. Call from handlers only (not during render). */
export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const SECTION_LABEL: Record<SectionType, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
};
export const SECTION_ORDER: SectionType[] = ["summary", "experience", "education", "skills", "projects"];

export const emptySection = (type: SectionType): Section => ({
  id: newId(),
  type,
  title: SECTION_LABEL[type],
  visible: true,
  text: type === "summary" ? "" : null,
  items: [],
});

export const emptyItem = (): SectionItem => ({
  id: newId(),
  title: "",
  subtitle: "",
  location: "",
  start_date: "",
  end_date: "",
  description: "",
  bullets: [],
  tags: [],
  url: "",
});

export const blankContent = (): ResumeContent => ({
  header: { full_name: "", headline: "", email: "", phone: "", location: "", links: [] },
  sections: SECTION_ORDER.map(emptySection),
});

/** Fill in anything the API left out so the editor can rely on arrays/strings. */
export const normalizeContent = (c: ResumeContent | null | undefined): ResumeContent => {
  const base = blankContent();
  if (!c) return base;
  return {
    header: {
      ...base.header,
      ...Object.fromEntries(Object.entries(c.header ?? {}).map(([k, v]) => [k, v ?? (k === "links" ? [] : "")])),
    },
    sections: (c.sections ?? []).map((s) => ({
      ...s,
      title: s.title ?? SECTION_LABEL[s.type],
      visible: s.visible ?? true,
      text: s.text ?? (s.type === "summary" ? "" : null),
      items: (s.items ?? []).map((i) => ({ ...i, bullets: i.bullets ?? [], tags: i.tags ?? [] })),
    })),
  };
};

const CATEGORY_TITLE: Record<string, string> = {
  language: "Languages",
  framework: "Frameworks",
  tool: "Tools",
  ml: "ML & AI",
  other: "Other",
};

/** Maps the career profile onto resume sections. Keeps the existing Projects section. */
export const profileToContent = (p: Profile, current?: ResumeContent): ResumeContent => {
  const links = Object.entries(p.links ?? {})
    .filter(([, url]) => !!url)
    .map(([label, url]) => ({
      label: label === "github" ? "GitHub" : label === "linkedin" ? "LinkedIn" : label.charAt(0).toUpperCase() + label.slice(1),
      url: url as string,
    }));

  const sectionFor = (type: SectionType) => current?.sections.find((s) => s.type === type);
  const keep = (type: SectionType, patch: Partial<Section>): Section => ({
    ...(sectionFor(type) ?? emptySection(type)),
    ...patch,
  });

  const byCategory = new Map<string, string[]>();
  for (const s of p.skills) byCategory.set(s.category, [...(byCategory.get(s.category) ?? []), s.name]);

  const filled: Record<SectionType, Section> = {
    summary: keep("summary", { text: p.summary ?? "" }),
    experience: keep("experience", {
      items: p.experience.map((x) => ({
        id: newId(),
        title: x.title,
        subtitle: x.company,
        location: x.location ?? "",
        start_date: x.start_date ?? "",
        end_date: x.current ? "Present" : (x.end_date ?? ""),
        description: x.description ?? "",
        bullets: x.highlights ?? [],
        tags: [],
        url: "",
      })),
    }),
    education: keep("education", {
      items: p.education.map((x) => ({
        id: newId(),
        title: [x.degree, x.field].filter(Boolean).join(", "),
        subtitle: x.school,
        location: x.grade ?? "",
        start_date: x.start_date ?? "",
        end_date: x.end_date ?? "",
        description: x.description ?? "",
        bullets: [],
        tags: [],
        url: "",
      })),
    }),
    skills: keep("skills", {
      items: [...byCategory.entries()].map(([cat, names]) => ({
        id: newId(),
        title: CATEGORY_TITLE[cat] ?? cat,
        tags: names,
        bullets: [],
      })),
    }),
    projects: sectionFor("projects") ?? emptySection("projects"),
  };

  const order = current?.sections.length ? current.sections.map((s) => s.type) : SECTION_ORDER;
  const types = [...order, ...SECTION_ORDER.filter((t) => !order.includes(t))];
  return {
    header: {
      full_name: p.full_name ?? "",
      headline: p.headline ?? "",
      email: p.email ?? "",
      phone: p.phone ?? "",
      location: p.location ?? "",
      links,
    },
    sections: types.map((t) => filled[t]),
  };
};
