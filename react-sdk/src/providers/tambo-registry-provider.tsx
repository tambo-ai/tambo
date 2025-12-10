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
import type {
  ComponentRegistry,
  TamboComponent,
  TamboTool,
} from "../model/component-metadata";
import type {
  McpServerInfo,
  NormalizedMcpServerInfo,
} from "../model/mcp-server-info";
import {
  deduplicateMcpServers,
  normalizeServerInfo,
} from "../util/mcp-server-utils";
import { getSerializedProps, isZodSchema } from "../util/schema-utils";
import { assertValidName } from "../util/validate-component-name";
import { assertNoZodRecord } from "../util/validate-zod-schema";

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
    return deduplicateMcpServers(allServers);
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
 *
 * The returned objects are `NormalizedMcpServerInfo` instances, meaning both
 * `serverKey` and `transport` are always populated (with `transport`
 * defaulting to HTTP when not explicitly specified).
 */
export const useTamboMcpServerInfos = (): NormalizedMcpServerInfo[] => {
  return useContext(TamboRegistryContext).mcpServerInfos;
};
