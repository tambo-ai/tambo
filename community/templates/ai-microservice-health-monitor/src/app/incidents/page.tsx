import incidentsRaw from "@/data/incidents.json";
import Link from "next/link";

type AnyObj = Record<string, any>;

function toArray(x: any): AnyObj[] {
  return Array.isArray(x) ? x : [];
}

export default function IncidentsPage() {
  const incidents = toArray(incidentsRaw);

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
        <h1 style={{ margin: 0 }}>Incidents</h1>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/">Dashboard</Link>
          <Link href="/services">Services</Link>
          <Link href="/runbooks">Runbooks</Link>
          <Link href="/chat">AI Chat</Link>
        </nav>
      </header>

      <p style={{ color: "#666" }}>
        Incident feed (mock JSON). Use AI to generate RCA and follow-ups.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {incidents.map((inc, idx) => (
          <div
            key={inc.id ?? idx}
            style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  {inc.title ?? inc.name ?? `Incident ${idx + 1}`}
                </h3>
                <div style={{ color: "#666", marginTop: 6 }}>
                  Severity: <b>{inc.severity ?? inc.priority ?? "-"}</b> •
                  Status: <b>{inc.status ?? "-"}</b>
                </div>
                <div style={{ color: "#666", marginTop: 6 }}>
                  Start: {inc.startTime ?? inc.startedAt ?? "-"}{" "}
                  {inc.endTime || inc.endedAt
                    ? ` • End: ${inc.endTime ?? inc.endedAt}`
                    : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                <Link href="/chat">Ask AI</Link>
              </div>
            </div>

            {Array.isArray(inc.impactedServices) &&
              inc.impactedServices.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <b>Impacted:</b> {inc.impactedServices.join(", ")}
                </div>
              )}

            {Array.isArray(inc.symptoms) && inc.symptoms.length > 0 && (
              <div style={{ marginTop: 8, color: "#444" }}>
                <b>Symptoms:</b> {inc.symptoms.join(" • ")}
              </div>
            )}

            {inc.resolution && (
              <div style={{ marginTop: 8, color: "#444" }}>
                <b>Resolution:</b> {inc.resolution}
              </div>
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
          <li>“Generate an RCA outline for the latest incident.”</li>
          <li>“Create 5 follow-up action items with owners and due dates.”</li>
          <li>“Draft a customer-facing status update.”</li>
        </ul>
        <div style={{ marginTop: 10 }}>
          <Link href="/chat">Go to AI Chat →</Link>
        </div>
      </section>
    </main>
  );
}
