import { api } from "@/trpc/react";
import { MCPTransport } from "@tambo-ai-cloud/core";
import { useEffect, useState } from "react";
import { McpServerEditor, MCPServerInfo } from "./mcp-server-editor";

interface McpServerRowProps {
  server: MCPServerInfo;
  projectId: string;
  onRefresh: () => Promise<void>;
  isNew?: boolean;
  shouldDelete?: boolean;
  onCancel?: () => void;
  onDeleteComplete?: () => void;
  redirectToAuth?: (url: string) => void;
}

export function McpServerRow({
  server,
  projectId,
  onRefresh,
  isNew = false,
  shouldDelete = false,
  onCancel,
  onDeleteComplete,
  redirectToAuth,
}: McpServerRowProps) {
  const [isEditing, setIsEditing] = useState(isNew);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // When shouldDelete is true, show delete confirmation
  useEffect(() => {
    if (shouldDelete) {
      setShowDeleteConfirmation(true);
    }
  }, [shouldDelete]);

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
    serverKey: string;
    customHeaders: Record<string, string>;
    mcpTransport: MCPTransport;
  }) => {
    if (!serverInfo.url) {
      return;
    }

    if (isNew) {
      return await addServer({
        projectId,
        url: serverInfo.url,
        serverKey: serverInfo.serverKey,
        customHeaders: serverInfo.customHeaders,
        mcpTransport: serverInfo.mcpTransport,
      });
    }

    return await updateServer({
      projectId,
      serverId: server.id,
      url: serverInfo.url,
      serverKey: serverInfo.serverKey,
      customHeaders: serverInfo.customHeaders,
      mcpTransport: serverInfo.mcpTransport,
    });
  };

  const handleDelete = async () => {
    await deleteServer({
      projectId,
      serverId: server.id,
    });
    setShowDeleteConfirmation(false);
    onDeleteComplete?.();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    onDeleteComplete?.();
  };

  const isSaving = isNew ? isAdding : isUpdating;
  const error = isNew ? addError : isEditing ? updateError : deleteError;
  const errorMessage =
    error instanceof Error
      ? error.message
      : error?.message || (error && "An error occurred");

  return (
    <McpServerEditor
      projectId={projectId}
      server={server}
      isEditing={isEditing}
      isNew={isNew}
      error={error}
      isSaving={isSaving}
      isDeleting={isDeleting}
      errorMessage={errorMessage}
      showDeleteConfirmation={showDeleteConfirmation}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onSave={handleSave}
      onDelete={handleDelete}
      onCancelDelete={handleCancelDelete}
      redirectToAuth={redirectToAuth}
    />
  );
}
