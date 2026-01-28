import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface TaskListProps {
  filter?: "all" | "completed" | "pending";
  title?: string;
}

export function TaskList({
  filter = "all",
  title = "My Tasks",
}: TaskListProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState(""); // State for new task input

  // 1. Fetch Tasks
  const fetchTasks = async () => {
    setLoading(true);
    let query = supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter === "completed") query = query.eq("is_complete", true);
    if (filter === "pending") query = query.eq("is_complete", false);

    const { data } = await query;
    setTasks(data || []);
    setLoading(false);
  };

  // 2. Add Task (Create) - Maintainer Requirement
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    // UI Optimistic Update (Turant dikhane ke liye)
    const tempId = Date.now();
    const tempTask = { id: tempId, text: newTask, is_complete: false };
    setTasks([tempTask, ...tasks]);
    setNewTask("");

    // Database Insert
    const { data, error } = await supabase
      .from("todos")
      .insert([{ text: tempTask.text }])
      .select();

    if (data) {
      // Replace temp task with real one
      setTasks((current) =>
        current.map((t) => (t.id === tempId ? data[0] : t)),
      );
    } else if (error) {
      console.error(error);
      fetchTasks(); // Revert on error
    }
  };

  // 3. Delete Task (Delete) - Maintainer Requirement
  const deleteTask = async (id: number) => {
    // UI Remove
    setTasks(tasks.filter((t) => t.id !== id));
    // Database Remove
    await supabase.from("todos").delete().eq("id", id);
  };

  // 4. Toggle Task (Update)
  const toggleTask = async (id: number, currentStatus: boolean) => {
    setTasks((currentTasks) =>
      currentTasks.map((t) =>
        t.id === id ? { ...t, is_complete: !currentStatus } : t,
      ),
    );
    await supabase
      .from("todos")
      .update({ is_complete: !currentStatus })
      .eq("id", id);
  };

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  return (
    <div className="task-list-container">
      <div
        className="task-list-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 className="task-list-title">
          {title.toUpperCase()} (
          {filter === "pending"
            ? "PENDING"
            : filter === "completed"
              ? "COMPLETED"
              : "ALL"}
          )
        </h3>
      </div>

      {/* Input Form for New Task (Added this) */}
      <form
        onSubmit={addTask}
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          paddingBottom: "16px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #e5e5e5",
            outline: "none",
            fontSize: "14px",
          }}
        />
        <button
          type="submit"
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          Add
        </button>
      </form>

      {loading && (
        <div className="task-loading">
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <div className="empty-tasks">
          <p>No tasks found.</p>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="tasks-list">
          {tasks.map((t) => (
            <div
              key={t.id}
              className={`task-item ${t.is_complete ? "completed" : ""}`}
              style={{ position: "relative" }}
            >
              <label className="task-checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={t.is_complete}
                  onChange={() => toggleTask(t.id, t.is_complete)}
                  className="task-checkbox"
                />
                <span className="checkbox-custom"></span>
              </label>
              <span className="task-text">{t.text}</span>

              {/* Delete Button (Added this) */}
              <button
                onClick={() => deleteTask(t.id)}
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Delete task"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
