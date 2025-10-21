import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useClipboard } from "@/hooks/use-clipboard";
import { useToast } from "@/hooks/use-toast";
import { api, type RouterOutputs } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import {
  DeleteConfirmationDialog,
  type AlertState,
} from "../delete-confirmation-dialog";
import { APIKeyDialog } from "./api-key-dialog";
import { APIKeyListItem } from "./api-key-list-item";

export const APIKeyListProps = z.object({
  project: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional()
    .describe("The project to fetch API keys for."),
  isLoading: z
    .boolean()
    .optional()
    .describe("Whether the API keys are loading."),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe(
      "Optional callback function triggered when API keys are successfully updated.",
    ),
});

interface APIKeyListProps {
  project?: RouterOutputs["project"]["getUserProjects"][number];
  isLoading?: boolean;
  onEdited?: () => void;
}

export function APIKeyList({
  project,
  isLoading: externalLoading,
  onEdited,
}: APIKeyListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
  });
  const [, copy] = useClipboard(newGeneratedKey ?? "");
  const { toast } = useToast();
  const utils = api.useUtils();

  const {
    data: apiKeys,
    isLoading: apiKeysLoading,
    error: apiKeysError,
  } = api.project.getApiKeys.useQuery(project?.id ?? "", {
    enabled: !!project?.id,
  });

  const { mutateAsync: generateApiKey, isPending: isGeneratingKey } =
    api.project.generateApiKey.useMutation({
      onSuccess: async () => {
        await utils.project.getApiKeys.invalidate(project?.id ?? "");
        onEdited?.();
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create API key",
          variant: "destructive",
        });
      },
    });

  const { mutateAsync: removeApiKey } = api.project.removeApiKey.useMutation({
    onSuccess: async () => {
      await utils.project.getApiKeys.invalidate(project?.id ?? "");
      onEdited?.();
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (apiKeysError) {
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    }
  }, [apiKeysError, toast]);

  const handleCreateApiKey = useCallback(
    async (keyName?: string) => {
      const name = keyName || newKeyName;
      if (!name.trim()) {
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
          projectId: project?.id ?? "",
          name: name,
        });
        setNewGeneratedKey(newKey.apiKey);

        // Only show dialog for auto-generated first key
        if (keyName === "first-tambo-key") {
          setShowKeyDialog(true);
        }

        setNewKeyName("");
        if (!keyName) {
          toast({
            title: "Success",
            description: "New API key created successfully",
          });
        }
      } finally {
        setIsCreating(false);
      }
    },
    [generateApiKey, newKeyName, project?.id, toast],
  );

  // Auto-create first key if none exist
  useEffect(() => {
    if (!apiKeysLoading && apiKeys?.length === 0) {
      handleCreateApiKey("first-tambo-key").catch(console.error);
    }
  }, [apiKeysLoading, apiKeys, handleCreateApiKey]);

  const handleDeleteApiKey = async () => {
    try {
      if (!alertState.data || !project?.id) return;

      await removeApiKey({
        projectId: project.id,
        apiKeyId: alertState.data.id,
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

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      await handleCreateApiKey();
    }
  };

  const handleDeleteKey = (id: string) => {
    setAlertState({
      show: true,
      title: "Delete API Key",
      description:
        "Are you sure you want to delete this API key? This action cannot be undone.",
      data: { id },
    });
  };

  const isLoading = apiKeysLoading || externalLoading;

  if (!project) {
    return (
      <Card className="border rounded-md overflow-hidden">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">No project found</p>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className="border rounded-md overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold">API Keys</h4>
            </div>
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-md border space-y-2 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                  <div className="h-6 w-40 bg-muted rounded" />
                </div>
                <div className="h-7 w-7 bg-muted rounded" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-semibold">API Keys</h4>
          </div>

          <AnimatePresence mode="wait">
            {!isCreating && !newGeneratedKey && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="self-end sm:self-auto"
              >
                <Button
                  size="sm"
                  className="font-sans text-primary bg-transparent border hover:bg-accent"
                  onClick={() => setIsCreating(true)}
                  disabled={!!newGeneratedKey}
                >
                  Add Key
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {/* Create new key form dialog */}
          {isCreating && (
            <motion.div
              key="create-new-key-form"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-md space-y-3 "
            >
              <motion.h5
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-medium text-primary"
              >
                Create New API Key
              </motion.h5>
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Enter key name"
                    className="flex-1 font-sans"
                    disabled={isGeneratingKey}
                    autoFocus
                    onKeyDown={handleKeyPress}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-sans flex-1 sm:flex-initial"
                      onClick={() => {
                        setIsCreating(false);
                        setNewKeyName("");
                      }}
                      disabled={isGeneratingKey}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="font-sans flex-1 sm:flex-initial"
                      onClick={async () => await handleCreateApiKey()}
                      disabled={isGeneratingKey || !newKeyName.trim()}
                    >
                      {isGeneratingKey ? (
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          <span className="hidden sm:inline">Creating...</span>
                        </span>
                      ) : (
                        "Create Key"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* New key generated dialog */}
          {newGeneratedKey && !showKeyDialog && (
            <motion.div
              key="new-key-generated-dialog"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-md space-y-3"
            >
              <motion.h5
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-medium"
              >
                New API Key Generated
              </motion.h5>
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    type="text"
                    readOnly
                    value={newGeneratedKey}
                    className="flex-1 font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="font-sans flex-1 sm:flex-initial"
                      onClick={async () => await copy()}
                    >
                      <span className="flex items-center gap-1">
                        <Copy className="h-3 w-3" />
                        <span className="hidden sm:inline">Copy</span>
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-sans flex-1 sm:flex-initial"
                      onClick={() => setNewGeneratedKey(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs font-sans text-muted-foreground"
                >
                  Make sure to copy this key now. You won&apos;t be able to see
                  it again!
                </motion.p>
              </motion.div>
            </motion.div>
          )}

          {/* Display API keys */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-16 animate-pulse rounded-md"
                  initial={{ opacity: 0.3, y: 5 }}
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    y: 0,
                  }}
                  transition={{
                    opacity: { repeat: Infinity, duration: 1.5 },
                    y: { duration: 0.3 },
                  }}
                />
              ))}
            </div>
          ) : apiKeys?.length ? (
            <div className="space-y-2">
              <AnimatePresence>
                {apiKeys.map((key, index) => (
                  <APIKeyListItem
                    key={key.id}
                    apiKey={key}
                    index={index}
                    onDelete={handleDeleteKey}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : null}
        </AnimatePresence>

        <DeleteConfirmationDialog
          mode="single"
          alertState={alertState}
          setAlertState={setAlertState}
          onConfirm={handleDeleteApiKey}
        />

        <APIKeyDialog
          open={showKeyDialog}
          onOpenChange={setShowKeyDialog}
          apiKey={newGeneratedKey || ""}
        />
      </CardContent>
    </Card>
  );
}
