import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { useCallback, useState } from "react";
import { McpServerRow } from "./mcp-server-row";

interface AvailableMcpServersProps {
  project: { id: string; name: string };
}

export function AvailableMcpServers({ project }: AvailableMcpServersProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);

  const { data: mcpServers, refetch } = api.tools.listMcpServers.useQuery({
    projectId: project.id,
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (!mcpServers) {
    return <div className="animate-pulse h-8 bg-muted rounded" />;
  }

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm font-heading font-semibold">
          MCP Servers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="space-y-2">
            {mcpServers.map((server) => (
              <McpServerRow
                key={server.id}
                server={server}
                projectId={project.id}
                onRefresh={handleRefresh}
              />
            ))}

            {isAddingNew ? (
              <McpServerRow
                server={{
                  id: "new",
                  url: "",
                  customHeaders: {},
                }}
                projectId={project.id}
                onRefresh={handleRefresh}
                isNew
                onCancel={() => setIsAddingNew(false)}
              />
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsAddingNew(true)}
              >
                Add MCP Server
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
