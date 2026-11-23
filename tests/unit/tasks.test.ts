import { describe, expect, it } from "vitest";
import type { Task } from "@/features/tasks/types";
import { bucketOf, compareTasks, groupTasks, isOverdue, matchesView } from "@/features/tasks/utils";

const TODAY = "2026-11-20";
let n = 0;
const task = (over: Partial<Task>): Task => ({
  id: `t${++n}`,
  title: `Task ${n}`,
  description: null,
  due_date: TODAY,
  priority: "medium",
  status: "todo",
  completed_at: null,
  roadmap_id: null,
  milestone_id: null,
  roadmap_title: null,
  milestone_title: null,
  created_at: `2026-11-0${n % 9}T00:00:00Z`,
  updated_at: "2026-11-01T00:00:00Z",
  ...over,
});

describe("task buckets", () => {
  it("sorts each task into the right bucket", () => {
    expect(bucketOf(task({ due_date: "2026-11-19" }), TODAY)).toBe("overdue");
    expect(bucketOf(task({}), TODAY)).toBe("today");
    expect(bucketOf(task({ due_date: "2026-11-25" }), TODAY)).toBe("upcoming");
    expect(bucketOf(task({ due_date: null }), TODAY)).toBe("upcoming");
    expect(bucketOf(task({ status: "done", due_date: "2026-11-01" }), TODAY)).toBe("completed");
  });

  it("never flags a done task as overdue", () => {
    expect(isOverdue(task({ due_date: "2026-11-01" }), TODAY)).toBe(true);
    expect(isOverdue(task({ due_date: "2026-11-01", status: "done" }), TODAY)).toBe(false);
  });
});

describe("compareTasks", () => {
  it("orders by due date, then priority, open before done", () => {
    const later = task({ due_date: "2026-11-22" });
    const high = task({ priority: "high" });
    const low = task({ priority: "low" });
    const done = task({ status: "done", completed_at: "2026-11-20T08:00:00Z" });
    const sorted = [done, later, low, high].sort(compareTasks).map((t) => t.id);
    expect(sorted).toEqual([high.id, low.id, later.id, done.id]);
  });
});

describe("views", () => {
  it("only shows today's open tasks in the Today view", () => {
    const tasks = [task({}), task({ due_date: "2026-11-19" }), task({ status: "done" })];
    const visible = tasks.filter((t) => matchesView(t, "today", TODAY));
    expect(groupTasks(visible, "today", TODAY).flatMap((g) => g.tasks)).toEqual([tasks[0]]);
  });

  it("'all' hides completed tasks and groups by bucket", () => {
    const tasks = [task({ due_date: "2026-11-19" }), task({}), task({ due_date: null }), task({ status: "done" })];
    const visible = tasks.filter((t) => matchesView(t, "all", TODAY));
    expect(groupTasks(visible, "all", TODAY).map((g) => g.label)).toEqual(["Overdue", "Today", "No due date"]);
  });
});
