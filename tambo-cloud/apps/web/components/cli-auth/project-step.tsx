import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Plus } from "lucide-react";
import { memo } from "react";

interface ProjectStepProps {
  onProjectSelect: (projectId: string, projectName: string) => void;
  onCreateClick: () => void;
}

/**
 * ProjectStep Component
 *
 * Displays and manages project selection:
 * - Lists existing projects
 * - Handles loading and error states
 * - Provides option to create new project
 */
export const ProjectStep = memo(function ProjectStep({
  onProjectSelect,
  onCreateClick,
}: ProjectStepProps) {
  // Fetch projects - parent component handles session checking
  const projectsQuery = api.project.getUserProjects.useQuery();

  const isLoading = projectsQuery.isLoading;
  const error = projectsQuery.error;
  const projects = projectsQuery.data;

  if (isLoading) {
    return (
      <div className="py-8 flex flex-col items-center gap-4">
        <Icons.spinner className="h-6 w-6 animate-spin" />
        <p className="text-sm text-muted-foreground">
          Loading your projects...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center space-y-4">
        <p className="text-sm text-red-500">Failed to load projects</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="text-sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Handle empty state
  if (!projects?.length) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">
            Get started by creating your first project.
          </p>
        </div>
        <Button
          variant="default"
          onClick={onCreateClick}
          className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02]"
        >
          <Plus className="mr-2" size={16} />
          Create New Project
        </Button>
      </div>
    );
  }

  // Show existing projects list
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Select an existing project or create a new one
        </p>
      </div>
      <div className="space-y-2">
        {projects.map((project) => (
          <Button
            key={project.id}
            variant="outline"
            onClick={() => onProjectSelect(project.id, project.name)}
            className="w-full h-12 justify-start text-base font-medium transition-all hover:scale-[1.02]"
          >
            {project.name}
          </Button>
        ))}
      </div>
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>
      <Button
        variant="default"
        onClick={onCreateClick}
        className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02]"
      >
        <Plus className="mr-2" size={16} />
        Create New Project
      </Button>
    </div>
  );
});
