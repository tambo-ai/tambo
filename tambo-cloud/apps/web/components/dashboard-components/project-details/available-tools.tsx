import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ComposioAuthMode } from "@/lib/composio-utils";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { Check, ChevronsUpDown, Key, Trash2 } from "lucide-react";
import * as React from "react";

interface AvailableToolsProps {
  project: { id: string; name: string };
}

export function AvailableTools({ project }: AvailableToolsProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedAppId, setSelectedAppId] = React.useState("");

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
      setSelectedAppId(""); // Reset combobox after enabling
      setOpen(false);
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

  const enabledApps = apps.filter((app) => app.enabled);
  const disabledApps = apps.filter((app) => !app.enabled);

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm font-heading font-semibold">
          Available Apps
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Combobox for disabled apps */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedAppId
                  ? disabledApps.find((app) => app.appId === selectedAppId)
                      ?.name
                  : "Add an app..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 max-w-prose">
              <Command>
                <CommandInput placeholder="Search apps..." />
                <CommandList>
                  <CommandEmpty>No apps found.</CommandEmpty>
                  <CommandGroup>
                    {disabledApps.map((app) => (
                      <CommandItem
                        key={app.appId}
                        value={app.name}
                        keywords={app.tags}
                        onSelect={(currentValue) => {
                          // kind of a hack since we want appId, but the combobox is using name
                          const appId = apps.find(
                            (a) => a.name === currentValue,
                          )?.appId;
                          if (appId) {
                            enableApp({
                              projectId: project.id,
                              appId,
                            });
                          }
                        }}
                        className="flex flex-col items-start py-3"
                      >
                        <div className="flex items-center w-full">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={app.logo}
                              alt={app.name}
                              className="w-4 h-4 rounded-full"
                            />
                            {app.name}
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedAppId === app.appId
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </div>
                        <div className="flex flex-col gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {app.description}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {app.auth_schemes?.map((scheme, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-secondary/50 text-secondary-foreground"
                              >
                                {getAuthModeName(scheme.mode)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* List of enabled apps */}
          <div className="space-y-2">
            {enabledApps.map((app) => (
              <div
                key={app.appId}
                className="flex items-center justify-between gap-4 p-2 bg-muted/50 rounded-md"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={app.logo}
                      alt={app.name}
                      className="w-4 h-4 rounded-full"
                    />
                    <span>{app.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {app.tags &&
                      (app.tags as string[]).map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    {app.auth_schemes?.map((scheme, i) => (
                      <span
                        key={`auth-${i}`}
                        className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-secondary/50 text-secondary-foreground"
                      >
                        {getAuthModeName(scheme.mode)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!app.no_auth && (
                    <Button variant="outline" size="sm">
                      <Key className="h-4 w-4" />
                      <span className="sr-only">Authenticate</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      disableApp({
                        projectId: project.id,
                        appId: app.appId,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getAuthModeName(mode: ComposioAuthMode): string {
  switch (mode) {
    case "API_KEY":
      return "API Key";
    case "OAUTH2":
      return "OAuth 2.0";
    case "BEARER_TOKEN":
      return "Bearer Token";
    case "BASIC":
      return "Basic Auth";
    default:
      return mode;
  }
}
