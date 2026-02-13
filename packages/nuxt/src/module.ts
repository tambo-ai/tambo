/**
 * @tambo-ai/nuxt — Nuxt 3 module for Tambo
 *
 * This module integrates @tambo-ai/vue composables into Nuxt 3
 * with auto-imports and SSR-compatible client initialization.
 *
 * Usage in nuxt.config.ts:
 * ```ts
 * export default defineNuxtConfig({
 *   modules: ['@tambo-ai/nuxt'],
 *   tambo: {
 *     apiKey: process.env.TAMBO_API_KEY,
 *   },
 * });
 * ```
 */

import { defineNuxtModule, addImports, addPlugin, createResolver } from "@nuxt/kit";

export interface TamboModuleOptions {
  /** Tambo API key — can also be set via NUXT_PUBLIC_TAMBO_API_KEY env var */
  apiKey?: string;
  /** Custom API URL (optional) */
  apiUrl?: string;
}

export default defineNuxtModule<TamboModuleOptions>({
  meta: {
    name: "@tambo-ai/nuxt",
    configKey: "tambo",
    compatibility: {
      nuxt: ">=3.8.0",
    },
  },
  defaults: {},
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);

    // Expose tambo options to runtime config
    nuxt.options.runtimeConfig.public.tambo = {
      apiKey: options.apiKey || "",
      apiUrl: options.apiUrl || "",
    };

    // Auto-import composables from @tambo-ai/vue
    addImports([
      { name: "useTambo", from: "@tambo-ai/vue" },
      { name: "useTamboThread", from: "@tambo-ai/vue" },
      { name: "useTamboThreadInput", from: "@tambo-ai/vue" },
      { name: "useTamboContext", from: "@tambo-ai/vue" },
    ]);

    // Add plugin for client-side Tambo initialization
    addPlugin(resolve("./runtime/plugin"));
  },
});
