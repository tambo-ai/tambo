import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Task = {
  id: number;
  text: string;
  is_complete: boolean;
};

export function TaskList({ filter = "all" }: { filter?: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data from Supabase
  const fetchTasks = async () => {
    setLoading(true);
    let query = supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply Filter
    if (filter === "pending") {
      query = query.eq("is_complete", false);
    } else if (filter === "completed") {
      query = query.eq("is_complete", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  // 2. Toggle Task Status in Supabase
  const toggleTask = async (id: number, currentStatus: boolean) => {
    // Optimistic Update (Update UI instantly)
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, is_complete: !currentStatus } : t,
      ),
    );

    // Update Database
    await supabase
      .from("todos")
      .update({ is_complete: !currentStatus })
      .eq("id", id);
  };

  // Run fetch when component loads
  useEffect(() => {
    fetchTasks();
  }, [filter]);

  if (loading && tasks.length === 0) {
    return (
      <div style={{ padding: "20px", color: "#666" }}>
        Loading tasks from Supabase...
      </div>
    );
  }

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        marginTop: "10px",
        width: "100%",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
          fontWeight: 600,
          color: "#374151",
          fontSize: "0.9rem",
        }}
      >
        SUPABASE TASKS ({filter?.toUpperCase() || "ALL"})
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {tasks.map((task) => (
          <li
            key={task.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: "1px solid #f3f4f6",
              gap: "12px",
            }}
          >
            <input
              type="checkbox"
              checked={task.is_complete}
              onChange={() => toggleTask(task.id, task.is_complete)}
              style={{
                width: "20px",
                height: "20px",
                accentColor: "#2563eb",
                cursor: "pointer",
              }}
            />
            <span
              style={{
                flex: 1,
                color: "#111827",
                textDecoration: task.is_complete ? "line-through" : "none",
                fontSize: "1rem",
                opacity: task.is_complete ? 0.6 : 1,
              }}
            >
              {task.text}
            </span>
          </li>
        ))}
        {tasks.length === 0 && (
          <li style={{ padding: "20px", textAlign: "center", color: "#999" }}>
            No tasks found.
          </li>
        )}
      </ul>
    </div>
  );
}
