import { CheckCircle2, Circle } from "lucide-react";
import { taskLabels } from "@/constants/task";
import type { Task } from "@/types/task";
import { cn } from "@/utils/cn";

export const TaskRow = ({ task }: { task: Task }) => (
  <li className="flex items-center gap-3 px-4 py-3">
    {task.done ? (
      <CheckCircle2 className="size-5 text-success" aria-label={taskLabels.done} />
    ) : (
      <Circle className="size-5 text-icon" aria-label={taskLabels.open} />
    )}
    <span className={cn("text-sm text-foreground", task.done && "text-muted-foreground line-through")}>
      {task.title}
    </span>
  </li>
);
