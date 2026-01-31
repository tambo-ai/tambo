import React from "react";

export default function LogViewer({ logs }: { logs: any }) {
  const logsArray = Array.isArray(logs) ? logs : logs?.logs || [];

  if (logsArray.length === 0) {
    return (
      <div className="p-4 text-xs text-muted-foreground">No logs found.</div>
    );
  }

  return (
    <div className="w-full max-w-md border border-border rounded-lg bg-card overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          System Logs
        </span>
      </div>
      <div className="divide-y divide-border">
        {logsArray.map((log: any, index: number) => (
          // Use a composite key to satisfy React's reconciliation
          <div
            key={`${log.id}-${index}`}
            className="px-4 py-3 flex justify-between items-center hover:bg-muted/30 transition-colors"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">{log.event}</p>
              <p className="text-[10px] text-muted-foreground">{log.time}</p>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded border ${
                log.type === "warning"
                  ? "bg-yellow-500/10 border-yellow-200 text-yellow-700"
                  : "bg-blue-500/10 border-blue-200 text-blue-700"
              }`}
            >
              {log.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
