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

type DeleteDialogState = Readonly<{
  isOpen: boolean;
  keyId: string;
  keyName: string;
}>;

interface DeleteKeyDialogProps {
  state: Readonly<DeleteDialogState>;
  isDeleting: boolean;
  onStateChange: (state: DeleteDialogState) => void;
  onConfirm: (keyId: string) => Promise<void>;
}

/**
 * DeleteKeyDialog Component
 *
 * Dialog for confirming API key deletion:
 * - Shows key name for confirmation
 * - Handles loading state during deletion
 * - Provides cancel option
 */
export const DeleteKeyDialog = memo(function DeleteKeyDialog({
  state,
  isDeleting,
  onStateChange,
  onConfirm,
}: DeleteKeyDialogProps) {
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      onStateChange({ isOpen, keyId: "", keyName: "" });
    },
    [onStateChange],
  );

  const handleCancel = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  const handleConfirm = useCallback(async () => {
    if (state.keyId) {
      await onConfirm(state.keyId);
    }
  }, [state.keyId, onConfirm]);

  return (
    <Dialog open={state.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the API key &quot;
            {state.keyName}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
