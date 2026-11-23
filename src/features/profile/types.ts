/** API types for /profile (snake_case, matches docs/api-contract.md). */

export type WorkMode = "remote" | "hybrid" | "onsite";
export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type SkillCategory = "language" | "framework" | "tool" | "ml" | "other";

export type ProfileLinks = {
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  website: string | null;
};

export type Preferences = {
  locations: string[];
  work_modes: WorkMode[];
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
};

export type Experience = {
  id: string;
  company: string;
  title: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  current: boolean;
  description: string | null;
  highlights: string[];
};

export type Education = {
  id: string;
  school: string;
  degree: string | null;
  field: string | null;
  start_date: string;
  end_date: string | null;
  grade: string | null;
  description: string | null;
};

export type Skill = { id: string; name: string; level: SkillLevel; category: SkillCategory };

export type Profile = {
  full_name: string;
  email: string;
  headline: string | null;
  summary: string | null;
  location: string | null;
  phone: string | null;
  links: ProfileLinks;
  target_roles: string[];
  preferences: Preferences;
  completeness: number;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
};

export type ProfileUpdate = Partial<
  Pick<Profile, "full_name" | "email" | "headline" | "summary" | "location" | "phone" | "links" | "target_roles" | "preferences">
>;

export type ExperienceInput = Omit<Experience, "id">;
export type EducationInput = Omit<Education, "id">;
export type SkillInput = Omit<Skill, "id">;
