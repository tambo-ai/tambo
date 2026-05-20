"use client";

import { AgentSettings } from "@/components/dashboard-components/agent-settings";
import { useParams } from "next/navigation";

export default function AgentPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return <AgentSettings projectId={projectId} />;
}
