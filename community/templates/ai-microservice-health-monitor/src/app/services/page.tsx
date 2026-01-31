import servicesRaw from "@/data/services.json";
import Link from "next/link";

type AnyObj = Record<string, any>;

function toArray(x: any): AnyObj[] {
  return Array.isArray(x) ? x : [];
}

export default function ServicesPage() {
  const services = toArray(servicesRaw);

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
        <h1 style={{ margin: 0 }}>Services</h1>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/">Dashboard</Link>
          <Link href="/incidents">Incidents</Link>
          <Link href="/runbooks">Runbooks</Link>
          <Link href="/chat">AI Chat</Link>
        </nav>
      </header>

      <p style={{ color: "#666" }}>
        List of microservices with health and key metrics (from mock JSON).
      </p>

      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[
                "Name",
                "Status",
                "Version",
                "Env",
                "p95",
                "ErrorRate",
                "RPS",
                "Owner",
              ].map((c) => (
                <th
                  key={c}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    background: "#fafafa",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map((svc, idx) => (
              <tr key={svc.id ?? idx}>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <strong>
                    {svc.name ?? svc.serviceName ?? svc.id ?? "unknown"}
                  </strong>
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {svc.status ?? svc.health ?? "-"}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {svc.version ?? "-"}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {svc.env ?? svc.environment ?? "-"}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {svc.latencyP95 ??
                    svc.metrics?.latencyP95 ??
                    svc.metrics?.p95 ??
                    "-"}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {svc.errorRate ?? svc.metrics?.errorRate ?? "-"}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {svc.rps ?? svc.metrics?.rps ?? "-"}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {svc.ownerTeam ?? svc.owner ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section
        style={{
          marginTop: 18,
          padding: 14,
          border: "1px solid #eee",
          borderRadius: 12,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Ask AI</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>“Rank services by risk.”</li>
          <li>“Which services regressed after the last deploy?”</li>
          <li>“Explain why p95 latency is high for service X.”</li>
        </ul>
        <div style={{ marginTop: 10 }}>
          <Link href="/chat">Go to AI Chat →</Link>
        </div>
      </section>
    </main>
  );
}
