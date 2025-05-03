import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { MCPTransport } from "@tambo-ai-cloud/core";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface McpServerRowProps {
  server: {
    id: string;
    url: string | null;
    customHeaders: Record<string, string>;
    mcpTransport?: MCPTransport;
  };
  projectId: string;
  onRefresh: () => Promise<void>;
  isNew?: boolean;
  onCancel?: () => void;
}

export function McpServerRow({
  server,
  projectId,
  onRefresh,
  isNew = false,
  onCancel,
}: McpServerRowProps) {
  const [isEditing, setIsEditing] = useState(isNew);
  const [mcpTransport, setMcpTransport] = useState<MCPTransport>(
    server.mcpTransport || MCPTransport.SSE,
  );
  const [url, setUrl] = useState(server.url || (isNew ? "https://" : ""));
  const firstHeaderKey = Object.keys(server.customHeaders)[0];
  const [headerName, setHeaderName] = useState(firstHeaderKey || "");
  const [headerValue, setHeaderValue] = useState(
    server.customHeaders[firstHeaderKey] || "",
  );
  const [isHeaderValueFocused, setIsHeaderValueFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dynamic IDs based on server ID
  const urlInputId = `mcp-url-${server.id}`;
  const transportId = `mcp-transport-${server.id}`;
  const headerNameId = `header-name-${server.id}`;
  const headerValueId = `header-value-${server.id}`;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(0, inputRef.current.value.length);
    }
  }, [isEditing]);

  const {
    mutateAsync: updateServer,
    isPending: isUpdating,
    error: updateError,
  } = api.tools.updateMcpServer.useMutation({
    onSuccess: async () => {
      await onRefresh();
      setIsEditing(false);
    },
  });

  const {
    mutateAsync: deleteServer,
    isPending: isDeleting,
    error: deleteError,
  } = api.tools.deleteMcpServer.useMutation({
    onSuccess: async () => {
      await onRefresh();
    },
  });

  const {
    mutateAsync: addServer,
    isPending: isAdding,
    error: addError,
  } = api.tools.addMcpServer.useMutation({
    onSuccess: async () => {
      await onRefresh();
      onCancel?.();
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (isNew) {
      onCancel?.();
      return;
    }
    setUrl(server.url || "");
    setHeaderName(firstHeaderKey || "");
    setHeaderValue(server.customHeaders[firstHeaderKey] || "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmedUrl = url.trim();
    const trimmedHeaderName = headerName.trim();
    const customHeaders: Record<string, string> = {};

    if (trimmedHeaderName) {
      customHeaders[trimmedHeaderName] = headerValue;
    }

    if (!trimmedUrl) {
      return;
    }

    if (isNew) {
      await addServer({
        projectId,
        url: trimmedUrl,
        customHeaders,
        mcpTransport,
      });
    } else {
      await updateServer({
        projectId,
        serverId: server.id,
        url: trimmedUrl,
        customHeaders,
        mcpTransport,
      });
    }
  };

  const handleDelete = async () => {
    await deleteServer({
      projectId,
      serverId: server.id,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const isSaving = isNew ? isAdding : isUpdating;
  const error = isNew ? addError : isEditing ? updateError : deleteError;
  const errorMessage =
    error instanceof Error
      ? error.message
      : error?.message || (error && "An error occurred");

  return (
    <div className="flex flex-col gap-2 bg-muted/50 p-2 rounded-md">
      <div className="flex flex-col gap-1">
        <label htmlFor={urlInputId} className="block text-sm font-medium">
          MCP Server URL
        </label>
        <div className="flex items-center gap-2">
          <Input
            id={urlInputId}
            ref={inputRef}
            value={url}
            disabled={!isEditing}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isNew ? "Enter server URL" : undefined}
            className={`flex-1 ${error ? "border-destructive" : ""}`}
          />
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={isSaving || !url.trim()}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={handleEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
        {errorMessage && (
          <p className="text-sm text-destructive px-2">{errorMessage}</p>
        )}
      </div>
      <div>
        <label htmlFor={transportId} className="block text-sm font-medium">
          MCP Server Type
        </label>
        <select
          id={transportId}
          name="mcpTransport"
          className="block w-full border rounded px-2 py-1 font-sans"
          value={mcpTransport}
          onChange={(e) => setMcpTransport(e.target.value as MCPTransport)}
          disabled={!isEditing}
        >
          <option value={MCPTransport.SSE}>SSE</option>
          <option value={MCPTransport.HTTP}>HTTP Streamable</option>
        </select>
      </div>
      <div>
        <label htmlFor={headerNameId} className="block text-sm font-medium">
          Custom Header
        </label>
        <div className="flex gap-2">
          <Input
            id={headerNameId}
            value={headerName}
            onChange={(e) => setHeaderName(e.target.value)}
            placeholder="Optional header name (e.g. Authorization)"
            className="flex-[2]"
            disabled={!isEditing}
          />
          <Input
            id={headerValueId}
            type={isHeaderValueFocused ? "text" : "password"}
            value={headerValue}
            onChange={(e) => setHeaderValue(e.target.value)}
            onFocus={() => setIsHeaderValueFocused(true)}
            onBlur={() => setIsHeaderValueFocused(false)}
            placeholder="Header value"
            className="flex-[5]"
            disabled={!isEditing || !headerName.trim()}
          />
        </div>
      </div>
    </div>
  );
}
