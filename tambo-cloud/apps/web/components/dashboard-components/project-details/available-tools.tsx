import { api } from "@/trpc/react";

interface AvailableToolsProps {
  project: { id: string; name: string };
}

export function AvailableTools({ project }: AvailableToolsProps) {
  const {
    data: apps,
    isLoading,
    refetch: refetchApps,
  } = api.tools.listApps.useQuery({
    projectId: project.id,
  });
  const { mutate: enableApp } = api.tools.enableApp.useMutation({
    onSuccess: async () => {
      await refetchApps();
    },
  });
  const { mutate: disableApp } = api.tools.disableApp.useMutation({
    onSuccess: async () => {
      await refetchApps();
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-8 bg-muted rounded" />;
  }

  if (!apps?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No tools available for this project
      </div>
    );
  }

  return (
    <div className="space-y-2 ">
      <h3 className="text-sm font-medium">Available Apps</h3>
      <div className="grid grid-cols-[auto_auto_auto_auto_1fr] grid-rows-[auto] gap-2 max-h-[300px] overflow-y-auto">
        {apps.map((app) => (
          <div
            key={app.appId}
            className="grid grid-cols-subgrid col-span-full bg-muted/50"
          >
            <div className="flex items-center p-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={app.enabled}
                onChange={() =>
                  app.enabled
                    ? disableApp({ projectId: project.id, appId: app.appId })
                    : enableApp({ projectId: project.id, appId: app.appId })
                }
              />
            </div>
            <div className="flex items-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={app.logo}
                alt={app.name}
                className="w-4 h-4 rounded-full"
              />
            </div>
            <div className="flex items-center p-2">
              <span>
                {app.name} {app.no_auth ? "(no auth)" : ""}
              </span>
            </div>
            <div>
              {(app.tags as any as string[])?.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 mr-2 text-xs font-medium rounded-full bg-primary/10"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>

            <div className="flex items-center p-2">
              <span className="text-xs text-muted-foreground">
                {app.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
