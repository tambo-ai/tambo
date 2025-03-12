"use client";
import React, {
  ComponentType,
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";
import { ComponentRegistry, TamboTool } from "../model/component-metadata";

export interface RegisterComponentOptions {
  name: string;
  description: string;
  component: ComponentType<any>;
  propsDefinition?: any;
  loadingComponent?: ComponentType<any>;
  associatedTools?: TamboTool[];
}

export interface TamboRegistryContext {
  componentList: ComponentRegistry;
  toolRegistry: Record<string, TamboTool>;
  componentToolAssociations: Record<string, string[]>;
  registerComponent: (options: RegisterComponentOptions) => void;
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

export const TamboRegistryProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [componentList, setComponentList] = useState<ComponentRegistry>({});
  const [toolRegistry, setToolRegistry] = useState<Record<string, TamboTool>>(
    {},
  );
  const [componentToolAssociations, setComponentToolAssociations] = useState<
    Record<string, string[]>
  >({});

  const registerTool = useCallback((tool: TamboTool) => {
    setToolRegistry((prev) => {
      if (prev[tool.name]) {
        console.warn(`Overwriting tool ${tool.name}`);
      }
      return {
        ...prev,
        [tool.name]: tool,
      };
    });
  }, []);

  const registerTools = useCallback(
    (tools: TamboTool[]) => {
      tools.forEach((tool) => registerTool(tool));
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
    (options: RegisterComponentOptions) => {
      const {
        name,
        description,
        component,
        propsDefinition = {},
        loadingComponent,
        associatedTools,
      } = options;

      setComponentList((prev) => {
        if (prev[name]) {
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
