"use client";

import { cn } from "@/lib/utils";
import { useTaskStore } from "@/lib/task-store";
import type { Status, Task } from "@/types/task";
import * as React from "react";

interface Column {
  id: Status;
  title: string;
  accentColor: string;
}

const columns: Column[] = [
  { id: "todo", title: "To Do", accentColor: "bg-zinc-400" },
  { id: "in-progress", title: "In Progress", accentColor: "bg-amber-400" },
  { id: "done", title: "Done", accentColor: "bg-emerald-400" },
];

const priorityColors: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-600",
  medium: "bg-amber-500/10 text-amber-600",
  high: "bg-rose-500/10 text-rose-600",
};

interface TaskItemProps {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}

const TaskItem = ({ task, onDragStart }: TaskItemProps) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, task)}
    className={cn(
      "bg-card rounded border border-border",
      "p-3 cursor-grab active:cursor-grabbing",
      "hover:border-foreground/20 transition-all duration-150",
      "select-none"
    )}
  >
    <div className="flex items-start justify-between gap-2 mb-1.5">
      <h4 className="font-medium text-sm leading-tight text-foreground">
        {task.title}
      </h4>
      <span
        className={cn(
          "px-1.5 py-0.5 text-[10px] font-medium rounded shrink-0 uppercase tracking-wide",
          priorityColors[task.priority] ?? priorityColors.medium
        )}
      >
        {task.priority}
      </span>
    </div>
    {task.description && (
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {task.description}
      </p>
    )}
    {task.dueDate && (
      <p className="text-[10px] text-muted-foreground mt-2 font-light">
        {task.dueDate}
      </p>
    )}
  </div>
);

interface ColumnViewProps {
  column: Column;
  tasks: Task[];
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: Status) => void;
  isDragOver: boolean;
}

const ColumnView = ({
  column,
  tasks,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: ColumnViewProps) => (
  <div
    className={cn(
      "flex-1 min-w-[260px] max-w-[320px] flex flex-col",
      "rounded-lg bg-emerald-500/5 border border-emerald-500/10",
      "transition-colors duration-150",
      isDragOver && "bg-emerald-500/10 ring-1 ring-emerald-500/30"
    )}
    onDragOver={onDragOver}
    onDrop={(e) => onDrop(e, column.id)}
  >
    {/* Column Header */}
    <div className="p-3 flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full", column.accentColor)} />
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {column.title}
      </h3>
      <span className="text-xs text-muted-foreground/60 ml-auto">
        {tasks.length}
      </span>
    </div>

    {/* Tasks */}
    <div className="flex-1 p-2 pt-0 space-y-2 overflow-y-auto">
      {tasks.length === 0 ? (
        <div className="h-24 flex items-center justify-center">
          <p className="text-xs text-muted-foreground/50">Drop tasks here</p>
        </div>
      ) : (
        tasks.map((task) => (
          <TaskItem key={task.id} task={task} onDragStart={onDragStart} />
        ))
      )}
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex-1 flex items-center justify-center p-12">
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h3 className="text-lg font-display font-medium text-foreground mb-2">
        No tasks yet
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Start by asking the AI to create a task. Try:
      </p>
      <div className="space-y-2 text-xs text-muted-foreground">
        <p className="bg-muted/50 rounded px-3 py-2">"Create a task to review the PR"</p>
        <p className="bg-muted/50 rounded px-3 py-2">"Add a high priority bug fix task"</p>
        <p className="bg-muted/50 rounded px-3 py-2">"Create task: Update documentation"</p>
      </div>
    </div>
  </div>
);

export type KanbanBoardProps = React.HTMLAttributes<HTMLDivElement>;

export const KanbanBoard = React.forwardRef<HTMLDivElement, KanbanBoardProps>(
  ({ className, ...props }, ref) => {
    const tasks = useTaskStore((state) => state.tasks);
    const moveTask = useTaskStore((state) => state.moveTask);
    const [dragOverColumn, setDragOverColumn] = React.useState<Status | null>(
      null
    );
    const [draggedTask, setDraggedTask] = React.useState<Task | null>(null);

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

    const handleDragStart = (e: React.DragEvent, task: Task) => {
      setDraggedTask(task);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", task.id);

      // Add dragging class after a short delay for visual feedback
      requestAnimationFrame(() => {
        (e.target as HTMLElement).classList.add("dragging");
      });
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };

    const handleDragEnter = (status: Status) => {
      setDragOverColumn(status);
    };

    const handleDragLeave = () => {
      setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, newStatus: Status) => {
      e.preventDefault();
      setDragOverColumn(null);

      const taskId = e.dataTransfer.getData("text/plain");
      if (taskId && draggedTask && draggedTask.status !== newStatus) {
        moveTask(taskId, newStatus);
      }
      setDraggedTask(null);
    };

    if (tasks.length === 0) {
      return (
        <div ref={ref} className={cn("h-full", className)} {...props}>
          <EmptyState />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("flex gap-4 p-6 h-full", className)}
        onDragEnd={() => {
          setDraggedTask(null);
          setDragOverColumn(null);
        }}
        {...props}
      >
        {columns.map((column) => (
          <div
            key={column.id}
            onDragEnter={() => handleDragEnter(column.id)}
            onDragLeave={handleDragLeave}
            className="flex-1 min-w-0"
          >
            <ColumnView
              column={column}
              tasks={tasksByStatus[column.id]}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragOver={dragOverColumn === column.id}
            />
          </div>
        ))}
      </div>
    );
  }
);

KanbanBoard.displayName = "KanbanBoard";
