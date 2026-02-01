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

/* ───────────────── MCP CONFIG MODAL ───────────────── */

export const McpConfigModal = ({
  isOpen,
  onClose,
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}) => {
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

  /* ───────── Effects ───────── */

  React.useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem("mcp-servers", JSON.stringify(mcpServers));
    window.dispatchEvent(
      new CustomEvent("mcp-servers-updated", { detail: mcpServers }),
    );

    if (mcpServers.length > 0) {
      setSavedSuccess(true);
      const t = setTimeout(() => setSavedSuccess(false), 2000);
      return () => clearTimeout(t);
    }
  }, [mcpServers]);

  /* ───────── Helpers ───────── */

  const addServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl.trim()) return;

    setMcpServers((prev) => [
      ...prev,
      {
        url: serverUrl.trim(),
        transport: transportType,
        ...(serverName.trim() ? { name: serverName.trim() } : {}),
      },
    ]);

    setServerUrl("");
    setServerName("");
    setTransportType(MCPTransport.HTTP);
  };

  const removeServer = (index: number) =>
    setMcpServers((prev) => prev.filter((_, i) => i !== index));

  const getTransportText = (t: MCPTransport) =>
    t === MCPTransport.HTTP ? "HTTP (DEFAULT)" : "SSE";

  if (!isOpen) return null;

  /* ───────── Instructions Markdown ───────── */

  const instructions = `
### MCP CLIENT CONFIGURATION

After registering servers, connect them to your system.

#### 1. Import hook
\`\`\`tsx
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
\`\`\`

#### 2. Load servers
\`\`\`tsx
const mcpServers = useMcpServers();
\`\`\`

#### 3. Inject into provider
\`\`\`tsx
<TamboProvider mcpServers={mcpServers}>
  {/* Application */}
</TamboProvider>
\`\`\`
`;

  /* ───────── Modal ───────── */

const modal = (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-black/70",
      className,
    )}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="
        w-full max-w-2xl mx-4
        max-h-[90vh] overflow-y-auto
        rounded-lg
        border
        bg-background
        shadow-xl
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-sm font-medium">
          MCP network configuration
        </h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-8">
        {/* Instructions */}
        <div className="rounded-md border">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="
              w-full flex items-center justify-between
              px-4 py-2 text-sm
              hover:bg-muted
            "
          >
            Setup instructions
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showInstructions && "rotate-180",
              )}
            />
          </button>

          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t px-4 py-3 text-sm"
            >
              <Streamdown components={createMarkdownComponents()}>
                {instructions}
              </Streamdown>
            </motion.div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={addServer} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">
              Server URL
            </label>
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              required
              placeholder="https://mcp.server.endpoint"
              className="
                w-full rounded-md border px-3 py-2 text-sm
                bg-background
                focus:outline-none
                focus:ring-1 focus:ring-ring
              "
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Server name (optional)
            </label>
            <input
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="Custom identifier"
              className="
                w-full rounded-md border px-3 py-2 text-sm
                bg-background
              "
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Transport
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="
                    w-full flex items-center justify-between
                    rounded-md border px-3 py-2 text-sm
                    bg-background hover:bg-muted
                  "
                >
                  {getTransportText(transportType)}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="
                  rounded-md border bg-popover shadow-md
                "
              >
                <DropdownMenuItem
                  onClick={() =>
                    setTransportType(MCPTransport.HTTP)
                  }
                  className="px-3 py-2 text-sm"
                >
                  HTTP (default)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setTransportType(MCPTransport.SSE)
                  }
                  className="px-3 py-2 text-sm"
                >
                  SSE
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <button
            type="submit"
            className="
              w-full rounded-md border bg-primary
              px-4 py-2 text-sm
              text-primary-foreground
              hover:opacity-90
            "
          >
            Add server
          </button>
        </form>

        {/* Success */}
        {savedSuccess && (
          <div className="text-sm text-emerald-600">
            MCP servers saved
          </div>
        )}

        {/* Server list */}
        {mcpServers.length > 0 ? (
          <div className="space-y-2">
            {mcpServers.map((server, i) => {
              const url =
                typeof server === "string" ? server : server.url;
              const name =
                typeof server === "string" ? null : server.name;
              const transport =
                typeof server === "string"
                  ? "HTTP"
                  : getTransportText(
                      server.transport ?? MCPTransport.HTTP,
                    );

              return (
                <div
                  key={i}
                  className="
                    flex items-start justify-between
                    rounded-md border px-4 py-3
                  "
                >
                  <div className="text-sm">
                    <div className="font-medium truncate">
                      {url}
                    </div>
                    {name && (
                      <div className="text-xs text-muted-foreground">
                        Name: {name}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Transport: {transport}
                    </div>
                  </div>

                  <button
                    onClick={() => removeServer(i)}
                    className="text-destructive hover:opacity-80"
                    aria-label="Remove server"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No MCP servers configured
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);


  return typeof window !== "undefined"
    ? createPortal(modal, document.body)
    : null;
};

/* ───────────────── useMcpServers HOOK (UNCHANGED LOGIC) ───────────────── */

export type McpServer = string | { url: string };

export function useMcpServers(): McpServer[] {
  const [servers, setServers] = React.useState<McpServer[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = JSON.parse(localStorage.getItem("mcp-servers") ?? "[]");
      const seen = new Set<string>();
      return raw.filter((s: McpServer) => {
        const url = typeof s === "string" ? s : s.url;
        if (seen.has(url)) return false;
        seen.add(url);
        return true;
      });
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    const update = () => {
      try {
        const raw = JSON.parse(localStorage.getItem("mcp-servers") ?? "[]");
        const seen = new Set<string>();
        setServers(
          raw.filter((s: McpServer) => {
            const url = typeof s === "string" ? s : s.url;
            if (seen.has(url)) return false;
            seen.add(url);
            return true;
          }),
        );
      } catch {
        setServers([]);
      }
    };

    window.addEventListener("mcp-servers-updated", update);
    window.addEventListener("storage", (e) => {
      if (e.key === "mcp-servers") update();
    });

    return () => {
      window.removeEventListener("mcp-servers-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return servers;
}
