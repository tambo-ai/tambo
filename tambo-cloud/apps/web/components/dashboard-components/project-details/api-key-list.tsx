import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { Trash2 } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { ProjectResponseDto } from "../../../app/dashboard/types/types";
import { DeleteAlertDialog } from "./delete-alert-dialog";
import { AlertState } from "./project-details-dialog";

interface APIKeyListProps {
  project: ProjectResponseDto;
}

export function APIKeyList({ project }: APIKeyListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
  });
  const { toast } = useToast();

  const {
    data: apiKeys,
    isLoading: apiKeysLoading,
    refetch: refetchApiKeys,
    error: apiKeysError,
  } = api.project.getApiKeys.useQuery(project.id);
  useEffect(() => {
    if (apiKeysError) {
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    }
  }, [apiKeysError, toast]);
  const { mutateAsync: generateApiKey, isPending: isGeneratingKey } =
    api.project.generateApiKey.useMutation();

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a key name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const newKey = await generateApiKey({
        projectId: project.id,
        name: newKeyName,
      });
      setNewGeneratedKey(newKey.apiKey);
      await refetchApiKeys();
      setNewKeyName("");
      setShowNameInput(false);
      toast({
        title: "Success",
        description: "New API key created successfully",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const { mutateAsync: removeApiKey, isPending: isRemovingKey } =
    api.project.removeApiKey.useMutation();

  const handleDeleteApiKey = async () => {
    try {
      if (!alertState.data) return;
      await removeApiKey({
        projectId: project.id,
        apiKeyId: alertState.data.id,
      });
      await refetchApiKeys();
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    } finally {
      setAlertState({
        show: false,
        title: "",
        description: "",
        data: undefined,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateApiKey();
    }
  };
  const isLoading = apiKeysLoading || isRemovingKey || isGeneratingKey;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold">API Keys</h4>
        {showNameInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Enter key name"
              className="px-2 py-1 text-sm border rounded"
              disabled={isCreating}
              autoFocus
              onKeyDown={handleKeyPress}
            />
            <Button
              size="sm"
              onClick={handleCreateApiKey}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowNameInput(false);
                setNewKeyName("");
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setShowNameInput(true)}>
            + Create API Key
          </Button>
        )}
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          {newGeneratedKey && (
            <div className="mb-4 p-4 border border-green-200 rounded-lg bg-green-50 space-y-2">
              <p className="text-sm font-medium">New API Key Generated</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={newGeneratedKey}
                  className="flex-1 px-2 py-1 text-sm border rounded bg-white"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(newGeneratedKey);
                    toast({
                      title: "Copied!",
                      description: "API key copied to clipboard",
                    });
                  }}
                >
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNewGeneratedKey(null)}
                >
                  Dismiss
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Make sure to copy this key now. You won&apos;t be able to see it
                again!
              </p>
            </div>
          )}
          {apiKeys?.length ? (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="p-3 rounded-lg bg-muted/60 space-y-1 max-w-full"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{key.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {key.lastUsedAt
                          ? `Last used: ${DateTime.fromJSDate(key.lastUsedAt).toFormat("EEE MMM d 'at' h:mma")}`
                          : "Never used"}
                      </p>
                      <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis">
                        {key.partiallyHiddenKey?.slice(0, 15)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setAlertState({
                          show: true,
                          title: "Delete API Key",
                          description:
                            "Are you sure you want to delete this API key? This action cannot be undone.",
                          data: { id: key.id },
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No API keys available
            </p>
          )}
        </>
      )}
      <DeleteAlertDialog
        alertState={alertState}
        setAlertState={setAlertState}
        onConfirm={handleDeleteApiKey}
      />
    </div>
  );
}
