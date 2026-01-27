"use client";

import { useEffect, useState } from "react";
import { Chat } from "../components/Chat";
import { supabase } from "../lib/supabase";
import "./dashboard.css";

interface AnalyticsRecord {
  id: string;
  created_at: string;
  label: string;
  value: number;
  category: string;
}

export default function Dashboard() {
  const [records, setRecords] = useState<AnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("analytics")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRecords(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "analytics",
        },
        () => {
          fetchRecords();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="container">
      <header className="dashboard-header">
        <h1>AI Analytics Dashboard</h1>
        <p>
          Manage your analytics data with natural language powered by Tambo AI.
        </p>
      </header>

      <div className="dashboard-grid">
        <section className="card main-content">
          <div className="section-header">
            <h2>Records</h2>
            <button onClick={fetchRecords} className="btn-refresh">
              Refresh
            </button>
          </div>

          <div className="table-wrapper">
            {loading && records.length === 0 ? (
              <div className="state-message">Loading records...</div>
            ) : records.length === 0 ? (
              <div className="state-message">
                No records found. Ask the AI to add one!
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Value</th>
                    <th>Category</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.label}</td>
                      <td className="font-mono">{record.value}</td>
                      <td>
                        <span className="badge">{record.category}</span>
                      </td>
                      <td className="text-muted">
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <aside className="chat-column">
          <div className="card chat-card">
            <div className="chat-header">
              <h2>AI Assistant</h2>
            </div>
            <div className="chat-wrapper">
              <Chat />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
