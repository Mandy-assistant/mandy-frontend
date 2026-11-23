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

export type ResumeFont = "sans" | "serif" | "mono";
export type ResumeDensity = "compact" | "comfortable";

/** Look of the page. null = the template's own defaults. */
export type ResumeStyle = { accent: string; font: ResumeFont; density: ResumeDensity };

export type ResumeContent = { header: ResumeHeader; sections: Section[]; style?: ResumeStyle | null };

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

export type ResumeAIResult = { resume: Resume; notes: string };
export type ResumeGenerateInput = { prompt: string; job_description?: string; title?: string };
export type ResumeReviseInput = { prompt: string; job_description?: string };
