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
  RegisterToolFn,
  RegisterToolsFn,
  TamboComponent,
  TamboTool,
  TamboToolRegistry,
} from "../model/component-metadata";
import type {
  McpServerInfo,
  NormalizedMcpServerInfo,
} from "../model/mcp-server-info";
import type { ListResourceItem, ResourceSource } from "../model/resource-info";
import {
  deduplicateMcpServers,
  normalizeServerInfo,
} from "../util/mcp-server-utils";
import {
  validateAndPrepareComponent,
  validateTool,
  validateToolAssociation,
} from "../util/registry-validators";
import {
  validateResource,
  validateResourceSource,
} from "../util/resource-validators";

export interface TamboRegistryContext {
  componentList: ComponentRegistry;
  toolRegistry: TamboToolRegistry;
  componentToolAssociations: Record<string, string[]>;
  mcpServerInfos: NormalizedMcpServerInfo[];
  resources: ListResourceItem[];
  resourceSource: ResourceSource | null;
  registerComponent: (
    options: TamboComponent,
    warnOnOverwrite?: boolean,
  ) => void;
  registerTool: RegisterToolFn;
  registerTools: RegisterToolsFn;
  addToolAssociation: (componentName: string, tool: TamboTool) => void;
  registerMcpServer: (info: McpServerInfo) => void;
  registerMcpServers: (infos: McpServerInfo[]) => void;
  registerResource: (resource: ListResourceItem) => void;
  registerResources: (resources: ListResourceItem[]) => void;
  registerResourceSource: (source: ResourceSource) => void;
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
  resources: [],
  resourceSource: null,
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
  /**
   *
   */
  registerResource: () => {},
  /**
   *
   */
  registerResources: () => {},
  /**
   *
   */
  registerResourceSource: () => {},
});

export interface TamboRegistryProviderProps {
  /** The components to register */
  components?: TamboComponent[];
  /** The tools to register */
  tools?: TamboTool[];
  /** The MCP servers to register */
  mcpServers?: (McpServerInfo | string)[];
  /** The static resources to register */
  resources?: ListResourceItem[];

  /**
   * Dynamic resource search function. Must be paired with getResource.
   * Called when useTamboMcpResourceList() is used to fetch resources.
   */
  listResources?: ResourceSource["listResources"];

  /**
   * Dynamic resource fetch function. Must be paired with listResources.
   * Called when useTamboMcpResource() is used to fetch a specific resource.
   */
  getResource?: ResourceSource["getResource"];

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
 * @param props.resources - The static resources to register
 * @param props.listResources - The dynamic resource search function (must be paired with getResource)
 * @param props.getResource - The dynamic resource fetch function (must be paired with listResources)
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
  resources: userResources,
  listResources: userListResources,
  getResource: userGetResource,
  onCallUnregisteredTool,
}) => {
  const [componentList, setComponentList] = useState<ComponentRegistry>({});
  const [toolRegistry, setToolRegistry] = useState<TamboToolRegistry>({});
  const [componentToolAssociations, setComponentToolAssociations] = useState<
    Record<string, string[]>
  >({});
  const [staticMcpServerInfos, setStaticMcpServerInfos] = useState<
    NormalizedMcpServerInfo[]
  >([]);
  const [dynamicMcpServerInfos, setDynamicMcpServerInfos] = useState<
    NormalizedMcpServerInfo[]
  >([]);
  const [staticResources, setStaticResources] = useState<ListResourceItem[]>(
    [],
  );
  const [resourceSource, setResourceSource] = useState<ResourceSource | null>(
    null,
  );

  const registryWithTool = useCallback((warnOnOverwrite: boolean) => {
    return (registry: TamboToolRegistry, tool: unknown): TamboToolRegistry => {
      validateTool(tool);

      if (registry[tool.name] && warnOnOverwrite) {
        console.warn(`Overwriting tool ${tool.name}`);
      }

      return {
        ...registry,
        [tool.name]: tool,
      };
    };
  }, []);

  const registerTool = useCallback<RegisterToolFn>(
    (tool: unknown, warnOnOverwrite = true) => {
      setToolRegistry((registry) =>
        registryWithTool(warnOnOverwrite)(registry, tool),
      );
    },
    [registryWithTool],
  );

  const registerTools = useCallback<RegisterToolsFn>(
    (tools, warnOnOverwrite = true) => {
      setToolRegistry((existingRegistry) =>
        tools.reduce(registryWithTool(warnOnOverwrite), existingRegistry),
      );
    },
    [registryWithTool],
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
      validateToolAssociation(
        componentName,
        tool.name,
        !!componentList[componentName],
        !!toolRegistry[tool.name],
      );

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
        loadingComponent,
        associatedTools,
      } = options;

      const { props } = validateAndPrepareComponent(options);

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

  useEffect(() => {
    // Validate that listResources and getResource are both provided or both omitted
    validateResourceSource(userListResources, userGetResource);

    // Set static resources from props
    if (userResources) {
      userResources.forEach((resource) => validateResource(resource));
      setStaticResources(userResources);
    } else {
      setStaticResources([]);
    }

    // Set resource source from props
    if (userListResources && userGetResource) {
      setResourceSource({
        listResources: userListResources,
        getResource: userGetResource,
      });
    } else {
      setResourceSource(null);
    }
  }, [userResources, userListResources, userGetResource]);

  const registerResource = useCallback((resource: ListResourceItem) => {
    validateResource(resource);
    setStaticResources((prev) => [...prev, resource]);
  }, []);

  const registerResources = useCallback((resources: ListResourceItem[]) => {
    resources.forEach((resource) => validateResource(resource));
    setStaticResources((prev) => [...prev, ...resources]);
  }, []);

  const registerResourceSource = useCallback((source: ResourceSource) => {
    validateResourceSource(source.listResources, source.getResource);
    setResourceSource(source);
  }, []);

  const mcpServerInfos: NormalizedMcpServerInfo[] = useMemo(() => {
    const allServers = [...staticMcpServerInfos, ...dynamicMcpServerInfos];
    return deduplicateMcpServers(allServers);
  }, [staticMcpServerInfos, dynamicMcpServerInfos]);

  const value = {
    componentList,
    toolRegistry,
    componentToolAssociations,
    mcpServerInfos,
    resources: staticResources,
    resourceSource,
    registerComponent,
    registerTool,
    registerTools,
    addToolAssociation,
    registerMcpServer,
    registerMcpServers,
    registerResource,
    registerResources,
    registerResourceSource,
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
