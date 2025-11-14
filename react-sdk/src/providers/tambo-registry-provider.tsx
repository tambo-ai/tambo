"use client";
import type TamboAI from "@tambo-ai/typescript-sdk";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ZodSchema } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import {
  ComponentRegistry,
  TamboComponent,
  TamboTool,
} from "../model/component-metadata";
import { assertValidName } from "../util/validate-component-name";
import { assertNoZodRecord } from "../util/validate-zod-schema";
import { MCPTransport, getMcpServerUniqueKey } from "../model/mcp-server-info";
import type { McpServerInfo } from "../model/mcp-server-info";

/**
 * Derives a short, meaningful key from a server URL.
 * Strips TLDs and common prefixes to get a human-readable identifier.
 * For example, "https://mcp.linear.app/mcp" becomes "linear".
 * @returns A lowercased, human-readable key derived from the URL
 */
function deriveServerKey(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    // Split hostname into parts
    const parts = hostname.split(".");

    // Remove common TLD patterns
    // Handle cases like: .com, .org, .co.uk, .com.au, etc.
    let relevantParts = [...parts];

    // If we have 3+ parts and the last two are short (likely TLD like .co.uk)
    if (
      relevantParts.length >= 3 &&
      relevantParts[relevantParts.length - 1].length <= 3 &&
      relevantParts[relevantParts.length - 2].length <= 3
    ) {
      relevantParts = relevantParts.slice(0, -2);
    }
    // Otherwise just remove the last part (TLD like .com)
    else if (relevantParts.length >= 2) {
      relevantParts = relevantParts.slice(0, -1);
    }

    // From what's left, prefer the rightmost part that's not a common prefix
    // Common prefixes: www, api, mcp, app, etc.
    const commonPrefixes = new Set([
      "www",
      "api",
      "mcp",
      "app",
      "staging",
      "dev",
      "prod",
    ]);

    // Work backwards through the parts to find a meaningful name
    for (let i = relevantParts.length - 1; i >= 0; i--) {
      const part = relevantParts[i];
      if (part && !commonPrefixes.has(part.toLowerCase())) {
        return part.toLowerCase();
      }
    }

    // Fallback: use the last relevant part even if it's a common prefix
    return relevantParts[relevantParts.length - 1]?.toLowerCase() || hostname;
  } catch {
    // If URL parsing fails, just return a sanitized version of the input
    return url.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  }
}

/**
 * Normalizes an MCP server info object, ensuring it has a serverKey.
 * If serverKey is not provided, derives it from the URL.
 */
type NormalizedMcpServerInfo = McpServerInfo & { serverKey: string };

function normalizeServerInfo(
  server: McpServerInfo | string,
): NormalizedMcpServerInfo {
  const base: McpServerInfo =
    typeof server === "string"
      ? {
          url: server,
          transport: MCPTransport.HTTP,
        }
      : server;

  const serverKey = base.serverKey ?? deriveServerKey(base.url);
  const transport = base.transport ?? MCPTransport.HTTP;

  return { ...base, transport, serverKey };
}

export interface TamboRegistryContext {
  componentList: ComponentRegistry;
  toolRegistry: Record<string, TamboTool>;
  componentToolAssociations: Record<string, string[]>;
  mcpServerInfos: NormalizedMcpServerInfo[];
  registerComponent: (options: TamboComponent) => void;
  registerTool: (tool: TamboTool) => void;
  registerTools: (tools: TamboTool[]) => void;
  addToolAssociation: (componentName: string, tool: TamboTool) => void;
  registerMcpServer: (info: McpServerInfo) => void;
  registerMcpServers: (infos: McpServerInfo[]) => void;
  onCallUnregisteredTool?: (
    toolName: string,
    args: TamboAI.ToolCallParameter[],
  ) => Promise<string>;
}

export const TamboRegistryContext = createContext<TamboRegistryContext>({
  componentList: {},
  toolRegistry: {},
  componentToolAssociations: {},
  mcpServerInfos: [],
  /**
   *
   */
  registerComponent: () => {},
  /**
   *
   */
  registerTool: () => {},
  /**
   *
   */
  registerTools: () => {},
  /**
   *
   */
  addToolAssociation: () => {},
  /**
   *
   */
  registerMcpServer: () => {},
  /**
   *
   */
  registerMcpServers: () => {},
});

export interface TamboRegistryProviderProps {
  /** The components to register */
  components?: TamboComponent[];
  /** The tools to register */
  tools?: TamboTool[];
  /** The MCP servers to register */
  mcpServers?: (McpServerInfo | string)[];

  /**
   * A function to call when an unknown tool is called. If this function is not
   * provided, an error will be thrown when a tool call is requested by the
   * server.
   *
   * Note that this is generally only for agents, where the agent code may
   * request tool calls that are not registered in the tool registry.
   */
  onCallUnregisteredTool?: (
    toolName: string,
    args: TamboAI.ToolCallParameter[],
  ) => Promise<string>;
}

