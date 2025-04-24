import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronUp } from "lucide-react";
import { memo, useCallback, useState } from "react";

type CreateProjectDialogState = Readonly<{
  isOpen: boolean;
  name: string;
  providerKey: string;
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
              Start with 500 free messages, or add your own LLM Provider Key.
              You can add one at any time in the project settings.
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
