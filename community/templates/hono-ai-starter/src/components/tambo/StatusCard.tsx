import React from "react";

export default function StatusCard({
  message,
  timestamp,
}: {
  message: string;
  timestamp: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{timestamp}</p>
    </div>
  );
}
