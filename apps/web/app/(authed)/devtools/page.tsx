"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ClientCard } from "./components/client-card";
import { ConnectionStatus } from "./components/connection-status";
import { MessageDetailView } from "./components/message-detail-view";
import { ThreadListPanel } from "./components/thread-list-panel";
import { useDevtoolsConnection } from "./hooks/use-devtools-connection";

const CODE_SNIPPET = `import { TamboProvider } from "@tambo-ai/react";
import { TamboDevTools } from "@tambo-ai/react/devtools";

function App() {
  return (
    <TamboProvider apiKey={key}>
      <MyApp />
      <TamboDevTools />
    </TamboProvider>
  );
}`;

export default function DevtoolsPage() {
  const {
    isConnected,
    clients,
    error,
    snapshots,
    selectedSessionId,
    setSelectedSessionId,
  } = useDevtoolsConnection();

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const currentSnapshot = selectedSessionId
    ? snapshots.get(selectedSessionId)
    : undefined;

  const threads = currentSnapshot?.threads ?? [];
  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">DevTools</h1>
        <p className="text-sm text-muted-foreground">
          Real-time debugging for your Tambo application
        </p>
      </div>

      <ConnectionStatus isConnected={isConnected} error={error} />

      {isConnected && clients.length > 0 && (
        <div className="flex flex-col gap-4">
          {clients.length > 1 && (
            <Select
              value={selectedSessionId ?? undefined}
              onValueChange={setSelectedSessionId}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select SDK client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.sessionId} value={client.sessionId}>
                    {client.projectId ??
                      `Session ${client.sessionId.slice(0, 8)}`}{" "}
                    (v{client.sdkVersion})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <ClientCard key={client.sessionId} client={client} />
            ))}
          </div>

          {currentSnapshot && (
            <div className="grid h-[600px] grid-cols-1 gap-4 rounded-lg border lg:grid-cols-[320px_1fr]">
              <div className="border-r">
                <ThreadListPanel
                  threads={threads}
                  selectedThreadId={selectedThreadId}
                  onSelectThread={setSelectedThreadId}
                />
              </div>
              <div>
                <MessageDetailView
                  messages={selectedThread?.messages ?? []}
                  threadName={selectedThread?.name}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {isConnected && clients.length === 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-medium">No SDK instances connected</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add{" "}
            <code className="font-mono text-xs">&lt;TamboDevTools /&gt;</code>{" "}
            to your app:
          </p>
          <pre className="mt-3 rounded-md bg-muted p-4 font-mono text-sm">
            {CODE_SNIPPET}
          </pre>
        </div>
      )}

      {!isConnected && !error && (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            The DevTools server may not be running. Start it with{" "}
            <code className="font-mono text-xs">npm run dev:cloud</code>
          </p>
        </div>
      )}
    </div>
  );
}
