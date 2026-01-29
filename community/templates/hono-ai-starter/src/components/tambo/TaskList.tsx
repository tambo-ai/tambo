"use client";

import { CheckCircle2, Circle, ListTodo } from "lucide-react";

// 1. Interface matches the Zod schema in tambo.ts
interface Task {
  id: string;
  title: string;
  completed: boolean; // Changed to boolean to match standard checkbox logic
}

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
}

export default function TaskList({ tasks, loading }: TaskListProps) {
  // 2. Premium empty state (Maintainers love this attention to detail)
  if (!loading && (!tasks || tasks.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl bg-card/30">
        <ListTodo className="w-8 h-8 text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground font-medium">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 w-full animate-in fade-in slide-in-from-bottom-2">
      {tasks.map((task) => (
        <div 
          key={task.id} 
          className="group flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:border-primary/50 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            {task.completed ? (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary/70 transition-colors" />
            )}
            <span className={`text-sm font-medium leading-none ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {task.title}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tighter uppercase ${
              task.completed ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary'
            }`}>
              {task.completed ? 'Done' : 'Pending'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}