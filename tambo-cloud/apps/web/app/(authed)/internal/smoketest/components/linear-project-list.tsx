import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ReactNode } from "react";

interface LinearProjectInfo {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  state: string;
  startDate?: string;
  targetDate?: string;
  issueCount?: number;
  completedIssueCount?: number;
  teamIds?: string[];
}

interface LinearProjectListProps {
  readonly projects?: LinearProjectInfo[];
  readonly onProjectClick?: (projectId: string) => void;
}

export const LinearProjectList = ({
  projects,
  onProjectClick,
}: LinearProjectListProps): ReactNode => {
  if (!projects) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">Loading projects...</p>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">No projects found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => onProjectClick?.(project.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {project.icon && (
                  <span
                    className="text-xl"
                    role="img"
                    aria-label="project icon"
                  >
                    {project.icon}
                  </span>
                )}
                <h3 className="text-lg font-medium">{project.name}</h3>
                <Badge
                  style={{
                    backgroundColor: project.color
                      ? `${project.color}20`
                      : undefined,
                    color: project.color,
                    borderColor: project.color,
                  }}
                >
                  {project.state}
                </Badge>
              </div>

              {project.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {project.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Progress</p>
                  <p>
                    {project.completedIssueCount ?? 0} /{" "}
                    {project.issueCount ?? 0} issues
                  </p>
                </div>
                {project.startDate && (
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p>{new Date(project.startDate).toLocaleDateString()}</p>
                  </div>
                )}
                {project.targetDate && (
                  <div>
                    <p className="text-muted-foreground">Target Date</p>
                    <p>{new Date(project.targetDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
