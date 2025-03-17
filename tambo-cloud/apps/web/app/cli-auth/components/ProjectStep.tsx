import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { memo } from "react";

type Project = Readonly<{
  id: string;
  name: string;
}>;

interface ProjectStepProps {
  projects: readonly Project[] | undefined;
  isLoading: boolean;
  error: unknown;
  onProjectSelect: (projectId: string) => void;
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
  projects,
  isLoading,
  error,
  onProjectSelect,
  onCreateClick,
}: ProjectStepProps) {
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

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Select an existing project or create a new one
        </p>
      </div>
      <div className="space-y-2">
        {projects?.map((project) => (
          <Button
            key={project.id}
            variant="outline"
            onClick={() => onProjectSelect(project.id)}
            className="w-full h-12 justify-start text-base font-medium transition-all hover:scale-[1.02]"
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
              <path d="M3 3h18v18H3z" />
              <path d="M15 9h.01" />
              <path d="M9 15h.01" />
            </svg>
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
          <path d="M12 5v14M5 12h14" />
        </svg>
        Create New Project
      </Button>
    </div>
  );
});
