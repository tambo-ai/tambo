import React from "react";
import { cn } from "@/utils";

export default function StatusCard({ title, status, message }: any) {
  const colors: any = {
    active: "bg-green-500/10 text-green-700 border-green-200",
    pending: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
    error: "bg-red-500/10 text-red-700 border-red-200",
  };
  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded border uppercase",
            colors[status],
          )}
        >
          {status}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
    </div>
  );
}
