import { useState } from "react";
import { Check } from "lucide-react";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface TaskListProps {
  initialTasks?: Task[];
}

export function TaskList({ initialTasks = [] }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  return (
    <div className="p-6 border border-slate-200/60 rounded-2xl bg-white shadow-sm w-full max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
          Task List
        </h3>
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          {tasks.filter((t) => !t.completed).length} Pending
        </span>
      </div>
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all cursor-pointer group"
            onClick={() => toggleTask(task.id)}
          >
            <div
              className={`
              w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
              ${task.completed ? "bg-slate-900 border-slate-900" : "border-slate-200 group-hover:border-slate-300"}
            `}
            >
              {task.completed && <Check className="h-3 w-3 text-white" />}
            </div>
            <span
              className={`text-sm transition-all ${
                task.completed
                  ? "line-through text-slate-400"
                  : "text-slate-700 font-medium"
              }`}
            >
              {task.text}
            </span>
          </li>
        ))}
        {tasks.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
            <p className="text-xs font-medium text-slate-400">
              No tasks active
            </p>
          </div>
        )}
      </ul>
    </div>
  );
}
