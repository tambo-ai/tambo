import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditWithTamboButton } from "@/components/ui/tambo/edit-with-tambo-button";
import { api } from "@/trpc/react";
import { AiProviderType } from "@tambo-ai-cloud/core";
import type { Suggestion } from "@tambo-ai/react";
import { withInteractable } from "@tambo-ai/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod/v3";
import { McpServerRow } from "./mcp-server-row";

const COMPONENT_NAME = "McpServers";

const availableMcpServersSuggestions: Suggestion[] = [
  {
    id: "fetch-mcp-servers",
    title: "Fetch MCP Servers",
    detailedSuggestion: "Fetch all MCP servers for this project",
    messageId: "fetch-mcp-servers",
  },
  {
    id: "add-mcp-server",
    title: "Add MCP Server",
    detailedSuggestion: "Add a new MCP server to this project",
    messageId: "add-mcp-server",
  },
  {
    id: "inspect-mcp-server-tools",
    title: "Inspect MCP Server Tools",
    detailedSuggestion:
      "Inspect the tools available on the MCP servers of this project",
    messageId: "inspect-mcp-server-tools",
  },
];

export const InteractableAvailableMcpServersProps = z.object({
  projectId: z.string().describe("The project to fetch MCP servers for."),
  providerType: z.nativeEnum(AiProviderType).nullish(),
  isAddingNew: z
    .boolean()
    .optional()
    .describe(
      "When true, the component enters 'add new MCP server' mode, displaying an empty form to create a new server.",
    ),
  url: z
    .string()
    .optional()
    .describe(
      "When provided with isAddingNew, pre-fills the MCP server URL field.",
    ),
  customHeaders: z
    .any()
    .optional()
    .describe(
      "When provided with isAddingNew, pre-fills the custom headers for the MCP server. Should be an object with header names as keys and header values as strings.",
    ),
  serverIdToDelete: z
    .string()
    .optional()
    .describe(
      "When provided, triggers deletion of the MCP server with this ID. IMPORTANT: You must first call fetchProjectMcpServers to get the list of servers and find the correct server ID before using this parameter. Never guess or use the URL as the ID - always use the 'id' field from the server list.",
    ),
});

interface AvailableMcpServersProps {
  projectId: string;
  providerType?: AiProviderType | null;
  isAddingNew?: boolean;
  url?: string;
  customHeaders?: Record<string, string>;
  serverIdToDelete?: string;
  onEdited?: () => void;
}

export function AvailableMcpServers({
  projectId,
  providerType,
  isAddingNew: isAddingNewProp,
  url: urlProp,
  customHeaders: customHeadersProp,
  serverIdToDelete: serverIdToDeleteProp,
  onEdited,
}: AvailableMcpServersProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [initialUrl, setInitialUrl] = useState<string | undefined>(undefined);
  const [initialHeaders, setInitialHeaders] = useState<
    Record<string, string> | undefined
  >(undefined);
  const [serverIdToDelete, setServerIdToDelete] = useState<string | undefined>(
    undefined,
  );
  const router = useRouter();

  const isAgentMode = providerType === AiProviderType.AGENT;

  // When Tambo sends isAddingNew prop, enter add mode
  useEffect(() => {
    if (isAddingNewProp !== undefined) {
      setIsAddingNew(isAddingNewProp);
      if (urlProp) {
        setInitialUrl(urlProp);
      }
      if (customHeadersProp) {
        setInitialHeaders(customHeadersProp);
      }
    }
  }, [isAddingNewProp, urlProp, customHeadersProp]);

  // When Tambo sends serverIdToDelete prop, set it for deletion
  useEffect(() => {
    if (serverIdToDeleteProp) {
      setServerIdToDelete(serverIdToDeleteProp);
    }
  }, [serverIdToDeleteProp]);

  const { data: mcpServers, refetch } = api.tools.listMcpServers.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
    onEdited?.();
  }, [refetch, onEdited]);

  const redirectToAuth = useCallback(
    (url: string) => {
      router.push(url);
    },
    [router],
  );

  // Show loading state while fetching data
  if (!mcpServers) {
    return (
      <Card className="border rounded-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">MCP Servers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex flex-col gap-2 bg-muted/50 p-2 rounded-md animate-pulse">
              <div className="flex flex-col gap-1">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="flex items-center gap-2">
                  <div className="h-9 flex-1 bg-muted rounded" />
                  <div className="h-9 w-9 bg-muted rounded" />
                  <div className="h-9 w-9 bg-muted rounded" />
                  <div className="h-9 w-9 bg-muted rounded" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-8 w-full bg-muted rounded" />
              </div>
              <div className="space-y-1">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="flex gap-2">
                  <div className="h-9 flex-[2] bg-muted rounded" />
                  <div className="h-9 flex-[5] bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Disable panel in Agent mode
  if (isAgentMode) {
    return (
      <Card className="border rounded-md overflow-hidden opacity-60">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">MCP Servers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            MCP Servers are disabled while Agent mode is enabled.
            <br />
            MCP + Agent support is coming soon.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            MCP Servers
            <EditWithTamboButton description="Manage MCP servers for this project. Add, edit, and delete MCP servers." />
          </CardTitle>
          {!isAddingNew && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNew(true)}
            >
              Add MCP Server
            </Button>
          )}
        </div>
      </CardHeader>
      {(mcpServers.length > 0 || isAddingNew) && (
        <CardContent>
          {mcpServers.map((server) => (
            <McpServerRow
              key={server.id}
              server={server}
              projectId={projectId}
              onRefresh={handleRefresh}
              redirectToAuth={redirectToAuth}
              shouldDelete={serverIdToDelete === server.id}
              onDeleteComplete={() => setServerIdToDelete(undefined)}
            />
          ))}

          {isAddingNew && (
            <McpServerRow
              server={{
                id: "new",
                url: initialUrl || "",
                serverKey: "",
                customHeaders: initialHeaders || {},
              }}
              projectId={projectId}
              onRefresh={handleRefresh}
              isNew
              onCancel={() => {
                setIsAddingNew(false);
                setInitialUrl(undefined);
                setInitialHeaders(undefined);
              }}
              redirectToAuth={redirectToAuth}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}

export const InteractableAvailableMcpServers = withInteractable(
  AvailableMcpServers,
  {
    componentName: COMPONENT_NAME,
    description:
      "Manages and displays MCP (Model Context Protocol) servers for a project. Shows a list of configured MCP servers with options to add new servers, edit existing ones, or delete them. Each server can be configured with a URL and custom headers. The component can be controlled to enter 'add new server' mode where users can create new MCP server configurations. To delete a server: (1) First call fetchProjectMcpServers to get the server list, (2) Find the server by matching the URL, (3) Use the server's 'id' field with serverIdToDelete parameter to trigger deletion.",
    propsSchema: InteractableAvailableMcpServersProps,
  },
);
