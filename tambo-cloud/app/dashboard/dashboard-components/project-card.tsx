import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { ProjectResponseDto } from "../types/types";
import { ProjectDetailsDialog } from "./project-details/project-details-dialog";

interface ProjectCardProps {
  project: ProjectResponseDto;
  onProjectDeleted?: () => void;
}

export function ProjectCard({ project, onProjectDeleted }: ProjectCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{typeof project.name === 'string' ? project.name : project.name.projectName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Project ID: {project.id}</p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button onClick={() => setShowDetails(true)}>View Details</Button>
        </CardFooter>
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