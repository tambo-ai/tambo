import type { Component } from "svelte";
import type { TamboComponent, TamboTool } from "../types.js";

/**
 * Registry store for Tambo components and tools using Svelte 5 runes
 */
export function createRegistryStore() {
  let components = $state<TamboComponent[]>([]);
  let tools = $state<TamboTool[]>([]);

  return {
    get components() {
      return components;
    },
    get tools() {
      return tools;
    },

    /**
     * Register components
     */
    registerComponents(newComponents: TamboComponent[]) {
      components = [...components, ...newComponents];
    },

    /**
     * Register tools
     */
    registerTools(newTools: TamboTool[]) {
      tools = [...tools, ...newTools];
    },

    /**
     * Get component by name
     */
    getComponent(name: string): Component | undefined {
      const found = components.find((c) => c.name === name);
      return found?.component as Component | undefined;
    },

    /**
     * Get tool by name
     */
    getTool(name: string): TamboTool | undefined {
      return tools.find((t) => t.name === name);
    },

    /**
     * Clear all registrations
     */
    clear() {
      components = [];
      tools = [];
    },
  };
}

export type RegistryStore = ReturnType<typeof createRegistryStore>;
