import { Button } from "@/components/ui/button";
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
    <div className="space-y-2">
      <h3 className="text-sm font-medium">MCP Servers</h3>
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
  );
}
