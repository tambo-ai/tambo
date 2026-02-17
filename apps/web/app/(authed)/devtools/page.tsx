"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ClientCard } from "./components/client-card";
import { ComponentStreamPanel } from "./components/component-stream-panel";
import { ConnectionStatus } from "./components/connection-status";
import { ErrorBanner } from "./components/error-banner";
import { FilterBar } from "./components/filter-bar";
import { MessageDetailView } from "./components/message-detail-view";
import { RegistryPanel } from "./components/registry-panel";
import { ThreadListPanel } from "./components/thread-list-panel";
import { TimelinePanel } from "./components/timeline-panel";
import { ToolCallPanel } from "./components/tool-call-panel";
import { useDevtoolsConnection } from "./hooks/use-devtools-connection";
import { useDevtoolsEvents } from "./hooks/use-devtools-events";
import { useDevtoolsFilters } from "./hooks/use-devtools-filters";
import { useProjectNames } from "./hooks/use-project-names";

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
    streamEvents,
    selectedSessionId,
    setSelectedSessionId,
    requestSnapshot,
  } = useDevtoolsConnection();

  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get("clientId");

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (!clientIdFromUrl) return;
    const clientExists = clients.some((c) => c.sessionId === clientIdFromUrl);
    if (clientExists && !selectedSessionId) {
      setSelectedSessionId(clientIdFromUrl);
    }
  }, [clientIdFromUrl, clients, selectedSessionId, setSelectedSessionId]);

  // Request a snapshot from the selected client when the dashboard connects
  // (e.g. after a page refresh) and no snapshot is cached yet.
  useEffect(() => {
    if (!selectedSessionId) return;
    if (snapshots.has(selectedSessionId)) return;
    requestSnapshot(selectedSessionId);
  }, [selectedSessionId, snapshots, requestSnapshot]);

  const currentSnapshot = selectedSessionId
    ? snapshots.get(selectedSessionId)
    : undefined;

  const currentStreamEvents = selectedSessionId
    ? (streamEvents.get(selectedSessionId) ?? [])
    : [];

  const timeline = useDevtoolsEvents(
    currentStreamEvents.length > 0 ? currentStreamEvents : undefined,
  );

  const projectNames = useProjectNames(clients.map((c) => c.projectId));

  const filters = useDevtoolsFilters(currentSnapshot);
  const selectedThread = filters.filteredThreads.find(
    (t) => t.id === selectedThreadId,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">DevTools</h1>
        <p className="text-sm text-muted-foreground">
          Real-time debugging for your Tambo application
        </p>
      </div>

      <ConnectionStatus isConnected={isConnected} error={error} />

      <ErrorBanner errors={currentSnapshot?.errors ?? []} />

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
                    {(client.projectId && projectNames.get(client.projectId)) ??
                      `Session ${client.sessionId.slice(0, 8)}`}{" "}
                    (v{client.sdkVersion})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <ClientCard
                key={client.sessionId}
                client={client}
                projectName={
                  client.projectId
                    ? projectNames.get(client.projectId)
                    : undefined
                }
              />
            ))}
          </div>

          {currentSnapshot && (
            <>
              <FilterBar
                threadStatusFilter={filters.threadStatusFilter}
                setThreadStatusFilter={filters.setThreadStatusFilter}
                messageRoleFilter={filters.messageRoleFilter}
                setMessageRoleFilter={filters.setMessageRoleFilter}
                messageContentTypeFilter={filters.messageContentTypeFilter}
                setMessageContentTypeFilter={
                  filters.setMessageContentTypeFilter
                }
                searchQuery={filters.searchQuery}
                setSearchQuery={filters.setSearchQuery}
              />

              <Tabs defaultValue="inspector" className="w-full">
                <TabsList>
                  <TabsTrigger value="inspector">Inspector</TabsTrigger>
                  <TabsTrigger value="registry">Registry</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="streaming">Streaming</TabsTrigger>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                </TabsList>

                <TabsContent value="inspector">
                  <div className="grid h-[600px] grid-cols-1 gap-4 rounded-lg border lg:grid-cols-[320px_1fr]">
                    <div className="border-r">
                      <ThreadListPanel
                        threads={filters.filteredThreads}
                        selectedThreadId={selectedThreadId}
                        onSelectThread={setSelectedThreadId}
                      />
                    </div>
                    <div>
                      <MessageDetailView
                        messages={
                          selectedThread
                            ? filters.filterMessages(selectedThread.messages)
                            : []
                        }
                        threadName={selectedThread?.name}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="registry">
                  <RegistryPanel registry={currentSnapshot.registry} />
                </TabsContent>

                <TabsContent value="timeline">
                  <div className="h-[600px] rounded-lg border">
                    <TimelinePanel
                      events={timeline.events}
                      droppedCount={timeline.droppedCount}
                      selectedEvent={timeline.selectedEvent}
                      onSelectEvent={timeline.setSelectedEvent}
                      onClear={timeline.clearEvents}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="streaming">
                  <ComponentStreamPanel
                    events={currentStreamEvents}
                    currentSnapshot={currentSnapshot}
                  />
                </TabsContent>

                <TabsContent value="tools">
                  <ToolCallPanel events={currentStreamEvents} />
                </TabsContent>
              </Tabs>
            </>
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
