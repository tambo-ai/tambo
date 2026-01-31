"use client";

import { cn } from "@/lib/utils";
import type { Priority, Status } from "@/types/task";
import { Calendar } from "lucide-react";
import * as React from "react";
import { z } from "zod";

export const taskCardPropsSchema = z.object({
  id: z.string().describe("Unique identifier for the task"),
  title: z.string().describe("The title of the task"),
  description: z.string().optional().describe("Optional task description"),
  priority: z
    .enum(["low", "medium", "high"])
    .describe("Task priority level"),
  status: z
    .enum(["todo", "in-progress", "done"])
    .describe("Current task status"),
  dueDate: z.string().optional().describe("Optional due date"),
});

export type TaskCardProps = z.infer<typeof taskCardPropsSchema> &
  React.HTMLAttributes<HTMLDivElement>;

const priorityConfig: Record<
  Priority,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  medium: {
    label: "Medium",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  high: {
    label: "High",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
};

const statusConfig: Record<Status, { label: string; className: string }> = {
  todo: {
    label: "To Do",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  done: {
    label: "Done",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
};

export const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>(
  ({ id, title, description, priority, status, dueDate, className, ...props }, ref) => {
    const priorityStyle = priorityConfig[priority];
    const statusStyle = statusConfig[status];

    return (
      <div
        ref={ref}
        className={cn(
          "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
          "shadow-sm hover:shadow-md transition-shadow duration-200",
          "p-4",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 leading-tight">
            {title}
          </h3>
          <span
            className={cn(
              "px-2 py-0.5 text-xs font-medium rounded-full shrink-0",
              priorityStyle.className,
            )}
          >
            {priorityStyle.label}
          </span>
        </div>

        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-auto">
          <span
            className={cn(
              "px-2 py-0.5 text-xs font-medium rounded-full",
              statusStyle.className,
            )}
          >
            {statusStyle.label}
          </span>

          {dueDate && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{dueDate}</span>
            </div>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
            {id.slice(0, 8)}
          </span>
        </div>
      </div>
    );
  },
);

TaskCard.displayName = "TaskCard";
