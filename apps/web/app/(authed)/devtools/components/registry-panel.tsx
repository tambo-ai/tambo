"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SchemaViewer } from "./schema-viewer";

interface RegistryComponent {
  name: string;
  description: string;
  propsSchema?: Record<string, unknown>;
}

interface RegistryTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

interface McpServer {
  name: string;
  url: string;
  status: string;
}

interface RegistryPanelProps {
  registry:
    | {
        components: RegistryComponent[];
        tools: RegistryTool[];
        mcpServers?: McpServer[];
      }
    | undefined;
}

/**
 * Displays registered components, tools, and MCP servers in a tabbed view.
 * Each item shows its name, description, and expandable schema details.
 *
 * @returns A tabbed panel for inspecting the component/tool registry.
 */
export function RegistryPanel({ registry }: RegistryPanelProps) {
  const components = registry?.components ?? [];
  const tools = registry?.tools ?? [];
  const mcpServers = registry?.mcpServers ?? [];

  return (
    <Tabs defaultValue="components" className="w-full">
      <TabsList>
        <TabsTrigger value="components">
          Components ({components.length})
        </TabsTrigger>
        <TabsTrigger value="tools">Tools ({tools.length})</TabsTrigger>
        <TabsTrigger value="mcp">MCP Servers ({mcpServers.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="components" className="space-y-2">
        {components.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">
            No components registered
          </p>
        )}
        {components.length > 0 && (
          <Accordion type="multiple" className="space-y-2">
            {components.map((c) => (
              <AccordionItem
                key={c.name}
                value={c.name}
                className="rounded-lg border px-4"
              >
                <AccordionTrigger className="py-3">
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-mono font-bold">{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.description}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <SchemaViewer schema={c.propsSchema} label="Props Schema" />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </TabsContent>

      <TabsContent value="tools" className="space-y-2">
        {tools.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">
            No tools registered
          </p>
        )}
        {tools.length > 0 && (
          <Accordion type="multiple" className="space-y-2">
            {tools.map((t) => (
              <AccordionItem
                key={t.name}
                value={t.name}
                className="rounded-lg border px-4"
              >
                <AccordionTrigger className="py-3">
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-mono font-bold">{t.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.description}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-3">
                  <SchemaViewer schema={t.inputSchema} label="Input Schema" />
                  <SchemaViewer schema={t.outputSchema} label="Output Schema" />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </TabsContent>

      <TabsContent value="mcp" className="space-y-2">
        {mcpServers.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">
            No MCP servers connected
          </p>
        )}
        {mcpServers.map((s) => (
          <div
            key={s.name}
            className="flex items-center justify-between rounded-lg border px-4 py-3"
          >
            <div className="flex flex-col gap-1">
              <span className="font-mono font-medium">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.url}</span>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {s.status}
            </span>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}
