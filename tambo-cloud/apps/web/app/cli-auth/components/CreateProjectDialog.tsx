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
import { memo, useCallback } from "react";

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
  return key.startsWith("sk-") && key.length >= 51;
};

export const CreateProjectDialog = memo(function CreateProjectDialog({
  state,
  isCreating,
  onStateChange,
  onConfirm,
}: CreateProjectDialogProps) {
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
      if (
        e.key === "Enter" &&
        !isCreating &&
        state.name.trim() &&
        state.providerKey.trim()
      ) {
        e.preventDefault();
        onConfirm();
      }
    },
    [isCreating, state.name, state.providerKey, onConfirm],
  );

  const isFormValid =
    state.name.trim() &&
    state.providerKey.trim() &&
    isValidOpenAIKey(state.providerKey);

  return (
    <Dialog open={state.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter a name for your new project and your OpenAI API key.
          </DialogDescription>
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
              placeholder="My Project"
              className="w-full px-3 py-2 border rounded-md text-sm"
              autoFocus
              name="project-name"
            />
          </div>
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
            <p className="text-xs text-gray-500 mt-1">
              Enter a valid OpenAI API key (starts with sk-). tambo will use
              your API key to make AI calls on your behalf until we implement
              our payment system.
            </p>
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
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
