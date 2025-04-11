import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Copy, Plus, Trash2 } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";

type ApiKey = Readonly<{
  id: string;
  name: string;
  partiallyHiddenKey: string | null;
  createdAt: Date;
}>;

interface CliApiKeyListProps {
  projectId: string;
  projectName: string;
  existingKeys: readonly ApiKey[] | undefined;
  isLoading: boolean;
  isGenerating?: boolean;
  error: unknown;
  apiKey?: string;
  countdown?: number;
  onBack: () => void;
  onGenerate: (keyName: string) => Promise<void>;
  onDeleteKey: (keyId: string, keyName: string) => void;
  providerKey: string | null;
  onProviderKeyChange: (key: string) => Promise<void>;
}

const listItemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

export function CliApiKeyList({
  projectName,
  existingKeys,
  isLoading,
  isGenerating,
  error,
  apiKey,
  countdown,
  onBack,
  onGenerate,
  onDeleteKey,
  providerKey,
  onProviderKeyChange,
}: CliApiKeyListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [isEditingProviderKey, setIsEditingProviderKey] = useState(false);
  const [newProviderKey, setNewProviderKey] = useState("");
  const [copyState, setCopyState] = useState<{ id: string; copied: boolean }>({
    id: "",
    copied: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleProviderKeySave = async () => {
    try {
      await onProviderKeyChange(newProviderKey);
      setIsEditingProviderKey(false);
      setNewProviderKey("");
      toast({
        title: "Success",
        description: "OpenAI API key updated successfully",
      });
    } catch (error) {
      console.error("Failed to update OpenAI API key:", error);
      toast({
        title: "Error",
        description: "Failed to update OpenAI API key",
        variant: "destructive",
      });
    }
  };

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
      await onGenerate(newKeyName);
      setNewKeyName("");
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create API key:", error);
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

  if (apiKey) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Button>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-medium">{projectName}</h2>
          <p className="text-sm text-muted-foreground">
            Manage API keys for this project
          </p>
        </div>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Your New API Key</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => copyToClipboard(apiKey, "new-key")}
            >
              {copyState.id === "new-key" && copyState.copied ? (
                <span className="flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </span>
              ) : (
                <span className="flex items-center">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </span>
              )}
            </Button>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="font-mono text-sm bg-white p-3 rounded border break-all"
          >
            {apiKey}
          </motion.p>
        </Card>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Make sure to copy your API key now. You won&apos;t be able to see
              it again. This window will close automatically in {countdown}{" "}
              seconds.
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </Button>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-medium">{projectName}</h2>
        <p className="text-sm text-muted-foreground">
          Manage API keys for this project
        </p>
      </div>

      {/* OpenAI Provider Key Section */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">OpenAI API Key</p>
          {isEditingProviderKey ? (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleProviderKeySave}
                className="h-8"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditingProviderKey(false);
                  setNewProviderKey("");
                }}
                className="h-8"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingProviderKey(true)}
              className="h-8"
            >
              Edit
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {isEditingProviderKey ? (
            <motion.div
              key="edit-form"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Input
                type="password"
                value={newProviderKey}
                onChange={(e) => setNewProviderKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
                className="w-full font-sans"
                autoFocus
              />
            </motion.div>
          ) : (
            <motion.div
              key="display-key"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-sm bg-white p-3 rounded border overflow-hidden"
            >
              {providerKey
                ? "sk-••••••••••••••••••••••••••••••••"
                : "No key set"}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* API Keys Section */}
      <Card className="border rounded-md overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-heading font-semibold">API Keys</h4>
            </div>
            <AnimatePresence>
              {!isCreating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCreating(true)}
                    disabled={isCreating}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Key
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {/* Create new key form - simplify animations */}
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-3 border rounded-md space-y-3"
              >
                <h5 className="text-sm font-heading font-medium">
                  Create New API Key
                </h5>
                <div className="space-y-3">
                  <Input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Enter key name"
                    className="w-full font-sans"
                    autoFocus
                    onKeyDown={handleKeyPress}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setNewKeyName("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCreateApiKey}
                      disabled={!newKeyName.trim() || isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <span className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Generating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* API key list */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="h-5 w-5 rounded-full border-2 border-current border-t-transparent"
                />
              </div>
            ) : existingKeys && existingKeys.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {existingKeys.map((key, index) => (
                  <motion.div
                    key={key.id}
                    className="flex items-center justify-between p-2 border rounded-md"
                    variants={listItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={index}
                    layoutId={key.id}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{key.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created:{" "}
                        {DateTime.fromJSDate(key.createdAt).toLocaleString(
                          DateTime.DATETIME_SHORT,
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDeleteKey(key.id, key.name)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4"
              >
                <p className="text-sm text-muted-foreground">
                  No API keys found. Create one to get started.
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
