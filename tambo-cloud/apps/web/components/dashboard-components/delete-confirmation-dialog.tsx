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

// Helper function to format project names for display
// Note: compute the remainder from the names array length to ensure
// the UI matches what is actually rendered.
const formatProjectNames = (projectNames: string[]): string => {
  const count = projectNames.length;
  if (count <= 3) {
    return projectNames.join(", ");
  }

  const firstThree = projectNames.slice(0, 3).join(", ");
  const remainingCount = count - 3;
  return `${firstThree} and ${remainingCount} more`;
};

// Helper function to generate multiple projects content
const getMultipleProjectsContent = (props: MultipleProjectsProps) => {
  const projectCount = props.selectedProjectIds.length;

  return {
    title: "Delete Projects",
    description: (
      <>
        Are you sure you want to delete {projectCount} project
        {projectCount > 1 ? "s" : ""}?
        <span className="block mt-2 font-medium">
          {formatProjectNames(props.selectedProjectNames)}
        </span>
        <span className="block mt-2 text-destructive">
          This action cannot be undone.
        </span>
      </>
    ),
  };
};

// Helper function to generate single project content
const getSingleProjectContent = (props: SingleProjectProps) => {
  return {
    title: props.alertState.title,
    description: props.alertState.description,
  };
};

// Helper function to get dialog content based on mode
const getDialogContent = (props: DeleteConfirmationDialogProps) => {
  if (props.mode === "multiple") {
    return getMultipleProjectsContent(props);
  }
  return getSingleProjectContent(props);
};

// Helper function to get button text
const getButtonText = (
  props: DeleteConfirmationDialogProps,
  isLoading: boolean,
): string => {
  if (props.mode === "multiple") {
    return isLoading ? "Deleting..." : "Delete";
  }
  return "Delete";
};

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

  const content = getDialogContent(props);
  const buttonText = getButtonText(props, isLoading);

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
