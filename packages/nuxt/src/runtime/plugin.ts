/**
 * Nuxt plugin that initializes the Tambo client on the client side.
 * Reads the API key from runtime config and provides it to the Vue app.
 */
import { defineNuxtPlugin, useRuntimeConfig } from "#app";
import { TamboClient } from "@tambo-ai/typescript-sdk";

export default defineNuxtPlugin((_nuxtApp) => {
  const config = useRuntimeConfig();
  const tamboConfig = config.public.tambo as { apiKey: string; apiUrl?: string };

  if (!tamboConfig.apiKey) {
    console.warn(
      "[@tambo-ai/nuxt] No API key found. Set `tambo.apiKey` in nuxt.config.ts " +
        "or NUXT_PUBLIC_TAMBO_API_KEY environment variable."
    );
    return {};
  }

  const client = new TamboClient({
    apiKey: tamboConfig.apiKey,
    ...(tamboConfig.apiUrl ? { apiUrl: tamboConfig.apiUrl } : {}),
  });

  return {
    provide: {
      tambo: client,
    },
  };
});
