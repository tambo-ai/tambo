import Link from "next/link";

import incidentsRaw from "@/data/incidents.json";
import runbooksRaw from "@/data/runbooks.json";
import servicesRaw from "@/data/services.json";

type AnyObj = Record<string, any>;

function toArray(x: any): AnyObj[] {
  return Array.isArray(x) ? x : [];
}

function asNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getStatus(svc: AnyObj): string {
  return (
    svc.status ?? svc.health ?? svc.state ?? svc.metrics?.status ?? "unknown"
  );
}

function getP95(svc: AnyObj): number | null {
  return (
    asNumber(svc.latencyP95) ??
    asNumber(svc.metrics?.latencyP95) ??
    asNumber(svc.metrics?.p95) ??
    null
  );
}

function getErrRate(svc: AnyObj): number | null {
  return (
    asNumber(svc.errorRate) ??
    asNumber(svc.metrics?.errorRate) ??
    asNumber(svc.metrics?.errors) ??
    null
  );
}

function getRps(svc: AnyObj): number | null {
  return asNumber(svc.rps) ?? asNumber(svc.metrics?.rps) ?? null;
}

function statusBucket(
  status: string,
): "healthy" | "degraded" | "down" | "unknown" {
  const s = String(status).toLowerCase();
  if (["healthy", "ok", "up", "green"].includes(s)) return "healthy";
  if (["degraded", "warn", "warning", "yellow"].includes(s)) return "degraded";
  if (["down", "critical", "red", "outage"].includes(s)) return "down";
  return "unknown";
}

export default function DashboardPage() {
  const services = toArray(servicesRaw);
  const incidents = toArray(incidentsRaw);
  const runbooks = toArray(runbooksRaw);

  const buckets = services.reduce(
    (acc, svc) => {
      const b = statusBucket(getStatus(svc));
      acc[b] += 1;
      return acc;
    },
    { healthy: 0, degraded: 0, down: 0, unknown: 0 },
  );

  const p95Values = services
    .map(getP95)
    .filter((n): n is number => typeof n === "number");

  const errValues = services
    .map(getErrRate)
    .filter((n): n is number => typeof n === "number");

  const rpsValues = services
    .map(getRps)
    .filter((n): n is number => typeof n === "number");

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const topRisk = [...services]
    .sort((a, b) => {
      // risk heuristic: down > degraded > unknown > healthy, then higher errorRate then higher p95
      const rank = (x: AnyObj) => {
        const s = statusBucket(getStatus(x));
        const base =
          s === "down" ? 3 : s === "degraded" ? 2 : s === "unknown" ? 1 : 0;
        const er = getErrRate(x) ?? 0;
        const p = getP95(x) ?? 0;
        return base * 100000 + er * 1000 + p;
      };
      return rank(b) - rank(a);
    })
    .slice(0, 5);

  const openIncidents = incidents.filter((i) => {
    const st = String(i.status ?? "").toLowerCase();
    return !["resolved", "closed", "done"].includes(st);
  });

  return (
    <main style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>
            AI Microservice Health Monitor
          </h1>
          <p style={{ marginTop: 6, color: "#666" }}>
            Dashboard overview of service health, incidents, and runbooks (mock
            data).
          </p>
        </div>

        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/services">Services</Link>
          <Link href="/incidents">Incidents</Link>
          <Link href="/runbooks">Runbooks</Link>
          <Link href="/chat">AI Chat</Link>
        </nav>
      </header>

      {/* KPI cards */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        <KpiCard label="Services" value={services.length} />
        <KpiCard label="Healthy" value={buckets.healthy} />
        <KpiCard
          label="Degraded/Down"
          value={buckets.degraded + buckets.down}
        />
        <KpiCard label="Open Incidents" value={openIncidents.length} />
        <KpiCard
          label="Avg p95 latency (ms)"
          value={Math.round(avg(p95Values))}
        />
        <KpiCard label="Avg error rate" value={avg(errValues).toFixed(2)} />
        <KpiCard
          label="Avg throughput (RPS)"
          value={Math.round(avg(rpsValues))}
        />
        <KpiCard label="Runbooks" value={runbooks.length} />
      </section>

      {/* Top risk services */}
      <section style={{ marginTop: 22 }}>
        <h2 style={{ marginBottom: 10 }}>Top Risk Services</h2>
        <SimpleTable
          columns={["Service", "Status", "p95(ms)", "Error Rate", "RPS"]}
          rows={topRisk.map((svc) => [
            svc.name ?? svc.serviceName ?? svc.id ?? "unknown",
            String(getStatus(svc)),
            String(getP95(svc) ?? "-"),
            String(getErrRate(svc) ?? "-"),
            String(getRps(svc) ?? "-"),
          ])}
        />
      </section>

      {/* Latest incidents */}
      <section style={{ marginTop: 22 }}>
        <h2 style={{ marginBottom: 10 }}>Incidents</h2>
        <SimpleTable
          columns={["Title", "Severity", "Status", "Start"]}
          rows={incidents
            .slice(0, 8)
            .map((inc) => [
              inc.title ?? inc.name ?? inc.id ?? "incident",
              inc.severity ?? inc.priority ?? "-",
              inc.status ?? "-",
              inc.startTime ?? inc.startedAt ?? inc.createdAt ?? "-",
            ])}
        />
        <div style={{ marginTop: 8 }}>
          <Link href="/incidents">View all incidents →</Link>
        </div>
      </section>

      <section
        style={{
          marginTop: 22,
          padding: 14,
          border: "1px solid #eee",
          borderRadius: 12,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Try these AI prompts</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>“Which service looks most unhealthy right now and why?”</li>
          <li>“Summarize open incidents in 5 bullet points.”</li>
          <li>“Generate an RCA outline for the latest incident.”</li>
          <li>“What should I check first if error rate spikes?”</li>
        </ul>
        <div style={{ marginTop: 10 }}>
          <Link href="/chat">Go to AI Chat →</Link>
        </div>
      </section>
    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
      <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function SimpleTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <div
      style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                style={{
                  textAlign: "left",
                  fontSize: 13,
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
          {rows.map((r, idx) => (
            <tr key={idx}>
              {r.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #f0f0f0",
                    fontSize: 14,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
