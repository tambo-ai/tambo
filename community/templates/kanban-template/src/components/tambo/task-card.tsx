"use client";

import { cn } from "@/lib/utils";
import type { Priority, Status } from "@/types/task";
import * as React from "react";
import { z } from "zod";

export const taskCardPropsSchema = z.object({
  id: z.string().describe("Unique identifier for the task"),
  title: z.string().describe("The title of the task"),
  description: z.string().optional().describe("Optional task description"),
  priority: z.enum(["low", "medium", "high"]).describe("Task priority level"),
  status: z.enum(["todo", "in-progress", "done"]).describe("Current task status"),
  dueDate: z.string().optional().describe("Optional due date"),
});

export type TaskCardProps = z.infer<typeof taskCardPropsSchema> &
  React.HTMLAttributes<HTMLDivElement>;

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: {
    label: "low",
    className: "bg-emerald-500/10 text-emerald-600",
  },
  medium: {
    label: "med",
    className: "bg-amber-500/10 text-amber-600",
  },
  high: {
    label: "high",
    className: "bg-rose-500/10 text-rose-600",
  },
};

const statusConfig: Record<Status, { label: string; className: string }> = {
  todo: {
    label: "todo",
    className: "bg-zinc-500/10 text-zinc-600",
  },
  "in-progress": {
    label: "in progress",
    className: "bg-amber-500/10 text-amber-600",
  },
  done: {
    label: "done",
    className: "bg-emerald-500/10 text-emerald-600",
  },
};

const defaultPriorityStyle = { label: "med", className: "bg-zinc-500/10 text-zinc-600" };
const defaultStatusStyle = { label: "todo", className: "bg-zinc-500/10 text-zinc-600" };

export const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>(
  ({ id, title, description, priority, status, dueDate, className, ...props }, ref) => {
    const priorityStyle = priorityConfig[priority] ?? defaultPriorityStyle;
    const statusStyle = statusConfig[status] ?? defaultStatusStyle;

    return (
      <div
        ref={ref}
        className={cn(
          "bg-card rounded-lg border border-border",
          "p-4 transition-all duration-150",
          "hover:border-foreground/20",
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-medium text-foreground leading-tight">
            {title}
          </h3>
          <span
            className={cn(
              "px-2 py-0.5 text-[10px] font-medium rounded uppercase tracking-wide shrink-0",
              priorityStyle.className
            )}
          >
            {priorityStyle.label}
          </span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            {description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <span
            className={cn(
              "px-2 py-0.5 text-[10px] font-medium rounded uppercase tracking-wide",
              statusStyle.className
            )}
          >
            {statusStyle.label}
          </span>

          <div className="flex items-center gap-3">
            {dueDate && (
              <span className="text-[10px] text-muted-foreground">
                {dueDate}
              </span>
            )}
            {id && (
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                #{id.slice(0, 6)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

TaskCard.displayName = "TaskCard";
