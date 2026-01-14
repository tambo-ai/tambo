"use client";

import { DailyMessagesChart } from "@/components/dashboard-components/project-details/daily-messages-chart";
// import { DailyThreadErrorsChart } from "@/components/dashboard-components/project-details/daily-thread-errors-chart";
import { ProjectInfo } from "@/components/dashboard-components/project-details/project-info";
import { ProjectOverviewSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { normalizeCreatedAt } from "@/lib/normalize-created-at";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import Link from "next/link";

interface ProjectOverviewProps {
  projectId: string;
}

export function ProjectOverview({ projectId }: ProjectOverviewProps) {
  const { data: project, isLoading: isLoadingProject } =
    api.project.getUserProjects.useQuery(undefined, {
      select: (projects) => projects.find((p) => p.id === projectId),
    });

  const shouldFetchApiKeys = Boolean(projectId);

  const {
    data: apiKeys,
    isLoading: isLoadingApiKeys,
    isFetching: isFetchingApiKeys,
    isError: isApiKeysError,
    refetch: refetchApiKeys,
  } = api.project.getApiKeys.useQuery(projectId, {
    enabled: shouldFetchApiKeys,
  });

  const noApiKeys =
    shouldFetchApiKeys &&
    !isLoadingApiKeys &&
    !isApiKeysError &&
    (apiKeys?.length ?? 0) === 0;

  const apiKeysLoadError =
    shouldFetchApiKeys && !isLoadingApiKeys && isApiKeysError;

  if (isLoadingProject) {
    return <ProjectOverviewSkeleton />;
  }

  if (!project) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold">Project not found</h2>
        </Card>
      </motion.div>
    );
  }

  // `normalizeCreatedAt` returns an ISO string or `undefined` when invalid.
  const createdAtIso = normalizeCreatedAt(project.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <ProjectInfo project={project} createdAt={createdAtIso} />

      {noApiKeys && (
        <Alert className="bg-card">
          <KeyRound className="h-4 w-4 self-center" />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <AlertTitle>Create an API key</AlertTitle>
              <AlertDescription>
                Generate an API key to connect your app to this project.
              </AlertDescription>
            </div>
            <Button asChild size="sm" className="shrink-0">
              <Link href={`/dashboard/${projectId}/settings`}>
                Create API key
              </Link>
            </Button>
          </div>
        </Alert>
      )}

      {apiKeysLoadError && (
        <Alert className="bg-card">
          <KeyRound className="h-4 w-4 self-center" />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <AlertTitle>Couldn’t load API keys</AlertTitle>
              <AlertDescription>
                We couldn’t load your API keys right now. Try again or open
                settings.
              </AlertDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void refetchApiKeys()}
                disabled={isFetchingApiKeys}
                className="shrink-0"
              >
                {isFetchingApiKeys ? "Retrying..." : "Retry"}
              </Button>
              <Button asChild size="sm" className="shrink-0">
                <Link href={`/dashboard/${projectId}/settings`}>
                  Open settings
                </Link>
              </Button>
            </div>
          </div>
        </Alert>
      )}

      <div>
        <DailyMessagesChart projectIds={[projectId]} days={30} />

        {/* TODO: Add back in when we have error tracking */}
        {/* <DailyThreadErrorsChart projectId={projectId} /> */}
      </div>
    </motion.div>
  );
}