/**
 * The TamboRegistryProvider is a React provider that provides a component
 * registry to the descendants of the provider.
 * @param props - The props for the TamboRegistryProvider
 * @param props.children - The children to wrap
 * @param props.components - The components to register
 * @param props.tools - The tools to register
 * @param props.mcpServers - The MCP servers to register
 * @param props.onCallUnregisteredTool - The function to call when an unknown tool is called (optional)
 * @returns The TamboRegistryProvider component
 */
export const TamboRegistryProvider: React.FC<
  PropsWithChildren<TamboRegistryProviderProps>
> = ({
  children,
  components: userComponents,
  tools: userTools,
  mcpServers: userMcpServers,
  onCallUnregisteredTool,
}) => {
  const [componentList, setComponentList] = useState<ComponentRegistry>({});
  const [toolRegistry, setToolRegistry] = useState<Record<string, TamboTool>>(
    {},
  );
  const [componentToolAssociations, setComponentToolAssociations] = useState<
    Record<string, string[]>
  >({});
  const [staticMcpServerInfos, setStaticMcpServerInfos] = useState<
    NormalizedMcpServerInfo[]
  >([]);
  const [dynamicMcpServerInfos, setDynamicMcpServerInfos] = useState<
    NormalizedMcpServerInfo[]
  >([]);

  const registerTool = useCallback(
    (tool: TamboTool, warnOnOverwrite = true) => {
      // Validate tool name
      assertValidName(tool.name, "tool");

      // Validate tool schemas
      if (tool.toolSchema && isZodSchema(tool.toolSchema)) {
        assertNoZodRecord(tool.toolSchema, `toolSchema of tool "${tool.name}"`);
      }
      setToolRegistry((prev) => {
        if (prev[tool.name] && warnOnOverwrite) {
          console.warn(`Overwriting tool ${tool.name}`);
        }
        return {
          ...prev,
          [tool.name]: tool,
        };
      });
    },
    [],
  );

  const registerTools = useCallback(
    (tools: TamboTool[], warnOnOverwrite = true) => {
      tools.forEach((tool) => registerTool(tool, warnOnOverwrite));
    },
    [registerTool],
  );

  const registerMcpServer = useCallback((info: McpServerInfo | string) => {
    const normalized = normalizeServerInfo(info);
    setDynamicMcpServerInfos((prev) => [...prev, normalized]);
  }, []);

  const registerMcpServers = useCallback(
    (infos: (McpServerInfo | string)[]) => {
      const normalized = infos.map(normalizeServerInfo);
      setDynamicMcpServerInfos((prev) => [...prev, ...normalized]);
    },
    [],
  );

  const addToolAssociation = useCallback(
    (componentName: string, tool: TamboTool) => {
      // Validate component and tool names
      assertValidName(componentName, "component");
      assertValidName(tool.name, "tool");

      if (!componentList[componentName]) {
        throw new Error(`Component ${componentName} not found in registry`);
      }
      if (!toolRegistry[tool.name]) {
        throw new Error(`Tool ${tool.name} not found in registry`);
      }

      setComponentToolAssociations((prev) => ({
        ...prev,
        [componentName]: [...(prev[componentName] || []), tool.name],
      }));
    },
    [componentList, toolRegistry],
  );

  const registerComponent = useCallback(
    (options: TamboComponent, warnOnOverwrite = true) => {
      const {
        name,
        description,
        component,
        propsSchema,
        propsDefinition,
        loadingComponent,
        associatedTools,
      } = options;

      // Validate component name
      assertValidName(name, "component");

      // Validate that at least one props definition is provided
      if (!propsSchema && !propsDefinition) {
        throw new Error(
          `Component ${name} must have either propsSchema (recommended) or propsDefinition defined`,
        );
      }

      // Validate that only one props definition is provided
      if (propsSchema && propsDefinition) {
        throw new Error(
          `Component ${name} cannot have both propsSchema and propsDefinition defined. Use only one. We recommend using propsSchema.`,
        );
      }

      // Validate that the propsSchema does not include z.record()
      if (propsSchema && isZodSchema(propsSchema)) {
        assertNoZodRecord(propsSchema, `propsSchema of component "${name}"`);
      }

      // Convert propsSchema to JSON Schema if it exists
      const props = getSerializedProps(propsDefinition, propsSchema, name);

      setComponentList((prev) => {
        if (prev[name] && warnOnOverwrite) {
          console.warn(`overwriting component ${name}`);
        }
        return {
          ...prev,
          [name]: {
            component,
            loadingComponent,
            name,
            description,
            props,
            contextTools: [],
          },
        };
      });
      if (associatedTools) {
        registerTools(associatedTools);
        setComponentToolAssociations((prev) => ({
          ...prev,
          [name]: associatedTools.map((tool) => tool.name),
        }));
      }
    },
    [registerTools],
  );
  useEffect(() => {
    if (userComponents) {
      userComponents.forEach((component) => {
        registerComponent(component, false);
      });
    }
  }, [registerComponent, userComponents]);

  useEffect(() => {
    if (userTools) {
      registerTools(userTools, false);
    }
  }, [registerTools, userTools]);

  useEffect(() => {
    if (!userMcpServers || userMcpServers.length === 0) {
      setStaticMcpServerInfos([]);
      return;
    }

    // Normalize servers from props and ensure all have serverKey and transport
    const normalized = userMcpServers.map(normalizeServerInfo);
    setStaticMcpServerInfos(normalized);
  }, [userMcpServers]);

  const mcpServerInfos: NormalizedMcpServerInfo[] = useMemo(() => {
    const allServers = [...staticMcpServerInfos, ...dynamicMcpServerInfos];
    if (allServers.length === 0) {
      return allServers;
    }

    // 1. Deduplicate by connection identity using a stable key
    const byKey = new Map<string, NormalizedMcpServerInfo>();
    for (const server of allServers) {
      const key = getMcpServerUniqueKey(server);
      byKey.set(key, server);
    }

    const deduped = Array.from(byKey.values());

    // 2. Ensure serverKey uniqueness for readable, unambiguous prefixes
    const seen = new Map<string, number>();
    return deduped.map((server) => {
      const baseKey = server.serverKey;
      const count = (seen.get(baseKey) ?? 0) + 1;
      seen.set(baseKey, count);

      if (count === 1) {
        return server;
      }

      return {
        ...server,
        serverKey: `${baseKey}-${count}`,
      };
    });
  }, [staticMcpServerInfos, dynamicMcpServerInfos]);

  const value = {
    componentList,
    toolRegistry,
    componentToolAssociations,
    mcpServerInfos,
    registerComponent,
    registerTool,
    registerTools,
    addToolAssociation,
    registerMcpServer,
    registerMcpServers,
    onCallUnregisteredTool,
  };

  return (
    <TamboRegistryContext.Provider value={value}>
      {children}
    </TamboRegistryContext.Provider>
  );
};

