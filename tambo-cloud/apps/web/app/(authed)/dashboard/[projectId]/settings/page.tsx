"use client";

import { ProjectSettings } from "@/components/dashboard-components/project-settings";
import { useParams } from "next/navigation";

export default function SettingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return <ProjectSettings projectId={projectId} />;
}
