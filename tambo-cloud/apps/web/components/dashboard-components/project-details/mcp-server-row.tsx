import { api } from "@/trpc/react";
import { MCPTransport } from "@tambo-ai-cloud/core";
import { useState } from "react";
import { McpServerEditor, MCPServerInfo } from "./mcp-server-editor";

interface McpServerRowProps {
  server: MCPServerInfo;
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
    setIsEditing(false);
  };

  const handleSave = async (serverInfo: {
    url: string;
    customHeaders: Record<string, string>;
    mcpTransport: MCPTransport;
  }) => {
    if (!serverInfo.url) {
      return;
    }

    if (isNew) {
      await addServer({
        projectId,
        url: serverInfo.url,
        customHeaders: serverInfo.customHeaders,
        mcpTransport: serverInfo.mcpTransport,
      });
    } else {
      await updateServer({
        projectId,
        serverId: server.id,
        url: serverInfo.url,
        customHeaders: serverInfo.customHeaders,
        mcpTransport: serverInfo.mcpTransport,
      });
    }
  };

  const handleDelete = async () => {
    await deleteServer({
      projectId,
      serverId: server.id,
    });
  };

  const isSaving = isNew ? isAdding : isUpdating;
  const error = isNew ? addError : isEditing ? updateError : deleteError;
  const errorMessage =
    error instanceof Error
      ? error.message
      : error?.message || (error && "An error occurred");

  return (
    <McpServerEditor
      server={server}
      isEditing={isEditing}
      isNew={isNew}
      error={error}
      isSaving={isSaving}
      isDeleting={isDeleting}
      errorMessage={errorMessage}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}
