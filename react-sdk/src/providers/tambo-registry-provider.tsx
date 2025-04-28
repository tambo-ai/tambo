"use client";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ZodSchema } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
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
});

export interface TamboRegistryProviderProps {
  /** The components to register */
  components?: TamboComponent[];
  /** The tools to register */
  tools?: TamboTool[];
}

/**
 * The TamboRegistryProvider is a React provider that provides a component
 * registry to the descendants of the provider.
 * @param props - The props for the TamboRegistryProvider
 * @param props.children - The children to wrap
 * @param props.components - The components to register
 * @returns The TamboRegistryProvider component
 */
export const TamboRegistryProvider: React.FC<
  PropsWithChildren<TamboRegistryProviderProps>
> = ({ children, components: userComponents, tools: userTools }) => {
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
        propsSchema,
        propsDefinition,
        loadingComponent,
        associatedTools,
      } = options;

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
      userTools.forEach((tool) => {
        registerTool(tool, false);
      });
    }
  }, [registerTool, userTools]);

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

/**
 * The useTamboRegistry hook provides access to the component registry
 * to the descendants of the TamboRegistryProvider.
 * @returns The component registry
 */
export const useTamboRegistry = () => {
  return useContext(TamboRegistryContext);
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
