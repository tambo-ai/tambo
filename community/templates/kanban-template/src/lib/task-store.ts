import type { Priority, Status, Task } from "@/types/task";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TaskStore {
  tasks: Task[];
  addTask: (
    task: Omit<Task, "id" | "createdAt"> & { id?: string; createdAt?: string },
  ) => Task;
  updateTask: (id: string, updates: Partial<Task>) => Task | null;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: Status) => Task | null;
  getTasksByStatus: (status: Status) => Task[];
  getTaskById: (id: string) => Task | undefined;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (taskData) => {
        const newTask: Task = {
          id: taskData.id ?? crypto.randomUUID(),
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority ?? ("medium" as Priority),
          status: taskData.status ?? ("todo" as Status),
          dueDate: taskData.dueDate,
          createdAt: taskData.createdAt ?? new Date().toISOString(),
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));

        return newTask;
      },

      updateTask: (id, updates) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return null;

        const updatedTask = { ...task, ...updates };

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        }));

        return updatedTask;
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      moveTask: (id, status) => {
        return get().updateTask(id, { status });
      },

      getTasksByStatus: (status) => {
        return get().tasks.filter((t) => t.status === status);
      },

      getTaskById: (id) => {
        return get().tasks.find((t) => t.id === id);
      },
    }),
    {
      name: "kanban-tasks",
    },
  ),
);
