"use client";

import { motion } from "motion/react";
import { Loader } from "@/components/atoms/Loader";
import { TaskRow } from "@/components/molecules/TaskRow";
import { Button } from "@/components/ui/button";
import { taskLabels } from "@/constants/task";
import { useTasks } from "@/hooks/useTasks";

export const TaskList = () => {
  const { data: tasks, isPending, isError, error, refetch } = useTasks();

  if (isPending) return <Loader />;

  if (isError) {
    return (
      <div className="flex items-center gap-3 text-sm text-error">
        {error.message || taskLabels.loadFailed}
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {taskLabels.retry}
        </Button>
      </div>
    );
  }

  if (!tasks.length) return <p className="text-sm text-muted-foreground">{taskLabels.empty}</p>;

  return (
    <motion.ul
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface shadow-card"
    >
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </motion.ul>
  );
};
