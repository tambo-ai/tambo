"use client";

import { ClientCard } from "./components/client-card";
import { ConnectionStatus } from "./components/connection-status";
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
  const { isConnected, clients, error } = useDevtoolsConnection();

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.sessionId} client={client} />
          ))}
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
