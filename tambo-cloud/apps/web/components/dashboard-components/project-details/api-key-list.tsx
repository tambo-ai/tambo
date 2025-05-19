import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api, type RouterOutputs } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import { APIKeyDialog } from "./api-key-dialog";
import { DeleteAlertDialog } from "./delete-alert-dialog";
import { AlertState } from "./project-details-dialog";

interface APIKeyListProps {
  project: RouterOutputs["project"]["getUserProjects"][number];
}

const listItemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export function APIKeyList({ project }: APIKeyListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
  });
  const [copyState, setCopyState] = useState<{ id: string; copied: boolean }>({
    id: "",
    copied: false,
  });
  const { toast } = useToast();

  const {
    data: apiKeys,
    isLoading: apiKeysLoading,
    refetch: refetchApiKeys,
    error: apiKeysError,
  } = api.project.getApiKeys.useQuery(project.id);

  const { mutateAsync: generateApiKey, isPending: isGeneratingKey } =
    api.project.generateApiKey.useMutation();

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
          projectId: project.id,
          name: name,
        });
        setNewGeneratedKey(newKey.apiKey);

        // Only show dialog for auto-generated first key
        if (keyName === "first-tambo-key") {
          setShowKeyDialog(true);
        }

        await refetchApiKeys();
        setNewKeyName("");
        if (!keyName) {
          toast({
            title: "Success",
            description: "New API key created successfully",
          });
        }
      } catch (_error) {
        toast({
          title: "Error",
          description: "Failed to create API key",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
    },
    [generateApiKey, newKeyName, project.id, refetchApiKeys, toast],
  );
  // Auto-create first key if none exist
  useEffect(() => {
    if (!apiKeysLoading && apiKeys?.length === 0) {
      handleCreateApiKey("first-tambo-key");
    }
  }, [apiKeysLoading, apiKeys, handleCreateApiKey]);

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyState({ id, copied: true });
    setTimeout(() => {
      setCopyState({ id: "", copied: false });
    }, 2000);
  };

  const isLoading = apiKeysLoading || isRemovingKey || isGeneratingKey;

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-heading font-semibold">API Keys</h4>
          </div>
          <AnimatePresence mode="wait">
            {!isCreating && !newGeneratedKey && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  size="sm"
                  className="font-sans"
                  onClick={() => setIsCreating(true)}
                  disabled={!!newGeneratedKey}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Key
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {/* Create new key form */}
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className="p-3 border rounded-md space-y-3"
            >
              <motion.h5
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-heading font-medium"
              >
                Create New API Key
              </motion.h5>
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Enter key name"
                  className="w-full font-sans"
                  disabled={isGeneratingKey}
                  autoFocus
                  onKeyDown={handleKeyPress}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-sans"
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
                    className="font-sans"
                    onClick={async () => await handleCreateApiKey()}
                    disabled={isGeneratingKey || !newKeyName.trim()}
                  >
                    {isGeneratingKey ? (
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Creating...
                      </span>
                    ) : (
                      "Create"
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {newGeneratedKey && !showKeyDialog && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="mb-4 p-4 border border-green-200 rounded-md bg-green-50 dark:bg-green-900/20 dark:border-green-900 space-y-2"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-heading font-medium text-green-800 dark:text-green-300"
              >
                New API Key Generated
              </motion.p>
              <motion.div
                className="flex flex-col gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Input
                  type="text"
                  readOnly
                  value={newGeneratedKey}
                  className="font-mono text-sm bg-white dark:bg-gray-800"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="font-sans"
                    onClick={() => {
                      copyToClipboard(newGeneratedKey, "new");
                    }}
                  >
                    {copyState.id === "new" && copyState.copied ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="h-3 w-3" />
                        Copy
                      </span>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-sans"
                    onClick={() => setNewGeneratedKey(null)}
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs font-sans text-green-700 dark:text-green-400"
              >
                Make sure to copy this key now. You won&apos;t be able to see it
                again!
              </motion.p>
            </motion.div>
          )}

          {/* Display API keys */}
          <div className="min-h-[50px]">
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
                    <motion.div
                      key={key.id}
                      className="p-3 rounded-md border space-y-1"
                      custom={index}
                      variants={listItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-heading font-medium">
                            {key.name}
                          </p>
                          <p className="text-xs font-sans text-muted-foreground">
                            {key.lastUsedAt
                              ? `Last used: ${DateTime.fromJSDate(key.lastUsedAt).toFormat("EEE MMM d 'at' h:mma")}`
                              : "Never used"}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <code className="text-xs font-mono px-2 py-1 bg-muted rounded">
                              {key.partiallyHiddenKey?.slice(0, 15)}
                            </code>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : null}
          </div>
        </AnimatePresence>

        <DeleteAlertDialog
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
