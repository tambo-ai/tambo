<script lang="ts" module>
  import type {
    TamboComponent,
    TamboTool,
    McpServerInfo,
    ContextHelpers,
  } from "../types.js";

  export interface TamboProviderProps {
    apiKey: string;
    tamboUrl?: string;
    components?: TamboComponent[];
    tools?: TamboTool[];
    mcpServers?: McpServerInfo[];
    streaming?: boolean;
    contextKey?: string;
    autoGenerateThreadName?: boolean;
    autoGenerateNameThreshold?: number;
    contextHelpers?: ContextHelpers;
    userToken?: string;
  }
</script>

<script lang="ts">
  import { setContext, onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { createTamboClient } from "../client.js";
  import {
    TAMBO_CLIENT_KEY,
    TAMBO_THREAD_KEY,
    TAMBO_REGISTRY_KEY,
    TAMBO_INPUT_KEY,
    TAMBO_STATUS_KEY,
    TAMBO_INTERACTABLE_KEY,
    TAMBO_CONFIG_KEY,
    TAMBO_CONTEXT_HELPERS_KEY,
  } from "../context.js";
  import { createThreadStore } from "../stores/thread.svelte.js";
  import { createRegistryStore } from "../stores/registry.svelte.js";
  import { createInputStore } from "../stores/input.svelte.js";
  import { createStreamStatusStore } from "../stores/stream-status.svelte.js";
  import { createInteractableStore } from "../stores/interactable.svelte.js";
  import TamboMcpProvider from "./TamboMcpProvider.svelte";

  interface Props extends TamboProviderProps {
    children: Snippet;
  }

  const {
    apiKey,
    tamboUrl,
    components = [],
    tools = [],
    mcpServers = [],
    streaming = true,
    contextKey,
    autoGenerateThreadName = true,
    autoGenerateNameThreshold = 3,
    contextHelpers = {},
    userToken,
    children,
  }: Props = $props();

  // Create fresh client per provider instance (SSR-safe - no module-level singleton!)
  const client = createTamboClient({ apiKey, tamboUrl, userToken });

  // Create stores
  const registryStore = createRegistryStore();
  const inputStore = createInputStore();
  const statusStore = createStreamStatusStore();
  const interactableStore = createInteractableStore();

  // Thread store needs client and registry
  const threadStore = createThreadStore(
    {
      client,
      contextKey,
      streaming,
      autoGenerateThreadName,
      autoGenerateNameThreshold,
      contextHelpers,
    },
    registryStore,
  );

  // Configuration context
  const configContext = {
    streaming,
    contextKey,
    autoGenerateThreadName,
    autoGenerateNameThreshold,
  };

  // Context helpers context
  const contextHelpersContext = {
    helpers: contextHelpers,
    addContextHelper(name: string, helper: () => unknown): void {
      contextHelpers[name] = helper;
    },
    removeContextHelper(name: string): void {
      delete contextHelpers[name];
    },
  };

  // Set all contexts
  setContext(TAMBO_CLIENT_KEY, client);
  setContext(TAMBO_THREAD_KEY, threadStore);
  setContext(TAMBO_REGISTRY_KEY, registryStore);
  setContext(TAMBO_INPUT_KEY, inputStore);
  setContext(TAMBO_STATUS_KEY, statusStore);
  setContext(TAMBO_INTERACTABLE_KEY, interactableStore);
  setContext(TAMBO_CONFIG_KEY, configContext);
  setContext(TAMBO_CONTEXT_HELPERS_KEY, contextHelpersContext);

  // Register initial components and tools on mount
  onMount(() => {
    if (components.length > 0) {
      registryStore.registerComponents(components);
    }
    if (tools.length > 0) {
      registryStore.registerTools(tools);
    }
  });
</script>

<TamboMcpProvider {mcpServers}>
  {@render children()}
</TamboMcpProvider>
