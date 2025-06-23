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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
  ComposioAuthMode,
  ComposioConnectorConfig,
} from "@tambo-ai-cloud/core";
import { Check, ChevronsUpDown, Key, Trash2 } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { z } from "zod";

export const ToolAppSchema = z.object({
  appId: z.string().describe("The unique identifier for the tool/app."),
  name: z.string().describe("The display name of the tool/app."),
  logo: z.string().describe("The URL to the logo/icon of the tool/app."),
  tags: z
    .array(z.string())
    .optional()
    .describe("Tags/categories for the tool."),
  auth_schemes: z
    .array(z.custom<ComposioConnectorConfig>())
    .optional()
    .describe("Available authentication schemes for the tool."),
  no_auth: z
    .boolean()
    .optional()
    .describe("Whether the tool requires authentication."),
  description: z
    .string()
    .optional()
    .describe("Description text for the tool/app."),
  enabled: z
    .boolean()
    .optional()
    .describe("Whether the tool is enabled for the project."),
});

export const ToolAuthDialogPropsSchema = z.object({
  open: z.boolean().describe("Whether the authentication dialog is open."),
  onOpenChange: z
    .function()
    .args(z.boolean())
    .returns(z.void())
    .describe("Function called when the dialog open state changes."),
  currentScheme: z
    .custom<ComposioConnectorConfig>()
    .optional()
    .describe("Currently selected authentication scheme."),
  availableSchemes: z
    .array(z.custom<ComposioConnectorConfig>())
    .optional()
    .describe("List of available authentication schemes for the tool."),
  projectId: z.string().describe("The ID of the project."),
  appId: z.string().describe("The ID of the app/tool being authenticated."),
  appName: z
    .string()
    .describe("The display name of the app/tool being authenticated."),
});

export const EnabledAppRowPropsSchema = z.object({
  app: ToolAppSchema.describe("The app data to display."),
  projectId: z.string().describe("The ID of the project."),
  onDisable: z
    .function()
    .args(z.string())
    .returns(z.void())
    .describe("Function called when the app is disabled."),
  onUpdateAuth: z
    .function()
    .args(
      z.string().describe("App ID"),
      z.custom<ComposioAuthMode>().describe("Authentication scheme"),
      z.record(z.string()).describe("Authentication values"),
    )
    .returns(z.promise(z.void()))
    .describe("Function called when authentication is updated."),
});

export const AvailableToolsProps = z.object({
  project: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .describe("The project to fetch tools for."),
});

interface AvailableToolsProps {
  project: { id: string; name: string };
}

interface EnabledAppRowProps {
  app: {
    appId: string;
    name: string;
    logo: string;
    tags?: string[];
    auth_schemes?: ComposioConnectorConfig[];
    no_auth?: boolean;
    description?: string;
    enabled?: boolean;
  };
  projectId: string;
  onDisable: (appId: string) => void;
  onUpdateAuth: (
    appId: string,
    schemeId: ComposioAuthMode,
    values: Record<string, string>,
  ) => Promise<void>;
}

interface ToolAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentScheme?: ComposioConnectorConfig;
  availableSchemes?: ComposioConnectorConfig[];
  projectId: string;
  appId: string;
  appName: string;
}

