import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { useCallback, useState } from "react";

type ApiKey = Readonly<{
  id: string;
  name: string;
  partiallyHiddenKey: string | null;
  createdAt: Date;
}>;

interface KeyStepProps {
  apiKey: string;
  countdown: number;
  existingKeys: readonly ApiKey[] | undefined;
  isLoading: boolean;
  error: unknown;
  isGenerating: boolean;
  onBack: () => void;
  onGenerate: () => Promise<void>;
  onDeleteClick: (keyId: string, keyName: string) => void;
  providerKey: string | null;
  onProviderKeyChange: (key: string) => Promise<void>;
  projectName: string;
}

/**
 * KeyStep Component
 *
 * Handles the display and management of API keys:
 * - Shows existing API keys with options to delete
 * - Provides interface to generate new keys
 * - Displays newly generated keys with copy functionality
 * - Shows countdown for auto-close after key generation
 */
export function KeyStep({
  apiKey,
  countdown,
  existingKeys,
  isLoading,
  error,
  isGenerating,
  onBack,
  onGenerate,
  onDeleteClick,
  providerKey,
  onProviderKeyChange,
  projectName,
}: KeyStepProps) {
  const { toast } = useToast();
  const [isEditingProviderKey, setIsEditingProviderKey] = useState(false);
  const [newProviderKey, setNewProviderKey] = useState("");

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

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast({
        title: "Error",
        description: "Failed to copy API key to clipboard",
        variant: "destructive",
      });
    }
  }, [apiKey, toast]);

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
              onClick={handleCopy}
              className="h-8"
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
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Copy
            </Button>
          </div>
          <p className="font-mono text-sm bg-white p-3 rounded border break-all">
            {apiKey}
          </p>
        </Card>
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Make sure to copy your API key now. You won&apos;t be able to see it
            again. This window will close automatically in {countdown} seconds.
          </AlertDescription>
        </Alert>
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

      <Card className="p-4 bg-muted space-y-4">
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
        {isEditingProviderKey ? (
          <input
            type="password"
            value={newProviderKey}
            onChange={(e) => setNewProviderKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
            className="w-full px-3 py-2 text-sm border rounded-md"
            autoFocus
          />
        ) : (
          <p className="text-sm text-muted-foreground font-mono break-all">
            {providerKey
              ? `${providerKey.slice(0, 4)}${"*".repeat(20)}`
              : "No API key set"}
          </p>
        )}
      </Card>

      {isLoading ? (
        <div className="py-4 flex justify-center">
          <Icons.spinner className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load existing API keys</AlertDescription>
        </Alert>
      ) : existingKeys && existingKeys.length > 0 ? (
        <div className="space-y-3">
          <div className="text-sm font-medium">Existing tambo API Keys</div>
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
            {existingKeys.map((key) => (
              <Card
                key={key.id}
                className="p-3 bg-muted flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{key.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {key.partiallyHiddenKey}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created{" "}
                    {new Date(key.createdAt).toLocaleDateString("en-US", {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteClick(key.id, key.name)}
                  className="h-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  <span className="sr-only">Delete API key</span>
                </Button>
              </Card>
            ))}
          </div>
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Generate New Key
              </span>
            </div>
          </div>
        </div>
      ) : (
        <Card className="py-8 text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any API keys yet
            </p>
          </div>
        </Card>
      )}

      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02]"
      >
        {isGenerating ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
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
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            Generate New API Key
          </>
        )}
      </Button>
    </div>
  );
}
