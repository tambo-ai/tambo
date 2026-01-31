"use client";

import { cn } from "@/lib/utils";
import { useTaskStore } from "@/lib/task-store";
import type { Status, Task } from "@/types/task";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import * as React from "react";

interface Column {
  id: Status;
  title: string;
  icon: React.ReactNode;
  className: string;
}

const columns: Column[] = [
  {
    id: "todo",
    title: "To Do",
    icon: <Circle className="w-4 h-4" />,
    className: "border-t-gray-400",
  },
  {
    id: "in-progress",
    title: "In Progress",
    icon: <Clock className="w-4 h-4" />,
    className: "border-t-blue-500",
  },
  {
    id: "done",
    title: "Done",
    icon: <CheckCircle2 className="w-4 h-4" />,
    className: "border-t-green-500",
  },
];

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

interface TaskItemProps {
  task: Task;
}

const TaskItem = ({ task }: TaskItemProps) => (
  <div
    className={cn(
      "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
      "p-3 shadow-sm hover:shadow-md transition-shadow duration-200",
    )}
  >
    <div className="flex items-start justify-between gap-2 mb-1">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight">
        {task.title}
      </h4>
      <span
        className={cn(
          "px-1.5 py-0.5 text-xs font-medium rounded shrink-0",
          priorityColors[task.priority],
        )}
      >
        {task.priority}
      </span>
    </div>
    {task.description && (
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
        {task.description}
      </p>
    )}
    {task.dueDate && (
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        Due: {task.dueDate}
      </p>
    )}
  </div>
);

interface ColumnViewProps {
  column: Column;
  tasks: Task[];
}

const ColumnView = ({ column, tasks }: ColumnViewProps) => (
  <div
    className={cn(
      "flex-1 min-w-[280px] bg-gray-50 dark:bg-gray-900 rounded-lg",
      "border-t-4",
      column.className,
    )}
  >
    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          {column.icon}
          <h3 className="font-semibold">{column.title}</h3>
        </div>
        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
    </div>

    <div className="p-3 space-y-3 min-h-[200px]">
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
          No tasks
        </p>
      ) : (
        tasks.map((task) => <TaskItem key={task.id} task={task} />)
      )}
    </div>
  </div>
);

export type KanbanBoardProps = React.HTMLAttributes<HTMLDivElement>;

export const KanbanBoard = React.forwardRef<HTMLDivElement, KanbanBoardProps>(
  ({ className, ...props }, ref) => {
    const tasks = useTaskStore((state) => state.tasks);

    const tasksByStatus = React.useMemo(() => {
      const grouped: Record<Status, Task[]> = {
        todo: [],
        "in-progress": [],
        done: [],
      };

      for (const task of tasks) {
        grouped[task.status].push(task);
      }

      return grouped;
    }, [tasks]);

    return (
      <div
        ref={ref}
        className={cn("flex gap-4 overflow-x-auto p-4", className)}
        {...props}
      >
        {columns.map((column) => (
          <ColumnView
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id]}
          />
        ))}
      </div>
    );
  },
);

KanbanBoard.displayName = "KanbanBoard";
