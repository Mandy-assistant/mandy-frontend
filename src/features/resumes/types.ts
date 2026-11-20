/** API types for /resumes (snake_case, matches docs/api-contract.md). */

export type Template = "modern" | "classic";
export type SectionType = "summary" | "experience" | "education" | "skills" | "projects";

export type SectionItem = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  bullets?: string[];
  tags?: string[];
  url?: string | null;
};

export type Section = {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  text: string | null;
  items: SectionItem[];
};

export type ResumeHeader = {
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: { label: string; url: string }[];
};

export type ResumeContent = { header: ResumeHeader; sections: Section[] };

export type Resume = {
  id: string;
  title: string;
  template: Template;
  content?: ResumeContent | null;
  current_version: number;
  created_at: string;
  updated_at: string;
};

export type ResumeVersion = { id: string; version: number; content: ResumeContent; created_at: string };

export type ResumePatch = { title?: string; template?: Template; content?: ResumeContent };

export type RewriteKind = "summary" | "bullet" | "cover_note";
