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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import React from "react";

// Generic alert state (for single project deletion)
export interface AlertState {
  show: boolean;
  title: string;
  description: string;
  data?: { id: string };
}

// Props for multiple project deletion
interface MultipleProjectsProps {
  mode: "multiple";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProjectIds: string[];
  selectedProjectNames: string[];
  onProjectsDeleted?: () => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

// Props for single project deletion
interface SingleProjectProps {
  mode: "single";
  alertState: AlertState;
  setAlertState: (state: AlertState) => void;
  onConfirm: () => Promise<void>;
}

type DeleteConfirmationDialogProps = MultipleProjectsProps | SingleProjectProps;

export function DeleteConfirmationDialog(props: DeleteConfirmationDialogProps) {
  const { toast } = useToast();

  const deleteMultipleProjects = api.project.removeMultipleProjects.useMutation(
    {
      onSuccess: (result) => {
        toast({
          title: "Success",
          description: `${result.deletedCount} project${result.deletedCount > 1 ? "s" : ""} deleted successfully`,
        });
        if (props.mode === "multiple") {
          props.onProjectsDeleted?.();
          props.onOpenChange(false);
        }
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    },
  );

  // Report loading state to parent
  const isLoading =
    props.mode === "multiple" ? deleteMultipleProjects.isPending : false;

  React.useEffect(() => {
    if (props.mode === "multiple" && props.onLoadingChange) {
      props.onLoadingChange(isLoading);
    }
  }, [isLoading, props]);

  const handleConfirm = async () => {
    if (props.mode === "multiple") {
      if (props.selectedProjectIds.length === 0) return;

      try {
        await deleteMultipleProjects.mutateAsync(props.selectedProjectIds);
      } catch (error) {
        console.error("Failed to delete projects:", error);
      }
    } else {
      await props.onConfirm();
    }
  };

  // Determine dialog state based on mode
  const isOpen = props.mode === "multiple" ? props.open : props.alertState.show;
  const onOpenChange =
    props.mode === "multiple"
      ? props.onOpenChange
      : (open: boolean) =>
          !open && props.setAlertState({ ...props.alertState, show: false });

  // Determine content based on mode
  const getContent = () => {
    if (props.mode === "multiple") {
      const projectCount = props.selectedProjectIds.length;
      const projectNames = props.selectedProjectNames.slice(0, 3).join(", ");
      const hasMoreProjects = props.selectedProjectNames.length > 3;

      return {
        title: "Delete Projects",
        description: (
          <>
            Are you sure you want to delete {projectCount} project
            {projectCount > 1 ? "s" : ""}?
            {projectCount <= 3 ? (
              <span className="block mt-2 font-medium">{projectNames}</span>
            ) : (
              <span className="block mt-2 font-medium">
                {projectNames}
                {hasMoreProjects &&
                  ` and ${props.selectedProjectNames.length - 3} more`}
              </span>
            )}
            <span className="block mt-2 text-destructive">
              This action cannot be undone.
            </span>
          </>
        ),
      };
    } else {
      return {
        title: props.alertState.title,
        description: props.alertState.description,
      };
    }
  };

  const content = getContent();
  const buttonText =
    props.mode === "multiple"
      ? isLoading
        ? "Deleting..."
        : "Delete"
      : "Delete";

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{content.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-foreground">
            {content.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 text-white"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
