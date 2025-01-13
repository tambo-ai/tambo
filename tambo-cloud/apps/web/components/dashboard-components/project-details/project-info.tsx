import { ProjectResponseDto } from "../../../app/dashboard/types/types";

interface ProjectInfoProps {
  project: ProjectResponseDto;
}

export function ProjectInfo({ project }: ProjectInfoProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold">Project ID</h4>
      <p className="text-sm text-muted-foreground">{project.id}</p>
    </div>
  );
}
