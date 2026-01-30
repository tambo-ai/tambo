import { useState } from "react";

export default function TaskBreaker() {
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const breakTask = () => {
    if (!goal.trim()) return;

    setLoading(true);
    setResult("");

    setTimeout(() => {
      setResult(
        `1. Understand the goal clearly
2. Break it into smaller tasks
3. Prioritize the tasks
4. Work on one task at a time`
      );
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>AI Task Breakdown</h2>

      <textarea
        rows="4"
        placeholder="Enter a goal you feel overwhelmed by..."
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        style={{ width: "100%", padding: 10 }}
      />

      <button
        onClick={breakTask}
        disabled={loading}
        style={{ marginTop: 10, padding: "10px 16px" }}
      >
        {loading ? "Breaking..." : "Break into tasks"}
      </button>

      {result && (
        <pre style={{ marginTop: 20, background: "#f5f5f5", padding: 12 }}>
          {result}
        </pre>
      )}
    </div>
  );
}
