import runbooksRaw from "@/data/runbooks.json";
import Link from "next/link";

type AnyObj = Record<string, any>;

function toArray(x: any): AnyObj[] {
  return Array.isArray(x) ? x : [];
}

export default function RunbooksPage() {
  const runbooks = toArray(runbooksRaw);

  return (
    <main style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>Runbooks</h1>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/">Dashboard</Link>
          <Link href="/services">Services</Link>
          <Link href="/incidents">Incidents</Link>
          <Link href="/chat">AI Chat</Link>
        </nav>
      </header>

      <p style={{ color: "#666" }}>
        Runbook library (mock JSON). AI can generate new runbooks or triage
        checklists.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {runbooks.map((rb, idx) => (
          <div
            key={rb.id ?? idx}
            style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}
          >
            <h3 style={{ margin: 0 }}>
              {rb.title ?? rb.name ?? `Runbook ${idx + 1}`}
            </h3>

            {Array.isArray(rb.tags) && rb.tags.length > 0 && (
              <div style={{ marginTop: 8, color: "#666" }}>
                <b>Tags:</b> {rb.tags.join(", ")}
              </div>
            )}

            {rb.contentMarkdown && (
              <pre
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 10,
                  background: "#fafafa",
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {rb.contentMarkdown}
              </pre>
            )}
          </div>
        ))}
      </div>

      <section
        style={{
          marginTop: 18,
          padding: 14,
          border: "1px solid #eee",
          borderRadius: 12,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Ask AI prompts</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>“Generate a runbook for Kafka consumer lag.”</li>
          <li>
            “Create a triage checklist for DB connection pool exhaustion.”
          </li>
          <li>“Summarize the best runbook steps for incident X.”</li>
        </ul>
        <div style={{ marginTop: 10 }}>
          <Link href="/chat">Go to AI Chat →</Link>
        </div>
      </section>
    </main>
  );
}
