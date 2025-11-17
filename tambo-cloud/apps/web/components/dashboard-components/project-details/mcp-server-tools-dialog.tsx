import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/trpc/react";
import { MCPToolSpec } from "@tambo-ai-cloud/core";
import { JSONSchema7 } from "json-schema";
import { Loader2 } from "lucide-react";

interface McpServerToolsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  serverId: string;
}

export function McpServerToolsDialog({
  open,
  onOpenChange,
  projectId,
  serverId,
}: McpServerToolsDialogProps) {
  const { data, isLoading, error } = api.tools.inspectMcpServer.useQuery(
    {
      projectId,
      serverId,
    },
    {
      enabled: open,
    },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Server Information</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error.message}
            </div>
          ) : (
            <div className="space-y-6">
              {data?.serverInfo && (
                <div className="space-y-4">
                  {data.serverInfo.version && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">
                        Server Version
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {data.serverInfo.version.name}{" "}
                        {data.serverInfo.version.version}
                      </p>
                    </div>
                  )}
                  {data.serverInfo.instructions && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Instructions</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {data.serverInfo.instructions}
                      </p>
                    </div>
                  )}
                  {data.serverInfo.capabilities && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Capabilities</h3>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {Object.entries(data.serverInfo.capabilities).map(
                          ([key, value]) => {
                            if (typeof value === "boolean" && value) {
                              return <li key={key}>{key}</li>;
                            }
                            if (typeof value === "object" && value !== null) {
                              return (
                                <li key={key} className="mb-1">
                                  {key}:
                                  <ul className="list-disc list-inside ml-4">
                                    {Object.entries(value).map(
                                      ([subKey, subValue]) => (
                                        <li key={subKey}>
                                          {subKey}: {String(subValue)}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </li>
                              );
                            }
                            return null;
                          },
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium mb-2">Available Tools</h3>
                {data?.tools.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3">
                    No tools available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data?.tools.map((tool) => (
                      <ToolCard key={tool.name} tool={tool} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ToolCard({ tool }: { tool: MCPToolSpec }) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <h3 className="font-medium">{tool.name}</h3>
      {tool.description && (
        <p className="text-sm text-muted-foreground">{tool.description}</p>
      )}
      {tool.inputSchema?.properties && (
        <div className="mt-2">
          <h4 className="text-sm font-medium mb-1">Parameters:</h4>
          <div className="space-y-1">
            {Object.entries(tool.inputSchema.properties).map(
              ([name, schema]) => {
                const typedSchema = schema as JSONSchema7;
                return (
                  <div key={name} className="text-sm">
                    <span className="font-mono">{name}</span>
                    {typedSchema.description && (
                      <span className="text-muted-foreground ml-2">
                        - {typedSchema.description}
                      </span>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
}
