"use client";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ComponentRegistry,
  TamboComponent,
  TamboTool,
} from "../model/component-metadata";

export interface TamboRegistryContext {
  componentList: ComponentRegistry;
  toolRegistry: Record<string, TamboTool>;
  componentToolAssociations: Record<string, string[]>;
  registerComponent: (options: TamboComponent) => void;
  registerTool: (tool: TamboTool) => void;
  registerTools: (tools: TamboTool[]) => void;
  addToolAssociation: (componentName: string, tool: TamboTool) => void;
}

const TamboRegistryContext = createContext<TamboRegistryContext>({
  componentList: {},
  toolRegistry: {},
  componentToolAssociations: {},
  registerComponent: () => {},
  registerTool: () => {},
  registerTools: () => {},
  addToolAssociation: () => {},
});

export interface TamboRegistryProviderProps {
  /** The default components to register */
  components?: TamboComponent[];
}

export const TamboRegistryProvider: React.FC<
  PropsWithChildren<TamboRegistryProviderProps>
> = ({ children, components: userComponents }) => {
  const [componentList, setComponentList] = useState<ComponentRegistry>({});
  const [toolRegistry, setToolRegistry] = useState<Record<string, TamboTool>>(
    {},
  );
  const [componentToolAssociations, setComponentToolAssociations] = useState<
    Record<string, string[]>
  >({});

  const registerTool = useCallback(
    (tool: TamboTool, warnOnOverwrite = true) => {
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

  const addToolAssociation = useCallback(
    (componentName: string, tool: TamboTool) => {
      if (!componentList[componentName]) {
        throw new Error(`Component ${componentName} not found in registry`);
      }
      setComponentToolAssociations((prev) => ({
        ...prev,
        [componentName]: [...(prev[componentName] || []), tool.name],
      }));
    },
    [componentList],
  );

  const registerComponent = useCallback(
    (options: TamboComponent, warnOnOverwrite = true) => {
      const {
        name,
        description,
        component,
        propsDefinition = {},
        loadingComponent,
        associatedTools,
      } = options;

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
            props: propsDefinition,
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

  const value = {
    componentList,
    toolRegistry,
    componentToolAssociations,
    registerComponent,
    registerTool,
    registerTools,
    addToolAssociation,
  };

  return (
    <TamboRegistryContext.Provider value={value}>
      {children}
    </TamboRegistryContext.Provider>
  );
};

export const useTamboRegistry = () => {
  return useContext(TamboRegistryContext);
};
