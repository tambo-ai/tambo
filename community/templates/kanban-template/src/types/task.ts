export type Priority = "low" | "medium" | "high";
export type Status = "todo" | "in-progress" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  dueDate?: string;
  createdAt: string;
}
