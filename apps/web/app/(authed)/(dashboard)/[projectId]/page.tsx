import { ProjectOverview } from "@/components/dashboard-components/project-overview";
import { env } from "@/lib/env";
import { getDb, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import { Metadata } from "next";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const db = getDb(env.DATABASE_URL);
  const project = await db.query.projects.findFirst({
    where: eq(schema.projects.id, projectId),
    columns: {
      name: true,
    },
  });
  return {
    title: `${project?.name} | Project Dashboard`,
    description:
      "View and manage your project settings, API keys, and configurations",
  };
}

export default async function MainProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  return <ProjectOverview projectId={projectId} />;
}
