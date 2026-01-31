"use client";

import { createMarkdownComponents } from "@/components/tambo/markdown-components";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { type McpServerInfo, MCPTransport } from "@tambo-ai/react";
import { motion } from "framer-motion";
import { ChevronDown, Trash2, X } from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";
import { Streamdown } from "streamdown";

/**
 * Modal component for configuring client-side MCP (Model Context Protocol) servers.
 *
 * This component provides a user interface for managing MCP server connections that
 * will be used to extend the capabilities of the tambo application. The servers are
 * stored in browser localStorage and connected directly from the client-side.
 *
 * @param props - Component props
 * @param props.isOpen - Whether the modal is currently open/visible
 * @param props.onClose - Callback function called when the modal should be closed
 * @returns The modal component or null if not open
 */
export const McpConfigModal = ({
  isOpen,
  onClose,
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}) => {
  // Initialize from localStorage directly to avoid conflicts
  const [mcpServers, setMcpServers] = React.useState<McpServerInfo[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("mcp-servers") ?? "[]");
    } catch {
      return [];
    }
  });
  const [serverUrl, setServerUrl] = React.useState("");
  const [serverName, setServerName] = React.useState("");
  const [transportType, setTransportType] = React.useState<MCPTransport>(
    MCPTransport.HTTP,
  );
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Save servers to localStorage when updated and emit events
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mcp-servers", JSON.stringify(mcpServers));

      // Emit custom event to notify other components in the same tab
      window.dispatchEvent(
        new CustomEvent("mcp-servers-updated", {
          detail: mcpServers,
        }),
      );

      if (mcpServers.length > 0) {
        setSavedSuccess(true);
        const timer = setTimeout(() => setSavedSuccess(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [mcpServers]);

  const addServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (serverUrl.trim()) {
      const serverConfig = {
        url: serverUrl.trim(),
        transport: transportType,
        ...(serverName.trim() ? { name: serverName.trim() } : {}),
      };
      setMcpServers((prev) => [...prev, serverConfig]);

      // Reset form fields
      setServerUrl("");
      setServerName("");
      setTransportType(MCPTransport.HTTP);
    }
  };

  const removeServer = (index: number) => {
    setMcpServers((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper function to get server display information
  const getServerInfo = (server: McpServerInfo) => {
    if (typeof server === "string") {
      return { url: server, transport: "HTTP (default)", name: null };
    } else {
      return {
        url: server.url,
        transport: server.transport ?? "HTTP (default)",
        name: server.name ?? null,
      };
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Close modal when clicking on backdrop (not on the modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getTransportDisplayText = (transport: MCPTransport) => {
    return transport === MCPTransport.HTTP ? "HTTP (default)" : "SSE";
  };

  if (!isOpen) return null;

  const instructions = `
###

After configuring your MCP servers below, integrate them into your application.

#### 1. Import the required components

\`\`\`tsx
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
\`\`\`

#### 2. Load MCP servers and wrap your components:

\`\`\`tsx
const mcpServers = useMcpServers();
\`\`\`

#### 3. Example implementation:

\`\`\`tsx
function MyApp() {
  const mcpServers = useMcpServers(); // Reactive - updates when servers change

  return (
    <TamboProvider apiKey={apiKey} components={components} tools={tools}>
      <TamboMcpProvider mcpServers={mcpServers}>
        {/* Your app components */}
      </TamboMcpProvider>
    </TamboProvider>
  );
}
\`\`\`
`;

  const modalContent = (
    <motion.div
      className={cn(
        "fixed inset-0 bg-backdrop flex items-center justify-center z-50",
        className,
      )}
      onClick={handleBackdropClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">MCP Server Configuration</h2>
          <button
            onClick={onClose}
            className="hover:bg-muted rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          <div className="mb-6 bg-container border border-muted rounded-lg">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between p-2 hover:bg-muted transition-colors cursor-pointer"
              type="button"
            >
              <span className="text-sm font-semibold text-foreground">
                Setup Instructions
              </span>
              <ChevronDown
                className={`w-4 h-4 text-foreground transition-transform duration-200 ${
                  showInstructions ? "rotate-180" : ""
                }`}
              />
            </button>
            {showInstructions && (
              <motion.div
                className="px-4 pb-4 border-t border-muted"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Streamdown components={createMarkdownComponents()}>
                  {instructions}
                </Streamdown>
              </motion.div>
            )}
          </div>
          {/* Description */}
          <div className="mb-6">
            <p className="text-foreground mb-3 text-sm leading-relaxed">
              Configure{" "}
              <span className="font-semibold text-foreground">client-side</span>{" "}
              MCP servers to extend the capabilities of your tambo application.
              These servers will be connected{" "}
              <i>
                <b>from the browser</b>
              </i>{" "}
              and exposed as tools to tambo.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={addServer} className="mb-8">
            <div className="space-y-4">
              {/* Server URL */}
              <div>
                <label
                  htmlFor="server-url"
                  className="block text-sm font-semibold text-foreground mb-2"
                >
                  Server URL
                  <span className="text-muted-foreground font-normal ml-1">
                    (must be accessible from the browser)
                  </span>
                </label>
                <input
                  id="server-url"
                  type="url"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://your-mcp-server-url.com"
                  className="w-full px-3 py-2.5 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150 text-sm"
                  required
                />
              </div>

              {/* Server Name */}
              <div>
                <label
                  htmlFor="server-name"
                  className="block text-sm font-semibold text-foreground mb-2"
                >
                  Server Name
                  <span className="text-muted-foreground font-normal ml-1">
                    (optional)
                  </span>
                </label>
                <input
                  id="server-name"
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Custom server name"
                  className="w-full px-3 py-2.5 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150 text-sm"
                />
              </div>

              {/* Transport Type */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Transport Type
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground text-sm flex items-center justify-between hover:bg-muted-backdrop cursor-pointer transition-all duration-150"
                    >
                      <span>{getTransportDisplayText(transportType)}</span>
                      <ChevronDown className="w-4 h-4 text-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-full min-w-[200px] bg-card border border-muted rounded-lg shadow-lg z-50 py-1 animate-in fade-in-0 zoom-in-95 duration-100"
                    align="start"
                  >
                    <DropdownMenuItem
                      className="px-3 py-2 text-sm text-foreground hover:bg-muted-backdrop cursor-pointer focus:bg-muted-backdrop focus:outline-none"
                      onClick={() => setTransportType(MCPTransport.HTTP)}
                    >
                      HTTP (default)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="px-3 py-2 text-sm text-foreground hover:bg-muted-backdrop cursor-pointer focus:bg-muted-backdrop focus:outline-none"
                      onClick={() => setTransportType(MCPTransport.SSE)}
                    >
                      SSE
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all duration-150 font-medium"
            >
              Add Server
            </button>
          </form>

          {/* Success Message */}
          {savedSuccess && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Servers saved to browser storage
              </div>
            </div>
          )}

          {/* Server List */}
          {mcpServers.length > 0 ? (
            <div>
              <h4 className="font-medium mb-3 text-foreground">
                Connected Servers ({mcpServers.length})
              </h4>
              <div className="space-y-2">
                {mcpServers.map((server, index) => {
                  const serverInfo = getServerInfo(server);
                  return (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 border border-muted rounded-lg hover:border-muted-backdrop transition-colors duration-150"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                          <span className="text-foreground font-medium truncate">
                            {serverInfo.url}
                          </span>
                        </div>
                        <div className="ml-5 space-y-1">
                          {serverInfo.name && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Name:</span>{" "}
                              {serverInfo.name}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Transport:</span>{" "}
                            {serverInfo.transport}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeServer(index)}
                        className="ml-4 px-3 py-1.5 text-sm bg-destructive/20 text-destructive rounded-md hover:bg-destructive/30 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-1 transition-colors duration-150 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
              <p className="text-muted-foreground text-sm">
                No MCP servers configured yet
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Add your first server above to get started
              </p>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-container border border-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-foreground">What is MCP?</h4>
            <p className="text-foreground text-sm leading-relaxed">
              The{" "}
              <a
                href="https://docs.tambo.co/concepts/model-context-protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 hover:text-foreground"
              >
                Model Context Protocol (MCP)
              </a>{" "}
              is a standard that allows applications to communicate with
              external tools and services. By configuring MCP servers, your
              tambo application will be able to make calls to these tools.
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Learn more:</span>{" "}
              <a
                href="https://docs.tambo.co/concepts/model-context-protocol/clientside-mcp-connection"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                client-side
              </a>{" "}
              |{" "}
              <a
                href="https://docs.tambo.co/concepts/model-context-protocol/serverside-mcp-connection"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                server-side
              </a>{" "}
              MCP configuration.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Use portal to render outside current DOM tree to avoid nested forms
  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

/**
 * Type for MCP Server entries
 */
export type McpServer = string | { url: string };

/**
 * Load and reactively track MCP server configurations from browser localStorage.
 *
 * This hook retrieves saved MCP server configurations and automatically updates
 * when servers are added/removed from the modal or other tabs. It deduplicates
 * servers by URL and handles parsing errors gracefully.
 *
 * @returns Array of unique MCP server configurations that updates automatically or empty array if none found or in SSR context
 *
 * @example
 * ```tsx
 * function MyApp() {
 *   const mcpServers = useMcpServers(); // Reactive - updates automatically
 *   // Returns: [{ url: "https://api.example.com" }, "https://api2.example.com"]
 *
 *   return (
 *     <TamboMcpProvider mcpServers={mcpServers}>
 *       {children}
 *     </TamboMcpProvider>
 *   );
 * }
 * ```
 */
export function useMcpServers(): McpServer[] {
  const [servers, setServers] = React.useState<McpServer[]>(() => {
    if (typeof window === "undefined") return [];

    const savedServersData = localStorage.getItem("mcp-servers");
    if (!savedServersData) return [];

    try {
      const servers = JSON.parse(savedServersData);
      // Deduplicate servers by URL to prevent multiple tool registrations
      const uniqueUrls = new Set();
      return servers.filter((server: McpServer) => {
        const url = typeof server === "string" ? server : server.url;
        if (uniqueUrls.has(url)) return false;
        uniqueUrls.add(url);
        return true;
      });
    } catch (e) {
      console.error("Failed to parse saved MCP servers", e);
      return [];
    }
  });

  React.useEffect(() => {
    const updateServers = () => {
      if (typeof window === "undefined") return;

      const savedServersData = localStorage.getItem("mcp-servers");
      if (!savedServersData) {
        setServers([]);
        return;
      }

      try {
        const newServers = JSON.parse(savedServersData);
        // Deduplicate servers by URL
        const uniqueUrls = new Set();
        const deduped = newServers.filter((server: McpServer) => {
          const url = typeof server === "string" ? server : server.url;
          if (uniqueUrls.has(url)) return false;
          uniqueUrls.add(url);
          return true;
        });
        setServers(deduped);
      } catch (e) {
        console.error("Failed to parse saved MCP servers", e);
        setServers([]);
      }
    };

    // Listen for custom events (same tab updates)
    const handleCustomEvent = () => updateServers();
    window.addEventListener("mcp-servers-updated", handleCustomEvent);

    // Listen for storage events (cross-tab updates)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "mcp-servers") {
        updateServers();
      }
    };
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("mcp-servers-updated", handleCustomEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  return servers;
}
