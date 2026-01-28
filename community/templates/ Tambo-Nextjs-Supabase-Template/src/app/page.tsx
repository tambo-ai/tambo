"use client";

import { useEffect, useState } from "react";
import { BiRefresh, BiMenu, BiX } from "react-icons/bi";
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

type View = "dashboard" | "records";

export default function Dashboard() {
  const [records, setRecords] = useState<AnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
    <div className="app-layout">
      {/* Mobile Navigation Bar */}
      <div className="mobile-nav-bar">
        <button
          className="mobile-menu-btn"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          {isSidebarOpen ? <BiX size={24} /> : <BiMenu size={24} />}
        </button>
        <div className="mobile-nav-title">Analytics</div>
        <div className="mobile-nav-spacer" />
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Left Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">📊</span>
            <span className="logo-text">Analytics</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeView === "dashboard" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveView("dashboard");
              setIsSidebarOpen(false);
            }}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeView === "records" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveView("records");
              setIsSidebarOpen(false);
            }}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Records</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <p className="status-text">● Online</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {activeView === "dashboard" ? (
          // Dashboard View - with Chat
          <div className="dashboard-view">
          
            <div className="dashboard-content">
              <div className="chat-panel">
                <div className="chat-panel-header">
                  <h2>AI Assistant</h2>
                </div>
                <div className="chat-panel-body">
                  <Chat />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Records View - table only, NO chat
          <div className="records-view">
            <div className="records-header">
              <h1>Records</h1>
              <button onClick={fetchRecords} className="btn-refresh">
                <BiRefresh size={18} />
                Refresh
              </button>
            </div>

            <div className="table-container">
              {loading && records.length === 0 ? (
                <div className="state-message">Loading records...</div>
              ) : records.length === 0 ? (
                <div className="state-message">
                  No records found. Use the Dashboard to add records with AI.
                </div>
              ) : (
                <div className="table-wrapper">
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
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
