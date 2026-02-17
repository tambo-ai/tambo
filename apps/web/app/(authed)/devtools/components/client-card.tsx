"use client";

import type { DevtoolsClient } from "../hooks/use-devtools-connection";

interface ClientCardProps {
  client: DevtoolsClient;
  projectName?: string;
}

export function ClientCard({ client, projectName }: ClientCardProps) {
  const connectedTime = new Date(client.connectedAt).toLocaleTimeString();

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">SDK Client</span>
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Connected
          </span>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Session</span>
            <span className="font-mono text-xs">
              {client.sessionId.slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">SDK Version</span>
            <span>v{client.sdkVersion}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Project</span>
            {client.projectId ? (
              <span className="text-xs" title={client.projectId}>
                {projectName ?? client.projectId.slice(0, 8)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">None</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Connected</span>
            <span className="text-xs">{connectedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