export function ToolAuthDialog({
  open,
  onOpenChange,
  availableSchemes,
  projectId,
  appId,
  appName,
}: ToolAuthDialogProps) {
  const [selectedScheme, setSelectedScheme] = useState<
    ComposioConnectorConfig | undefined
  >(availableSchemes?.[0]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentAuthStatus, setCurrentAuthStatus] = useState<string | null>();
  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedScheme(availableSchemes?.[0]);
      setFieldValues({});
      setIsAuthenticating(false);
      setCurrentAuthStatus(undefined);
    }
  }, [availableSchemes, open]);

  const {
    mutateAsync: updateAuth,
    isPending: isUpdating,
    error: updateError,
  } = api.tools.updateComposioAuth.useMutation({
    onSuccess: async () => await refetchCurrentAuth(),
  });

  // Fetch current auth values when dialog opens
  const {
    data: currentAuth,
    isFetching: isFetchingCurrentAuth,
    error: fetchError,
    refetch: refetchCurrentAuth,
  } = api.tools.getComposioAuth.useQuery(
    {
      projectId,
      appId,
      contextKey: null,
    },
    {
      enabled: open,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  );

  const toolProviderId = currentAuth?.toolProviderId;
  const redirectUrl = currentAuth?.redirectUrl;

  const showAuthenticateButton =
    !!redirectUrl && currentAuthStatus === "INITIATED";

  const { data: connectedAccountStatus } =
    api.tools.checkComposioConnectedAccountStatus.useQuery(
      {
        projectId,
        toolProviderId: toolProviderId ?? "",
        contextKey: null,
      },
      {
        enabled: open && !!toolProviderId && showAuthenticateButton,
        refetchInterval: 1000,
      },
    );

  useEffect(() => {
    setCurrentAuthStatus(currentAuth?.status);
  }, [currentAuth]);
  useEffect(() => {
    setCurrentAuthStatus(connectedAccountStatus?.status);
  }, [connectedAccountStatus]);

  // If the user has initiated any aspect of the auth, and then the auth becomes active, close the dialog
  useEffect(() => {
    if (isAuthenticating && currentAuthStatus === "ACTIVE") {
      onOpenChange(false);
    }
  }, [currentAuthStatus, isAuthenticating, onOpenChange]);

  // When the diaog opens and we have loaded the current auth, initialize the dialog
  useEffect(() => {
    if (open && currentAuth && !isFetchingCurrentAuth) {
      setSelectedScheme(
        availableSchemes?.find((s) => s.mode === currentAuth.mode) ??
          availableSchemes?.[0],
      );
      setFieldValues(currentAuth.fields);
    }
  }, [availableSchemes, currentAuth, isFetchingCurrentAuth, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedScheme?.mode) {
      setIsAuthenticating(true);
      setCurrentAuthStatus(null);
      await updateAuth({
        projectId,
        appId,
        contextKey: null,
        authMode: selectedScheme.mode,
        authFields: fieldValues,
      });

      await refetchCurrentAuth();
    }
  };

  const formDisabled =
    isFetchingCurrentAuth || isUpdating || showAuthenticateButton;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{appName} - Authentication Method</DialogTitle>
          <DialogDescription>
            {showAuthenticateButton
              ? "Please authenticate with the service. This dialog will close automatically once authenticated."
              : availableSchemes && availableSchemes.length > 1
                ? "Select an authentication method and provide the required details."
                : "Provide the required authentication details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          {(fetchError || updateError) && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {fetchError?.message ||
                updateError?.message ||
                "An error occurred"}
            </div>
          )}

          {availableSchemes &&
            availableSchemes.length > 1 &&
            !showAuthenticateButton && (
              <div className="space-y-4">
                <Label>Authentication Method</Label>
                <Select
                  value={selectedScheme?.mode}
                  onValueChange={(value: ComposioAuthMode) => {
                    const scheme = availableSchemes.find(
                      (s) => s.mode === value,
                    );
                    setSelectedScheme(scheme);
                    setFieldValues({});
                  }}
                  disabled={formDisabled}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {selectedScheme
                        ? getAuthModeName(selectedScheme.mode)
                        : "Select a method"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableSchemes.map((scheme) => (
                      <SelectItem key={scheme.mode} value={scheme.mode}>
                        {getAuthModeName(scheme.mode)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          {selectedScheme && selectedScheme.fields?.length === 0 && (
            <div className="text-sm text-muted-foreground space-y-2 py-2">
              This authentication method doesn&apos;t require any additional
              configuration. You can proceed by clicking Save.
            </div>
          )}

          {selectedScheme?.fields?.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.display_name}</Label>
              <Input
                id={field.name}
                type={field.is_secret ? "password" : "text"}
                value={fieldValues[field.name] || ""}
                onChange={(e) =>
                  setFieldValues((prev) => ({
                    ...prev,
                    [field.name]: e.target.value,
                  }))
                }
                required={field.required}
                disabled={formDisabled}
              />
              {field.description && (
                <p className="text-xs text-muted-foreground whitespace-pre-line">
                  {field.description}
                </p>
              )}
            </div>
          ))}

          <DialogFooter>
            {showAuthenticateButton ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  Click the button below to authenticate with the service
                </p>
                <Button type="button" variant="outline" asChild>
                  <a
                    href={redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Authenticate
                  </a>
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={!selectedScheme || formDisabled}>
                Save
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EnabledAppRow({ app, projectId, onDisable }: EnabledAppRowProps) {
  const [authDialogOpen, setAuthDialogOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4 p-2 bg-muted/50 rounded-md">
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
              app.tags.map((tag, i) => (
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
          {!app.no_auth && app.auth_schemes && app.auth_schemes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAuthDialogOpen(true)}
            >
              <Key className="h-4 w-4" />
              <span className="sr-only">Authenticate</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisable(app.appId)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      </div>

      <ToolAuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        availableSchemes={app.auth_schemes}
        projectId={projectId}
        appId={app.appId}
        appName={app.name}
      />
    </div>
  );
}

export function AvailableTools({ project }: AvailableToolsProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedAppId, setSelectedAppId] = React.useState("");

  const {
    data: apps,
    isLoading,
    refetch: refetchApps,
  } = api.tools.listApps.useQuery(
    {
      projectId: project?.id || "",
    },
    {
      enabled: !!project?.id,
    },
  );

  const { mutateAsync: enableApp, error: enableError } =
    api.tools.enableApp.useMutation({
      onSuccess: async () => {
        await refetchApps();
        setSelectedAppId(""); // Reset combobox after enabling
        setOpen(false);
      },
    });

  const { mutateAsync: disableApp, error: disableError } =
    api.tools.disableApp.useMutation({
      onSuccess: async () => {
        await refetchApps();
      },
    });

  const handleUpdateAuth = async (
    appId: string,
    schemeId: ComposioAuthMode,
    values: Record<string, string>,
  ) => {
    // This function is no longer needed since we moved the mutation
    // but we'll keep it as a no-op to avoid breaking the interface
  };

  if (!project) {
    return (
      <Card className="border rounded-md overflow-hidden">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">No project selected</p>
        </CardContent>
      </Card>
    );
  }

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
          {enableError && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              Failed to enable app: {enableError.message}
            </div>
          )}

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
                        onSelect={async (currentValue) => {
                          // kind of a hack since we want appId, but the combobox is using name
                          const appId = apps.find(
                            (a) => a.name === currentValue,
                          )?.appId;
                          if (appId) {
                            await enableApp({
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
            {disableError && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                Failed to remove app: {disableError.message}
              </div>
            )}

            {enabledApps.map((app) => (
              <EnabledAppRow
                key={app.appId}
                app={app}
                projectId={project.id}
                onDisable={async (appId) => {
                  await disableApp({
                    projectId: project.id,
                    appId,
                  });
                }}
                onUpdateAuth={handleUpdateAuth}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getAuthModeName(mode: ComposioAuthMode): string {
  switch (mode) {
    case ComposioAuthMode.API_KEY:
      return "API Key";
    case ComposioAuthMode.OAUTH2:
      return "OAuth 2.0";
    case ComposioAuthMode.BEARER_TOKEN:
      return "Bearer Token";
    case ComposioAuthMode.BASIC:
      return "Basic Auth";
    case ComposioAuthMode.BASIC_WITH_JWT:
      return "Basic Auth + JWT";
    default:
      return mode;
  }
}