/**
 * The useTamboRegistry hook provides access to the component registry
 * to the descendants of the TamboRegistryProvider.
 * @returns The component registry
 */
export const useTamboRegistry = () => {
  return useContext(TamboRegistryContext);
};

/**
 * Hook to access the MCP server metadata from TamboRegistryProvider.
 * This provides access to the registered MCP server configurations (metadata only, not connections).
 *
 * This hook can be used anywhere within the TamboProvider hierarchy to access
 * the list of configured MCP servers without needing to be inside TamboMcpProvider.
 * @returns Array of MCP server metadata
 * @example
 * ```tsx
 * function MyComponent() {
 *   const mcpServers = useTamboMcpServerInfos();
 *
 *   return (
 *     <div>
 *       <h3>Configured MCP Servers:</h3>
 *       {mcpServers.map((server) => (
 *         <div key={server.url}>
 *           {server.name || server.url}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useTamboMcpServerInfos = (): (McpServerInfo & {
  serverKey: string;
})[] => {
  return useContext(TamboRegistryContext).mcpServerInfos;
};
function getSerializedProps(
  propsDefinition: any,
  propsSchema: any,
  name: string,
) {
  if (propsDefinition) {
    console.warn(`propsDefinition is deprecated. Use propsSchema instead.`);
    return propsDefinition;
  }

  if (isZodSchema(propsSchema)) {
    try {
      return zodToJsonSchema(propsSchema);
    } catch (error) {
      console.error(
        `Error converting ${name} props schema to JSON Schema:`,
        error,
      );
    }
  }
  // try to roughly detect JSONSchema, should always be an object with a properties key
  if (isJSONSchema(propsSchema)) {
    return propsSchema;
  }

  throw new Error(`Invalid props schema for ${name}`);
}

/**
 * Checks if the propsSchema is a JSON Schema. This is a rough check, and the
 * server will provide the definitive check.
 * @param propsSchema - The props schema to check
 * @returns True if the props schema is a JSON Schema, false otherwise
 */
function isJSONSchema(propsSchema: any) {
  return (
    propsSchema &&
    typeof propsSchema === "object" &&
    propsSchema.type === "object" &&
    propsSchema.properties
  );
}

/**
 * Since we require a certain zod version, we need to check if the object is a ZodSchema
 * @param obj - The object to check
 * @returns True if the object is a ZodSchema, false otherwise
 */
function isZodSchema(obj: unknown): obj is ZodSchema {
  if (obj instanceof ZodSchema) {
    return true;
  }
  // try to detect if the object is a ZodSchema
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as any).safeParse === "function" &&
    typeof (obj as any)._def === "object"
  );
}
