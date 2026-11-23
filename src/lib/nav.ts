import { Briefcase, CheckSquare, FileText, LayoutGrid, Map, Newspaper, Settings, UserRound, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Short label for the mobile bottom nav */
  short: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom nav; the rest live under "More" */
  mobile?: boolean;
  keywords?: string[];
};

/** One list for sidebar, bottom nav and command palette. */
export const navItems: NavItem[] = [
  { href: "/", label: "Daily brief", short: "Home", icon: LayoutGrid, mobile: true, keywords: ["home", "dashboard"] },
  { href: "/tasks", label: "Tasks", short: "Tasks", icon: CheckSquare, mobile: true, keywords: ["todo", "study"] },
  {
    href: "/jobs",
    label: "Jobs",
    short: "Jobs",
    icon: Briefcase,
    mobile: true,
    keywords: ["applications", "kanban", "discover", "openings", "remote"],
  },
  { href: "/roadmaps", label: "Roadmaps", short: "Roadmaps", icon: Map, mobile: true, keywords: ["learning", "milestones"] },
  {
    href: "/news",
    label: "Tech news",
    short: "News",
    icon: Newspaper,
    keywords: ["articles", "reading", "hacker news", "reddit", "stories"],
  },
  { href: "/resumes", label: "Resumes", short: "Resumes", icon: FileText, keywords: ["cv"] },
  { href: "/profile", label: "Profile", short: "Profile", icon: UserRound, keywords: ["experience", "skills"] },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings, keywords: ["passkeys", "recovery", "theme"] },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export const titleFor = (pathname: string) => navItems.find((item) => isActive(pathname, item.href))?.label ?? "Mandy";
