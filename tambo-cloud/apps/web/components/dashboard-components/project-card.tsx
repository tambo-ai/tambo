import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProjectResponseDto } from "../../app/dashboard/types/types";
import { CopyButton } from "../copy-button";
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
          <CardTitle className="text-md font-semibold flex justify-between items-center">
            {project.name}
            <Link
              href={`/dashboard/${project.id}`}
              className="hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Project ID: {project.id}
          </p>
          <CopyButton clipboardValue={project.id} />
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
