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
   * // Within a Hydra component (automatically receives messageId)
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
   */
  export function useHydraState<T>(): {
    value: T;
    setValue: (value: T) => void;
  };

  // ===============================
  // Streaming
  // ===============================

  /**
   * Validation state for tracking data completeness and validity
   * Used for both streaming and non-streaming data validation
   *
   * @property completedPaths - Paths that are fully received and validated
   * @property validPaths - Paths that are safe to use (even if incomplete)
   * @property errors - Validation errors by path
   * @property isComplete - Whether the entire data structure is complete
   *
   * @example
   * ```ts
   * // Check if path is fully complete
   * if (validation.completedPaths.includes('items')) {
   *   // Safe to use entire items array
   * }
   *
   * // Check if path is safe to use (even if incomplete)
   * if (validation.validPaths.includes('items')) {
   *   // Can use partial items data
   * }
   * ```
   */
  export interface ValidationState {
    completedPaths: string[];
    validPaths: string[];
    errors: Record<string, string>;
    isComplete: boolean;
  }

  /**
   * Core streaming status interface used for component streaming
   * Provides real-time information about streaming state
   *
   * @template T - The type of data being streamed
   * @property isStreaming - Whether the stream is active
   * @property activePaths - Array of paths that are currently being streamed
   * @property validation - Validation state including partial validity
   * @property partialData - Partial data that has been streamed
   */
  export interface ComponentStreamingStatus<T> {
    isStreaming: boolean;
    activePaths: string[];
    validation: ValidationState;
    partialData: Partial<T>;
  }

  /**
   * Core streaming status interface used for message streaming
   * Extends ComponentStreamingStatus to add abort control
   * Right now we only support aborting the message stream
   * not the component stream for now.
   *
   * @template T - The type of data being streamed
   * @property abort - Function to abort the stream
   */
  export interface MessageStreamingStatus<T>
    extends ComponentStreamingStatus<T> {
    abort: () => void;
  }

  /**
   * Helper for checking path completion in stream
   * @param path - Path to check
   * @param validationState - Current validation state
   * @returns True if the path is complete
   */
  export function isPathComplete(
    path: (string | number)[],
    validationState: ValidationState,
  ): boolean;

  /**
   * Hook for accessing message streaming state
   * Uses the current message context from HydraContext automatically
   *
   * @example
   * ```tsx
   * // Within any component under HydraProvider
   * const { isStreaming, partial, abort } = useMessageStreaming();
   *
   * // No need to pass messageId - it's handled by context
   * return (
   *   <div>
   *     {isStreaming && <LoadingIndicator />}
   *     {partialData && <PartialContent content={partialData} />}
   *     <button onClick={abort}>Cancel Stream</button>
   *   </div>
   * );
   * ```
   */
  export function useMessageStreaming(): MessageStreamingStatus<
    HydraThreadMessage & ValidationState
  >;

  /**
   * Hook for accessing component streaming state
   * Uses the current message and component context from HydraContext automatically
   *
   * @example
   * ```tsx
   * // Within a Hydra component
   * const { isStreaming, partial } = useComponentStreaming<MyProps>();
   *
   * return (
   *   <div>
   *     {isStreaming && <LoadingIndicator />}
   *     {partial && <PartialContent {...partial} />}
   *   </div>
   * );
   * ```
   */
  export function useComponentStreaming<T>(): ComponentStreamingStatus<T>;

  /**
   * Configuration for message streaming
   * Simplified to just control streaming - state management handled by context
   *
   * @param stream - Whether to stream the response
   * @param abortSignal - Optional abort signal for cancellation
   */
  export interface StreamOptions {
    stream?: boolean;
    abortSignal?: AbortSignal;
  }

  // Component Types
  // ===============================
  // Component Types
  // ===============================

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
   * Props will automatically update as valid JSON streams in, even if incomplete.
   *
   * @example
   * ```tsx
   * // As JSON streams in, props update with each valid chunk:
   * { "title": "My" }                      // First update
   * { "title": "My List" }                 // Second update
   * { "title": "My List", "items": [] }    // Third update
   * { "title": "My List", "items": ["A"] } // Fourth update etc.
   * ```
   *
   * @property type - The type identifier for the component
   * @property Component - The React component to render
   * @property props - Current validated props that automatically update as JSON streams in
   */
  export interface HydraComponent {
    type: string;
    Component: ComponentType<any>;
    props: Record<string, unknown>;
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
   */
  export interface HydraThreadMessage {
    id: string;
    type: "user" | "hydra";
    content: string;
    component?: HydraComponent;
    status?: ProcessStatus;
    suggestions?: HydraSuggestion[];
    selectedSuggestion?: HydraSuggestion;
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

  // ===============================
  // Core Types
  // These define the shape of data used throughout the system
  // In a mock environment, these types represent the structure of  data
  // ===============================

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
   * @template TComponents - Type of component definitions
   * @property components - Map of component definitions
   */
  export interface HydraComponentRegistry<
    TComponents extends Record<string, HydraComponentDefinition> = Record<
      string,
      HydraComponentDefinition
    >,
  > {
    components: TComponents;
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
      context: HydraMessageContext; // Current message context
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

  /**
   * Context for message and streaming state
   * Automatically provided by HydraProvider to all child components
   *
   * @property messageId - Current message ID from context
   * @property threadId - Current thread ID from context
   * @property streaming - Streaming state and controls
   */
  export interface HydraMessageContext {
    messageId: string;
    threadId: string;
    streaming: {
      isEnabled: boolean;
      status: MessageStreamingStatus<ValidationState>;
    };
  }

  /**
   * Hook for accessing the message context
   * Use this to get the current message ID and streaming state
   *
   * @example
   * ```tsx
   * const { messageId, streaming } = useHydraMessageContext();
   * ```
   */
  export function useHydraMessageContext(): HydraMessageContext;

  /**
   * Creates a new component registry
   * @template TComponents - Type of component definitions
   * @param config - Initial component definitions
   * @returns New component registry instance
   */
  export function createHydraComponentRegistry<
    TComponents extends Record<string, HydraComponentDefinition>,
  >(config: TComponents): HydraComponentRegistry<TComponents>;
}
