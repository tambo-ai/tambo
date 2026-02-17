import * as React from "react";

/**
 * Summary statistics displayed in the devtools trigger popover.
 */
export interface SummaryStats {
  /** Number of registered components. */
  componentCount: number;
  /** Number of registered tools. */
  toolCount: number;
  /** Number of active threads. */
  threadCount: number;
  /** Name or ID of the currently active thread, if any. */
  activeThread?: string;
  /** Whether any thread is currently streaming. */
  isStreaming: boolean;
  /** Number of errors encountered. */
  errorCount: number;
}

/**
 * Props for the TamboDevToolsTrigger component.
 */
export interface TamboDevToolsTriggerProps {
  /** Whether the devtools bridge is currently connected. */
  isConnected: boolean;
  /** Summary statistics from the SDK runtime. */
  stats: SummaryStats;
  /** Full URL to the devtools dashboard (including clientId query param). */
  dashboardUrl: string;
  /** Position overrides for the fixed trigger button. Defaults to bottom-right. */
  position?: { bottom?: number; right?: number; top?: number; left?: number };
}

/**
 * Minimal dot trigger with stats popover for Tambo DevTools.
 *
 * Renders a small colored dot in a fixed position. Clicking the dot opens a
 * popover showing connection status, registry stats, and a button to open the
 * devtools dashboard.
 * @param props - Connection state, stats, dashboard URL, and position config
 * @returns A fixed-position dot trigger with stats popover.
 */
export function TamboDevToolsTrigger({
  isConnected,
  stats,
  dashboardUrl,
  position,
}: TamboDevToolsTriggerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const dotColor = isConnected ? "#22c55e" : "#6b7280";
  const statusColor = isConnected ? "#22c55e" : "#ef4444";
  const statusLabel = isConnected ? "Connected" : "Disconnected";

  const positionStyle: React.CSSProperties = {
    bottom: position?.bottom ?? 16,
    right: position?.right ?? 16,
    ...(position?.top !== undefined
      ? { top: position.top, bottom: undefined }
      : {}),
    ...(position?.left !== undefined
      ? { left: position.left, right: undefined }
      : {}),
  };

  const popoverBottom = (position?.bottom ?? 16) + 56;
  const popoverRight = position?.right ?? 16;

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        aria-label="Tambo DevTools"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: "fixed",
          ...positionStyle,
          zIndex: 9999,
          width: 48,
          height: 48,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          overflow: "visible",
        }}
      >
        {/* Dot */}
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: dotColor,
            display: "block",
            position: "relative",
          }}
        >
          {/* Error badge */}
          {stats.errorCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                minWidth: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                lineHeight: "14px",
                textAlign: "center",
                padding: "0 3px",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {stats.errorCount}
            </span>
          )}
        </span>
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: popoverBottom,
            right: popoverRight,
            zIndex: 9999,
            backgroundColor: "#1a1a2e",
            border: "1px solid #2a2a4a",
            borderRadius: 8,
            padding: 16,
            minWidth: 220,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            fontFamily: "system-ui, sans-serif",
            color: "#e2e8f0",
            fontSize: 13,
          }}
        >
          {/* Header */}
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
            Tambo DevTools
          </div>

          {/* Connection status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: statusColor,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#94a3b8" }}>{statusLabel}</span>
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "6px 16px",
              marginBottom: 12,
              fontSize: 12,
            }}
          >
            <span style={{ color: "#94a3b8" }}>Components</span>
            <span>{stats.componentCount}</span>
            <span style={{ color: "#94a3b8" }}>Tools</span>
            <span>{stats.toolCount}</span>
            <span style={{ color: "#94a3b8" }}>Threads</span>
            <span>{stats.threadCount}</span>
          </div>

          {/* Active thread */}
          {stats.activeThread && (
            <div style={{ fontSize: 12, marginBottom: 8, color: "#94a3b8" }}>
              Active:{" "}
              <span style={{ color: "#e2e8f0" }}>{stats.activeThread}</span>
            </div>
          )}

          {/* Streaming status */}
          <div style={{ fontSize: 12, marginBottom: 16, color: "#94a3b8" }}>
            Streaming:{" "}
            <span style={{ color: "#e2e8f0" }}>
              {stats.isStreaming ? "Yes" : "No"}
            </span>
          </div>

          {/* Open DevTools button */}
          <button
            type="button"
            onClick={() => {
              window.open(dashboardUrl, "_blank");
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              backgroundColor: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 13,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Open DevTools
          </button>
        </div>
      )}
    </>
  );
}

export default TamboDevToolsTrigger;
