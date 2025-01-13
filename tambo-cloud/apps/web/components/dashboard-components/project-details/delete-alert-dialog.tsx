import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertState } from "./project-details-dialog";

interface DeleteAlertDialogProps {
  alertState: AlertState;
  setAlertState: (state: AlertState) => void;
  onConfirm: () => Promise<void>;
}

export function DeleteAlertDialog({
  alertState,
  setAlertState,
  onConfirm,
}: DeleteAlertDialogProps) {
  return (
    <AlertDialog
      open={alertState.show}
      onOpenChange={(open) =>
        !open && setAlertState({ ...alertState, show: false })
      }
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{alertState.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {alertState.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
