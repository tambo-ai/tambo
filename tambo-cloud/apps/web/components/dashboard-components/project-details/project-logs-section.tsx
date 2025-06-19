"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { LogLevel } from "@tambo-ai-cloud/core";

interface ProjectLogsSectionProps {
  projectId: string;
}

const levelClasses: Record<LogLevel, string> = {
  warning: "text-yellow-500",
  error: "text-red-500",
  alert: "text-red-600",
};

export function ProjectLogsSection({ projectId }: ProjectLogsSectionProps) {
  const { data: logs, isLoading } = api.project.getProjectLogs.useQuery({
    projectId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!logs || logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alerts yet</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`font-semibold uppercase ${
                    levelClasses[log.level] ?? "text-foreground"
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm">{log.message}</p>
              {log.threadId && (
                <p className="text-xs text-muted-foreground">
                  Thread:&nbsp;{log.threadId}
                </p>
              )}
              {log.metadata && (
                <details className="rounded bg-muted/30 p-2 text-xs">
                  <summary className="cursor-pointer select-none">
                    metadata
                  </summary>
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
