// Re-exported from @tambo-ai/client, with React-specific overrides for
// TamboComponent and RegisteredComponent which use ComponentType<any>
// instead of the client's framework-agnostic `unknown`.
import type { ComponentType } from "react";
import type {
  TamboComponent as BaseTamboComponent,
  RegisteredComponent as BaseRegisteredComponent,
} from "@tambo-ai/client";

// Re-export everything from client that doesn't need React-specific overrides
export type {
  SupportedSchema,
  ToolAnnotations,
  ParameterSpec,
  ComponentContextToolMetadata,
  ComponentContextTool,
  TamboToolRegistry,
  JSONSchemaLite,
  TamboTool,
  TamboToolJSONSchema,
  TamboToolUnknown,
  TamboToolStandardSchema,
  UnsupportedSchemaTamboTool,
  TamboToolAssociations,
  RegisterToolsFn,
  RegisterToolFn,
  DefineToolFn,
} from "@tambo-ai/client";

/**
 * React-specific RegisteredComponent with ComponentType fields.
 */
export interface RegisteredComponent extends Omit<
  BaseRegisteredComponent,
  "component" | "loadingComponent"
> {
  component: ComponentType<any>;
  loadingComponent?: ComponentType<any>;
}

export type ComponentRegistry = Record<string, RegisteredComponent>;

/**
 * React-specific TamboComponent with ComponentType fields.
 */
export interface TamboComponent extends Omit<
  BaseTamboComponent,
  "component" | "loadingComponent"
> {
  /**
   * The React component to render.
   *
   * Make sure to pass the Component itself, not an instance of the component. For example,
   * if you have a component like this:
   *
   * ```tsx
   * const MyComponent = () => {
   *   return <div>My Component</div>;
   * };
   * ```
   *
   * You should pass the `Component`:
   *
   * ```tsx
   * const components = [MyComponent];
   * <TamboRegistryProvider components={components} />
   * ```
   */
  component: ComponentType<any>;
  /** The loading component to render while the component is loading */
  loadingComponent?: ComponentType<any>;
}
