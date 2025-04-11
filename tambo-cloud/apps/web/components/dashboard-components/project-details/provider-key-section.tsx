import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Save } from "lucide-react";
import { useState } from "react";
import { ProjectResponseDto } from "../../../app/(authed)/dashboard/types/types";

interface ProviderKeySectionProps {
  project: ProjectResponseDto;
}

export function ProviderKeySection({ project }: ProviderKeySectionProps) {
  const [isEditingProviderKey, setIsEditingProviderKey] = useState(false);
  const [providerKey, setProviderKey] = useState("");
  const { toast } = useToast();

  const {
    data: providerKeys,
    isLoading: isLoading,
    refetch: refetchProviderKeys,
  } = api.project.getProviderKeys.useQuery(project.id);

  const { mutateAsync: addProviderKey, isPending: isUpdating } =
    api.project.addProviderKey.useMutation();

  const handleUpdateProviderKey = async () => {
    if (!providerKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid provider key",
        variant: "destructive",
      });
      return;
    }

    try {
      await addProviderKey({
        projectId: project.id,
        provider: "openai",
        providerKey: providerKey,
      });
      await refetchProviderKeys();
      setIsEditingProviderKey(false);
      setProviderKey("");
      toast({
        title: "Success",
        description: "Provider key updated successfully",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to update provider key",
        variant: "destructive",
      });
    }
  };

  // Get masked key display
  const maskedKey = isLoading
    ? "Loading..."
    : providerKeys?.length
      ? providerKeys[providerKeys.length - 1]?.partiallyHiddenKey
        ? providerKeys[providerKeys.length - 1]?.partiallyHiddenKey?.slice(
            0,
            15,
          )
        : `${providerKeys[providerKeys.length - 1]?.providerKeyEncrypted?.slice(0, 15)}...`
      : "No provider key set";

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-heading font-semibold">
            LLM Providers
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-6">
        {/* OpenAI Provider */}
        <div className="border rounded-md p-3 bg-muted/10">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div>
                <h4 className="text-sm font-heading font-semibold">OpenAI</h4>
                <p className="text-xs font-sans text-muted-foreground">
                  Currently supported
                </p>
              </div>
            </div>
            <AnimatePresence mode="wait">
              {!isEditingProviderKey && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-sans"
                    onClick={() => setIsEditingProviderKey(true)}
                  >
                    <KeyRound className="h-3 w-3 mr-1" />
                    {providerKeys?.length ? "Update Key" : "Add Key"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Container to prevent layout jumps */}
          <div className="min-h-[70px] relative">
            <AnimatePresence mode="wait">
              {isEditingProviderKey ? (
                <motion.div
                  key="edit-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-3"
                >
                  <Input
                    type="text"
                    value={providerKey}
                    onChange={(e) => setProviderKey(e.target.value)}
                    className="w-full font-sans"
                    placeholder="Enter OpenAI API Key"
                    autoFocus
                  />
                  <motion.div
                    className="flex gap-2 justify-end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-sans"
                      onClick={() => {
                        setIsEditingProviderKey(false);
                        setProviderKey("");
                      }}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="font-sans"
                      onClick={handleUpdateProviderKey}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Save className="h-3 w-3" />
                          Save
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="display-key"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {isLoading ? (
                    <motion.div
                      className="h-6 w-48 bg-muted animate-pulse rounded"
                      animate={{ opacity: [0.6, 0.8, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    ></motion.div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-sans text-muted-foreground mr-1">
                          API Key:
                        </p>
                        <code className="px-2 py-1 bg-muted text-sm font-mono rounded-md">
                          {maskedKey}
                        </code>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="border border-dashed rounded-md p-3 bg-muted/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h4 className="text-sm font-heading font-semibold text-muted-foreground">
                  More Providers
                </h4>
                <p className="text-xs font-sans text-muted-foreground">
                  Coming soon...
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
