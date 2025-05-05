import { ProjectPage } from "@/components/dashboard-components/ProjectPage";

export const metadata = {
  title: "Project Dashboard",
  description:
    "View and manage your project settings, API keys, and configurations",
};

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function MainProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  return <ProjectPage projectId={projectId} />;
}
