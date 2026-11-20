/** Slash commands understood by the Ask bar. Anything else is a question for Mandy. */
export type Command =
  | { kind: "task"; title: string }
  | { kind: "job"; company: string; role: string }
  | { kind: "plan"; goal: string }
  | { kind: "news"; q: string }
  | { kind: "focus" }
  | { kind: "invalid"; message: string }
  | { kind: "ask"; message: string };

export const COMMAND_CHIPS = [
  { cmd: "/task ", label: "/task", hint: "Add a task" },
  { cmd: "/job ", label: "/job", hint: "Save a job: Company — Role" },
  { cmd: "/plan ", label: "/plan", hint: "Plan a learning roadmap" },
  { cmd: "/news", label: "/news", hint: "Open tech news" },
  { cmd: "/focus", label: "/focus", hint: "Restart the focus timer" },
] as const;

const HELP = "Try /task <title>, /job <Company> — <Role>, /plan <goal>, /news or /focus.";

export const parseCommand = (raw: string): Command => {
  const text = raw.trim();
  const m = /^\/(\w+)\s*([\s\S]*)$/.exec(text);
  if (!m) return { kind: "ask", message: text };
  const name = m[1].toLowerCase();
  const arg = m[2].trim();

  switch (name) {
    case "task":
      return arg
        ? { kind: "task", title: arg }
        : { kind: "invalid", message: "Add a title after /task, e.g. /task Read the attention paper" };
    case "job": {
      // "Company — Role", "Company - Role", "Company | Role" or "Role at Company"
      const parts = arg
        .split(/\s+[—–\-|]\s+|\s*[—–|]\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length >= 2) return { kind: "job", company: parts[0], role: parts.slice(1).join(" — ") };
      const at = /^(.+?)\s+at\s+(.+)$/i.exec(arg);
      if (at) return { kind: "job", company: at[2].trim(), role: at[1].trim() };
      return { kind: "invalid", message: "Use /job Company — Role, e.g. /job Vercel — Frontend Engineer" };
    }
    case "plan":
      return arg
        ? { kind: "plan", goal: arg }
        : { kind: "invalid", message: "Tell Mandy the goal, e.g. /plan Become an ML engineer by June" };
    case "news":
      return { kind: "news", q: arg };
    case "focus":
      return { kind: "focus" };
    default:
      return { kind: "invalid", message: `Unknown command /${name}. ${HELP}` };
  }
};
