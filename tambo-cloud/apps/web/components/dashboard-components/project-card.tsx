import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { ProjectResponseDto } from "../../app/dashboard/types/types";
import { ProjectDetailsDialog } from "./project-details/project-details-dialog";

interface ProjectCardProps {
  project: ProjectResponseDto;
  onProjectDeleted?: () => void;
}

export function ProjectCard({ project, onProjectDeleted }: ProjectCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Card
        className="hover:bg-accent transition-colors cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <CardHeader>
          <CardTitle className="text-md font-semibold">
            {project.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Project ID: {project.id}
          </p>
        </CardContent>
      </Card>

      <ProjectDetailsDialog
        project={project}
        open={showDetails}
        onOpenChange={setShowDetails}
        onProjectDeleted={onProjectDeleted}
      />
    </>
  );
}
