import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClipboard } from "@/hooks/use-clipboard";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { ArrowLeft, Check, Copy, Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";

interface KeyStepProps {
  apiKey: string;
  countdown: number;
  onBack: () => void;
  onGenerate: () => Promise<void>;
  isGenerating?: boolean;
  error?: unknown;
  projectName?: string;
  projectId: string;
  onNavigateToProject?: () => void;
}

/**
 * KeyStep Component
 *
 * Handles API key generation:
 * - Displays newly generated keys with copy functionality
 * - Shows countdown for auto-close after key generation
 */
export function KeyStep({
  apiKey,
  countdown,
  onBack,
  onGenerate,
  isGenerating,
  error: propError,
  projectName,
  projectId,
  onNavigateToProject,
}: KeyStepProps) {
  const { toast } = useToast();
  const [isCopied, copy] = useClipboard(apiKey);
  const providerKeysQuery = api.project.getProviderKeys.useQuery(projectId, {
    staleTime: 30000,
  });

  // Use either passed error or query error
  const error = propError || providerKeysQuery.error;

  // Automatically generate API key on first render if not already generating
  useEffect(() => {
    if (!apiKey && !isGenerating && !error) {
      onGenerate().catch(console.error);
    }
  }, [apiKey, isGenerating, error, onGenerate]); // Include all dependencies used inside the effect

  const handleCopy = useCallback(async () => {
    try {
      await copy();
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
  }, [copy, toast]);

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
            <ArrowLeft className="mr-2" size={16} />
            Back to Projects
          </Button>
        </div>

        <div className="space-y-1">
          <h2 className="text-md font-medium">
            Your new API key has been generated
          </h2>
        </div>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Paste this key into your terminal.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 gap-1"
            >
              {isCopied ? (
                <Check className="mr-1 text-green-500" size={14} />
              ) : (
                <Copy className="mr-1" size={14} />
              )}
              {isCopied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="font-mono text-sm bg-muted p-3 rounded border border-border break-all">
            {apiKey}
          </p>
        </Card>
        <Alert
          variant="destructive"
          className="text-left bg-red-500/10 border-none"
        >
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Make sure to copy your API key now. You won&apos;t be able to see it
            again. This window will close automatically in {countdown} seconds.
          </AlertDescription>
        </Alert>

        {onNavigateToProject && (
          <Button
            variant="default"
            size="lg"
            className="w-full mt-4"
            onClick={onNavigateToProject}
          >
            Continue to Project
          </Button>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error generating the API key. Please try again.
          </AlertDescription>
        </Alert>
        <Button onClick={onGenerate} disabled={isGenerating}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" size={12} />
        <span className="ml-2">
          Generating API key{projectName ? ` for ${projectName}` : ""}...
        </span>
      </div>
    </div>
  );
}
