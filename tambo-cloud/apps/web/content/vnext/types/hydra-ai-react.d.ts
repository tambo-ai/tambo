declare module "hydra-ai-react" {
  import { type ComponentType, type ReactNode } from "react";
  import { z } from "zod";

  // ===============================
  // State Management Hook
  // ===============================

  /**
   * Hook for state that Hydra should know about.
   * This hook automatically connects to the current message and thread context when used within a Hydra component.
   * State is automatically persisted and synchronized across the thread.
   *
   * @example
   * ```tsx
   * // Within a Hydra component (automatically receives threadId and messageId)
   * const { value, setValue } = useHydraState<{
   *   content: string;
   *   isEditing: boolean;
   * }>();
   * ```
   *
   * The hook automatically:
   * - Connects to the current message context
   * - Persists state changes
   * - Syncs state across thread updates
   * - Handles component state initialization
   *
   * @template T - The type of state to manage
   * @returns {Object} State management object
   * @property {T} value - The current state value
   * @property {(value: T) => void} setValue - Function to update the state
   * @property {boolean} isStreaming - Whether the state is currently streaming
   * @property {Partial<T>} [partial] - Partial updates during streaming
   * @property {string[]} [activePaths] - Active paths during streaming
   * @property {() => void} [abort] - Function to abort streaming
   */
  export function useHydraState<T>(): {
    value: T;
    setValue: (value: T) => void;
    isStreaming: boolean;
    partial?: Partial<T>;
    activePaths?: string[];
    abort?: () => void;
  };

  // ===============================
  // Component Types
  // ===============================

  /**
   * Props injected by the Hydra wrapper into components.
   * These props are automatically provided to any component rendered through the Hydra system.
   * Components using useHydraState will automatically have access to this context.
   *
   * @property {string} threadId - Unique thread identifier, automatically provided
   * @property {string} messageId - Unique message identifier, automatically provided
   */
  export interface HydraComponentInjectedProps {
    threadId: string;
    messageId: string;
  }

  /**
   * Component definition with schema.
   * Components defined in the registry automatically receive thread and message context,
   * enabling hooks like useHydraState to work without explicit configuration.
   *
   * @property {ComponentType<any>} component - The React component to render
   * @property {z.ZodSchema} propsSchema - Schema for validating props and state
   * @property {string} [description] - Optional description for AI context
   * @property {string[]} [associatedTools] - Optional tools this component can use
   */
  export interface HydraComponentDefinition {
    component: ComponentType<any>;
    propsSchema: z.ZodSchema;
    description?: string;
    associatedTools?: string[];
  }

  // ===============================
  // Component Types
  // ===============================

  /**
   * Component definition with schema
   */
  export interface HydraComponentDefinition {
    component: ComponentType<any>;
    propsSchema: z.ZodSchema; // Schema for props and state
    description?: string;
    associatedTools?: string[];
  }

  /**
   * Represents a component in a message thread
   */
  export interface HydraComponent {
    type: string;
    Component: ComponentType<any>;
    props: Record<string, unknown>;
    partial?: Record<string, unknown>;
    isStreaming?: boolean;
  }

  /**
   * Represents a message in a thread with streaming support and validation
   * @property id - Unique message identifier
   * @property type - Message sender type (user or hydra)
   * @property content - The message content
   * @property component - Optional interactive component attached to the message
   * @property status - Current processing status of the message
   * @property suggestions - AI-generated suggestions for next actions
   * @property selectedSuggestion - User's selected suggestion from the list
   * @property _meta - Internal validation and state metadata
   */
  export interface HydraThreadMessage {
    id: string;
    type: "user" | "hydra";
    content: string;
    component?: HydraComponent;
    status?: ProcessStatus;
    suggestions?: HydraSuggestion[];
    selectedSuggestion?: HydraSuggestion;
    _meta?: ValidationState;
  }

  // ===============================
  // Status Types
  // ===============================

  /**
   * Process status for operations
   * @property state - Current state of the process
   * @property message - Current status message
   * @property isLoading - Indicates if the process is loading
   * @property isThinking - Indicates if the process is thinking
   */
  export interface ProcessStatus {
    state: "evaluating" | "tools" | "generating" | "complete" | "error";
    message: string;
    isLoading: boolean;
    isThinking?: boolean;
  }

  /**
   * Validation state for streaming and data validation
   * @property completedPaths - Array of paths that have been validated
   * @property errors - Map of validation errors by path
   * @property isComplete - Whether all paths have been validated
   */
  export interface ValidationState {
    completedPaths: string[];
    errors: Record<string, string>;
    isComplete: boolean;
  }

  // ===============================
  // Core Types
  // These define the shape of data used throughout the system
  // In a mock environment, these types represent the structure of  data
  // ===============================

  /**
   * Helper for checking path completion in stream
   * @param path - Path to check
   * @param chunk - Current validation state
   * @returns True if the path is complete
   */
  export function isPathComplete(
    path: (string | number)[],
    chunk: { _meta: ValidationState }, // Current validation state
  ): boolean;

  /**
   * Represents a conversation thread with optional auto-generated titles
   * and context grouping capabilities
   * @property id - Unique thread identifier
   * @property title - Generated by AI if isAutoTitle is true
   * @property contextId - Developer-defined ID for grouping threads
   * @property isAutoTitle - If true, title is auto-generated
   * @property userProfile - References a stored user profile
   */
  export interface HydraThread {
    id: string;
    title?: string;
    contextId?: string;
    isAutoTitle?: boolean;
    userProfile?: string;
  }

  /**
   * State management for a thread
   * @property messages - Array of messages in the thread
   */
  export interface HydraThreadState {
    messages: HydraThreadMessage[];
  }

  /**
   * Configuration for message streaming
   * @param stream - Whether to stream the response
   * @param schema - Schema for validation
   * @param abortSignal - Abort signal for cancellation
   * @param onProgress - Callback for partial updates
   * @param onError - Callback for errors
   * @param onFinish - Callback for completion
   */
  export interface StreamOptions<T extends z.ZodSchema = z.ZodSchema> {
    stream?: boolean;
    schema?: T;
    abortSignal?: AbortSignal;
    onProgress?: (value: Partial<z.infer<T>>) => void;
    onError?: (error: Error) => void;
    onFinish?: (message: HydraThreadMessage) => void;
  }

  /**
   * AI-generated suggestion
   * @property title - Short action description
   * @property detailedSuggestion - Detailed  AI instruction
   */
  export interface HydraSuggestion {
    title: string;
    detailedSuggestion: string;
  }

  /**
   * AI personality configuration
   *  Defines  AI behavior
   * @property role - AI's simulated role (e.g., "helpful assistant")
   * @property style - Communication style (e.g., "professional")
   * @property rules - Behavior guidelines
   */
  export interface HydraPersonality {
    role: string;
    style: string;
    rules: string[];
  }

  /**
   * Stored user profile
   *   user data storage
   * @property userId - user identifier
   * @property profile - Text about the user to help the AI
   * @property updatedAt - ISO timestamp
   */
  export interface HydraStoredProfile {
    userId: string;
    profile: string;
    updatedAt: string;
  }

  // ===============================
  // Tool System Types
  //  Simulates AI tool execution system
  // ===============================

  /**
   * Tool definition with schema validation
   *  Defines  tool capabilities
   * @property description - Tool description for AI
   * @property inputSchema - Validates tool inputs
   */
  export interface HydraToolDefinition<T extends z.ZodSchema> {
    description: string;
    inputSchema: T;
  }

  /**
   * Tool implementation function type
   *  Returns  tool execution results
   * @param input - Tool inputs
   * @returns Promise of tool execution results
   */
  export type HydraToolImplementation<T extends z.ZodSchema> = (
    input: z.infer<T>,
  ) => Promise<unknown>;

  /**
   * Registry for tool management
   *  Stores available  tools
   * @property tools - Map of tool definitions
   * @method registerTool - Adds a new tool to the registry
   */
  export interface HydraToolRegistry<
    T extends Record<string, HydraToolDefinition<z.ZodSchema>>,
  > {
    tools: T;
    registerTool<K extends keyof T>(
      name: K,
      implementation: HydraToolImplementation<T[K]["inputSchema"]>,
    ): void;
  }

  /**
   * Creates a new tool registry
   *  Initializes with  tools
   * @param config - Initial tool definitions
   * @returns New tool registry instance
   */
  export function createHydraToolRegistry<
    T extends Record<string, HydraToolDefinition<z.ZodSchema>>,
  >(config: T): HydraToolRegistry<T>;

  // ===============================
  // Component Registry System
  //  Manages UI components available to AI
  // ===============================

  /**
   * Registry for component management
   * @property components - Map of component definitions
   */
  export interface HydraComponentRegistry {
    components: Record<string, HydraComponentDefinition>;
  }

  // ===============================
  // Configuration Types
  //  System initialization
  // ===============================

  /**
   * Main configuration interface
   * @property apiKey - API key for Hydra
   * @property debug - Enable debug mode
   * @property toolRegistry - Tool registry instance
   * @property componentRegistry - Component registry instance
   * @property personality - AI personality configuration
   * @template TTools - Type of tool definitions
   * @template TComponents - Type of component definitions
   */
  export interface HydraConfig<
    TTools extends Record<string, HydraToolDefinition<z.ZodSchema>> = Record<
      string,
      HydraToolDefinition<z.ZodSchema>
    >,
    TComponents extends Record<string, HydraComponentDefinition> = Record<
      string,
      HydraComponentDefinition
    >,
  > {
    apiKey: string;
    debug?: boolean;
    toolRegistry: HydraToolRegistry<TTools>;
    componentRegistry: HydraComponentRegistry<TComponents>;
    personality?: HydraPersonality;
  }

  /**
   * Provider component props
   * @property config - Hydra configuration
   * @property children - React nodes to render
   * @template TTools - Type of tool definitions
   * @template TComponents - Type of component definitions
   */
  export interface HydraProviderProps<
    TTools extends Record<string, HydraToolDefinition<z.ZodSchema>>,
    TComponents extends Record<string, HydraComponentDefinition>,
  > extends Readonly<{
      config: HydraConfig<TTools, TComponents>;
      children: ReactNode;
    }> {}

  export const HydraProvider: <
    TTools extends Record<string, HydraToolDefinition<z.ZodSchema>>,
    TComponents extends Record<string, HydraComponentDefinition>,
  >(
    props: HydraProviderProps<TTools, TComponents>,
  ) => React.ReactElement;

  // ===============================
  // Unified Context & Hooks System
  //  Central state management and operations
  // ===============================

  /**
   * Main context interface
   *  Provides access to all functionality
   * @property config - Hydra configuration
   * @property personality - AI personality configuration
   * @property updateConfig - Function to update configuration
   * @property threads - Thread management
   * @property messages - Message management
   * @property suggestions - Suggestion management
   * @property profiles - Profile management
   * @template TTools - Type of tool definitions
   * @template TComponents - Type of component definitions
   */
  export interface HydraContext<
    TTools extends Record<string, HydraToolDefinition<z.ZodSchema>>,
    TComponents extends Record<string, HydraComponentDefinition>,
  > {
    config: HydraConfig<TTools, TComponents>;
    personality?: HydraPersonality;

    // Core Operations
    updateConfig: {
      personality: (personality: Partial<HydraPersonality>) => Promise<void>;
    };

    // Thread Management
    threads: {
      all: HydraThread[];
      state: Record<string, HydraThreadState>;
      getByContext: (contextId: string) => HydraThread[];
      operations: ThreadOperations;
    };

    // Message Management
    messages: {
      generate: (
        threadId: string,
        message: string,
        options?: StreamOptions,
      ) => Promise<void>;
      state: Record<string, HydraThreadMessage[]>;
      status: ProcessStatus;
    };

    // Component Management
    components: {
      current: ComponentType<any> | null;
      state: Record<string, unknown>;
      updateState: (updates: Record<string, unknown>) => void;
    };

    // Suggestion Management
    suggestions: {
      items: HydraSuggestion[];
      accept: (suggestion: HydraSuggestion) => Promise<void>;
      dismiss: (suggestion: HydraSuggestion) => Promise<void>;
    };

    // Profile Management
    profiles: {
      items: HydraStoredProfile[];
      status: {
        isLoading: boolean;
        error: Error | null;
      };
      operations: ProfileOperations;
    };
  }

  /**
   * Operations for thread management
   * @property create - Create a new thread
   * @property delete - Delete a thread
   * @property update - Update a thread
   * @property updateMessageState - Update message state
   */
  export interface ThreadOperations {
    create: (options?: ThreadCreateOptions) => Promise<string>;
    delete: (threadId: string) => Promise<void>;
    update: (threadId: string, updates: Partial<HydraThread>) => Promise<void>;
    updateMessageState: (
      threadId: string,
      messageId: string,
      state: Record<string, unknown>,
    ) => Promise<void>;
  }

  /**
   * Operations for profile management
   * @property get - Get a user profile
   * @property update - Update a user profile
   * @property delete - Delete a user profile
   * @property list - List all user profiles
   * @property refresh - Refresh user profiles
   */
  export interface ProfileOperations {
    get: (userId: string) => Promise<HydraStoredProfile | null>;
    update: (userId: string, profile: string) => Promise<void>;
    delete: (userId: string) => Promise<void>;
    list: () => Promise<HydraStoredProfile[]>;
    refresh: () => Promise<void>;
  }

  // Primary hook for accessing all Hydra functionality
  // Main entry point for  functionality

  /**
   * Main hook for accessing all Hydra functionality
   * @returns Hydra context with all functionality
   * @template TTools - Type of tool definitions
   * @template TComponents - Type of component definitions
   */
  export function useHydraContext<
    TTools extends Record<string, HydraToolDefinition<z.ZodSchema>> = Record<
      string,
      HydraToolDefinition<z.ZodSchema>
    >,
    TComponents extends Record<string, HydraComponentDefinition> = Record<
      string,
      HydraComponentDefinition
    >,
  >(): HydraContext<TTools, TComponents>;

  // Convenience hooks for common operations
  // Simplified access to specific features

  /**
   * Hook for thread-specific operations
   * @property messages - Array of messages in the thread
   * @property operations - Thread operations
   * @property suggestions - Suggestion management
   * @property components - Component management
   */
  export function useHydraThread(threadId: string): {
    messages: HydraThreadMessage[];
    operations: ThreadOperations;
    suggestions: {
      items: HydraSuggestion[];
      accept: (suggestion: HydraSuggestion) => Promise<void>;
      dismiss: (suggestion: HydraSuggestion) => Promise<void>;
    };
    components: {
      current: ComponentType<any> | null;
      props: Record<string, unknown>;
      updateProps: (updates: Record<string, unknown>) => void;
    };
  };

  /**
   * Hook for profile-specific operations
   * @property profile - User profile
   * @property operations - Profile operations
   * @property status - Profile status
   */
  export function useHydraProfile(userId: string): {
    profile: HydraStoredProfile | null;
    operations: ProfileOperations;
    status: {
      isLoading: boolean;
      error: Error | null;
    };
  };

  /**
   * Hook for personality management
   * @property personality - AI personality
   * @property update - Update personality
   */
  export function useHydraPersonality(): {
    personality: HydraPersonality | undefined;
    update: (personality: Partial<HydraPersonality>) => Promise<void>;
  };

  // ===============================
  // Configuration Types
  //  System initialization
  // ===============================

  /**
   * Options for creating a new thread
   * @property title - Thread title
   * @property contextId - Developer-defined ID for grouping threads
   * @property isAutoTitle - If true, title is auto-generated
   * @property userProfile - References a stored user profile
   */
  export interface ThreadCreateOptions {
    title?: string;
    contextId?: string;
    isAutoTitle?: boolean;
    userProfile?: string;
  }
}
