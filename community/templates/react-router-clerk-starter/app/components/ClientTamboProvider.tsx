import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { useMcpServers, type McpServer } from "~/components/tambo/mcp-config-modal";
import { useUser } from "@clerk/react-router";

// Context to track if Tambo is ready and provide registered components
const TamboReadyContext = createContext<{ isReady: boolean; components: TamboComponent[] }>({
  isReady: false,
  components: []
});

export function useTamboReady() {
  const context = useContext(TamboReadyContext);
  return context.isReady;
}

export function useTamboComponents() {
  const context = useContext(TamboReadyContext);
  return context.components;
}

interface TamboProviderProps {
  apiKey: string;
  userId?: string;
  components: TamboComponent[];
  tools: TamboTool[];
  mcpServers?: McpServer[];
  children: ReactNode;
}

/**
 * Client-side only Tambo Provider wrapper
 * This component dynamically imports TamboProvider only on the client
 * to completely avoid SSR issues with @tambo-ai/react
 */
export function ClientTamboProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [TamboProvider, setTamboProvider] = useState<React.ComponentType<TamboProviderProps> | null>(null);
  const [components, setComponents] = useState<TamboComponent[]>([]);
  const [tools, setTools] = useState<TamboTool[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { user, isLoaded } = useUser();

  // Load MCP servers using the hook which handles localStorage safely
  const mcpServers = useMcpServers();

  // First useEffect just to mark we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Second useEffect to load Tambo (only runs on client)
  useEffect(() => {
    if (!isClient) return;

    // Dynamically import on client-side only
    Promise.all([
      import("@tambo-ai/react"),
      import("~/lib/tambo"),
    ]).then(([tamboModule, tamboConfig]) => {
      setTamboProvider(() => tamboModule.TamboProvider as React.ComponentType<TamboProviderProps>);
      setComponents(tamboConfig.components);
      console.log("Tambo components registered:", tamboConfig.components.map(c => c.name));
      setTools(tamboConfig.tools);
      setIsReady(true);
    }).catch(err => {
      console.error("Failed to load Tambo SDK:", err);
      setError(err as Error);
    });
  }, [isClient]);

  const apiKey = import.meta.env.VITE_TAMBO_API_KEY;

  // Always render children wrapped in context during SSR and initial client render
  // This ensures server and client render the same thing initially
  if (!isClient || !TamboProvider || !isReady || !isLoaded) {
    return (
      <TamboReadyContext.Provider value={{ isReady: false, components: [] }}>
        {children}
      </TamboReadyContext.Provider>
    );
  }

  // Show error state if loading failed
  if (error) {
    console.error("Tambo loading error:", error);
    return (
      <TamboReadyContext.Provider value={{ isReady: false, components: [] }}>
        {children}
      </TamboReadyContext.Provider>
    );
  }

  // On client after loading, render with TamboProvider
  return (
    <TamboReadyContext.Provider value={{ isReady: true, components }}>
      <TamboProvider
        apiKey={apiKey}
        userId={user?.id}
        components={components}
        tools={tools}
        mcpServers={mcpServers}
      >
        {children}
      </TamboProvider>
    </TamboReadyContext.Provider>
  );
}
