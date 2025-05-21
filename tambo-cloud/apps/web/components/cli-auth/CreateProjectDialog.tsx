import {
  McpServerEditor,
  MCPServerInfo,
} from "@/components/dashboard-components/project-details/mcp-server-editor";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MCPTransport } from "@tambo-ai-cloud/core";
import { ChevronDown, ChevronUp } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { FREE_MESSAGE_LIMIT } from "../dashboard-components/project-details/provider-key-section";

type CreateProjectDialogState = Readonly<{
  isOpen: boolean;
  name: string;
  providerKey: string;
  mcpServer?: {
    url: string;
    customHeaders: Record<string, string>;
    mcpTransport: MCPTransport;
  };
}>;

interface CreateProjectDialogProps {
  state: Readonly<CreateProjectDialogState>;
  isCreating: boolean;
  onStateChange: (state: CreateProjectDialogState) => void;
  onConfirm: () => Promise<void>;
}

/**
 * CreateProjectDialog Component
 *
 * Dialog for creating new projects:
 * - Input field for project name
 * - Validation for empty names
 * - Loading state during creation
 * - Keyboard support (Enter to submit)
 */

const isValidOpenAIKey = (key: string): boolean => {
  return !key || (key.startsWith("sk-") && key.length >= 51);
};

export const CreateProjectDialog = memo(function CreateProjectDialog({
  state,
  isCreating,
  onStateChange,
  onConfirm,
}: CreateProjectDialogProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showMcpServer, setShowMcpServer] = useState(false);
  const [mcpEditorState, setMcpEditorState] = useState({
    isEditing: true,
    isSaving: false,
    isDeleting: false,
    error: null,
    errorMessage: null,
  });

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      onStateChange(
        isOpen
          ? { ...state, isOpen }
          : { isOpen: false, name: "", providerKey: "" },
      );
    },
    [state, onStateChange],
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onStateChange({ ...state, name: e.target.value });
    },
    [state, onStateChange],
  );

  const handleProviderKeyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newKey = e.target.value;
      onStateChange({ ...state, providerKey: newKey });

      // Show warning if key format is invalid
      if (newKey && !isValidOpenAIKey(newKey)) {
        e.target.setCustomValidity(
          "Please enter a valid OpenAI API key (starts with sk-)",
        );
      } else {
        e.target.setCustomValidity("");
      }
    },
    [state, onStateChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !isCreating && state.name.trim()) {
        e.preventDefault();
        onConfirm();
      }
    },
    [isCreating, state.name, onConfirm],
  );

  const handleMcpServerSave = useCallback(
    async (serverInfo: {
      url: string;
      customHeaders: Record<string, string>;
      mcpTransport: MCPTransport;
    }) => {
      // Update the state with the MCP server info
      onStateChange({
        ...state,
        mcpServer: serverInfo,
      });

      // Set the editing state to false
      setMcpEditorState({
        ...mcpEditorState,
        isEditing: false,
      });
      return {
        id: "new-server",
        url: serverInfo.url,
        customHeaders: serverInfo.customHeaders,
        mcpTransport: serverInfo.mcpTransport,
        mcpRequiresAuth: false,
      };
    },
    [state, onStateChange, mcpEditorState],
  );

  const handleMcpServerEdit = useCallback(() => {
    setMcpEditorState({
      ...mcpEditorState,
      isEditing: true,
    });
  }, [mcpEditorState]);

  const handleMcpServerCancel = useCallback(() => {
    setMcpEditorState({
      ...mcpEditorState,
      isEditing: false,
    });

    // If we're cancelling and there was no server info before, remove it
    if (!state.mcpServer) {
      onStateChange({
        ...state,
        mcpServer: undefined,
      });
    }
  }, [mcpEditorState, state, onStateChange]);

  const handleMcpServerDelete = useCallback(async () => {
    onStateChange({
      ...state,
      mcpServer: undefined,
    });
  }, [state, onStateChange]);

  // Create a dummy server info object for the editor
  const mcpServerInfo: MCPServerInfo = {
    id: "new-server",
    url: state.mcpServer?.url || null,
    customHeaders: state.mcpServer?.customHeaders || {},
    mcpTransport: state.mcpServer?.mcpTransport || MCPTransport.SSE,
  };

  const isFormValid = state.name.trim() && isValidOpenAIKey(state.providerKey);

  return (
    <Dialog open={state.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Create New Project</DialogTitle>
        </DialogHeader>
        <form
          className="py-4 space-y-4"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isCreating && isFormValid) {
              onConfirm();
            }
          }}
        >
          <div>
            <label
              htmlFor="projectName"
              className="text-sm font-medium block mb-2"
            >
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={state.name}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              placeholder="Project Name"
              className="w-full px-3 py-2 border rounded-md text-sm"
              autoFocus
              name="project-name"
            />
            <p className="p-2 text-xs text-muted-foreground">
              Start with {FREE_MESSAGE_LIMIT} free messages, or add your own LLM
              Provider Key. You can add one at any time in the project settings.
            </p>
          </div>
          <div>
            <label
              htmlFor="providerKey"
              className="flex justify-between items-center text-sm font-medium mb-2"
            >
              <span>LLM Provider (Optional)</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 -mr-2"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </label>

            {showApiKey && (
              <div>
                <label
                  htmlFor="providerKey"
                  className="text-sm font-medium block mb-2"
                >
                  OpenAI API Key
                </label>
                <input
                  id="providerKey"
                  type="password"
                  value={state.providerKey}
                  onChange={handleProviderKeyChange}
                  onKeyDown={handleKeyDown}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  autoComplete="new-password"
                  name="openai-api-key"
                  pattern="sk-.*"
                  title="OpenAI API key must start with 'sk-'"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Create or find your key in the{" "}
                  <a
                    href="https://platform.openai.com/settings/organization/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link"
                  >
                    OpenAI API keys page
                  </a>
                  .
                </p>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="mcpServer"
              className="flex justify-between items-center text-sm font-medium mb-2"
            >
              <span>MCP Server (Optional)</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 -mr-2"
                onClick={() => setShowMcpServer(!showMcpServer)}
              >
                {showMcpServer ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </label>

            {showMcpServer && (
              <div>
                <McpServerEditor
                  server={mcpServerInfo}
                  isEditing
                  isNew={true}
                  error={mcpEditorState.error}
                  isSaving={mcpEditorState.isSaving}
                  isDeleting={mcpEditorState.isDeleting}
                  errorMessage={mcpEditorState.errorMessage}
                  hideEditButtons
                  onEdit={handleMcpServerEdit}
                  onCancel={handleMcpServerCancel}
                  onSave={handleMcpServerSave}
                  onDelete={handleMcpServerDelete}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Configure a custom MCP server for this project. You can add
                  additional MCP servers in the project settings.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !isFormValid}>
              {isCreating ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
