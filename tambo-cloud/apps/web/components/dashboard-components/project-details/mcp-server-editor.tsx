import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MCPTransport } from "@tambo-ai-cloud/core";
import { TRPCClientErrorLike } from "@trpc/client";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export interface MCPServerInfo {
  id: string;
  url: string | null;
  customHeaders: Record<string, string>;
  mcpTransport?: MCPTransport;
}

interface McpServerEditorProps {
  server: MCPServerInfo;
  isEditing: boolean;
  isNew: boolean;
  error: Error | TRPCClientErrorLike<any> | null;
  isSaving: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
  hideEditButtons?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (serverInfo: {
    url: string;
    customHeaders: Record<string, string>;
    mcpTransport: MCPTransport;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function McpServerEditor({
  server,
  isEditing,
  isNew,
  error,
  isSaving,
  isDeleting,
  errorMessage,
  hideEditButtons = false,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: McpServerEditorProps) {
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
  const urlInputId = useId();
  const transportId = useId();
  const headerNameId = useId();
  const headerValueId = useId();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(0, inputRef.current.value.length);
    }
  }, [isEditing]);

  // Reset form when server changes
  useEffect(() => {
    setMcpTransport(server.mcpTransport || MCPTransport.SSE);
    setUrl(server.url || (isNew ? "https://" : ""));
    setHeaderName(firstHeaderKey || "");
    setHeaderValue(server.customHeaders[firstHeaderKey] || "");
  }, [server, isNew, firstHeaderKey]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
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

    await onSave({
      url: trimmedUrl,
      customHeaders,
      mcpTransport,
    });
  };

  // Use debounced callback for auto-save
  const debouncedSave = useDebouncedCallback(() => {
    if (hideEditButtons && isEditing) {
      handleSave();
    }
  }, 500);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (hideEditButtons && isEditing) {
      debouncedSave();
    }
  };

  const handleTransportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMcpTransport(e.target.value as MCPTransport);
    if (hideEditButtons && isEditing) {
      debouncedSave();
    }
  };

  const handleHeaderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeaderName(e.target.value);
    if (hideEditButtons && isEditing) {
      debouncedSave();
    }
  };

  const handleHeaderValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeaderValue(e.target.value);
    if (hideEditButtons && isEditing) {
      debouncedSave();
    }
  };

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
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
            placeholder={isNew ? "Enter server URL" : undefined}
            className={`flex-1 ${error ? "border-destructive" : ""}`}
          />
          {!hideEditButtons && (
            <>
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
                    onClick={onCancel}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="icon" onClick={onEdit}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
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
          onChange={handleTransportChange}
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
            onChange={handleHeaderNameChange}
            placeholder="Optional header name (e.g. Authorization)"
            className="flex-[2]"
            disabled={!isEditing}
          />
          <Input
            id={headerValueId}
            type={isHeaderValueFocused ? "text" : "password"}
            value={headerValue}
            onChange={handleHeaderValueChange}
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
