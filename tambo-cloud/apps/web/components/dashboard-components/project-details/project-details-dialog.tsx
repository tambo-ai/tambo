import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { ProjectResponseDto } from "../../../app/dashboard/types/types";
import { APIKeyList } from "./api-key-list";
import { DeleteAlertDialog } from "./delete-alert-dialog";
import { ProjectInfo } from "./project-info";
import { ProviderKeySection } from "./provider-key-section";

interface ProjectDetailsDialogProps {
  project: ProjectResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectDeleted?: () => void;
}

export interface AlertState {
  show: boolean;
  title: string;
  description: string;
  data?: { id: string };
}

export function ProjectDetailsDialog({
  project,
  open,
  onOpenChange,
  onProjectDeleted,
}: ProjectDetailsDialogProps) {
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
  });
  const { toast } = useToast();

  const { mutateAsync: deleteProject } =
    api.project.removeProject.useMutation();

  const handleDeleteProject = async () => {
    try {
      await deleteProject(project.id);
      onOpenChange(false);
      onProjectDeleted?.();
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setAlertState({
        show: false,
        title: "",
        description: "",
        data: undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <ProjectInfo project={project} />
            <ProviderKeySection project={project} />
            <APIKeyList project={project} />
          </div>
        </div>

        <div className="pt-2 mt-2">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
            onClick={() =>
              setAlertState({
                show: true,
                title: "Delete Project",
                description:
                  "Are you sure you want to delete this project? This action cannot be undone.",
              })
            }
          >
            <Trash2 className="h-4 w-4" />
            delete project
          </Button>
        </div>

        <DeleteAlertDialog
          alertState={alertState}
          setAlertState={setAlertState}
          onConfirm={handleDeleteProject}
        />
      </DialogContent>
    </Dialog>
  );
}
