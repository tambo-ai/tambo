import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v3";

export interface ApiKeyValidationResult {
  isValid: boolean;
  error?: string;
  provider?: string;
  details?: {
    note?: string;
    modelCount?: number;
    quotaInfo?: any;
  };
}

const ApiKeyValidationOptionsSchema = z.object({
  allowEmpty: z.boolean().optional(),
  timeout: z.number().optional().default(10000),
});

// Provider configuration
const PROVIDER_CONFIGS = {
  openai: {
    endpoint: "https://api.openai.com/v1/models",
    headers: (key: string) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
  anthropic: {
    endpoint: "https://api.anthropic.com/v1/models",
    headers: (key: string) => ({
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    }),
  },
  mistral: {
    endpoint: "https://api.mistral.ai/v1/models",
    headers: (key: string) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
} as const;

export const validateRouter = createTRPCRouter({
  validateApiKey: protectedProcedure
    .input(
      z.object({
        apiKey: z.string(),
        provider: z.string(),
        options: ApiKeyValidationOptionsSchema.optional().default({}),
      }),
    )
    .query(async ({ input, signal }) => {
      const { apiKey, provider, options } = input;
      const { allowEmpty = false, timeout = 10000 } = options;

      if (!provider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required field: provider",
        });
      }

      if (!apiKey.trim()) {
        if (allowEmpty) {
          return {
            isValid: true,
            provider,
            details: {
              note: "Empty API key accepted for this provider",
            },
          };
        }
        return {
          isValid: false,
          error: "API key cannot be empty",
          provider,
        };
      }

      const config =
        PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS];

      if (!config) {
        if (provider === "openai-compatible") {
          return {
            isValid: true,
            provider,
            details: {
              note: "Format validation only - endpoint structures vary by provider",
            },
          };
        }
        return {
          isValid: true,
          provider,
          details: {
            note: "Dynamic validation not available for this provider - basic format validation only",
          },
        };
      }

      // Validate with the provider's API
      return await validateApiKey(
        apiKey.trim(),
        provider,
        config,
        timeout,
        signal,
      );
    }),
});

async function validateApiKey(
  key: string,
  provider: string,
  config: {
    endpoint: string;
    headers: (key: string) => Record<string, string>;
  },
  timeout: number,
  signal?: AbortSignal,
): Promise<ApiKeyValidationResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const combinedSignal = signal
      ? AbortSignal.any([controller.signal, signal])
      : controller.signal;

    const response = await fetch(config.endpoint, {
      method: "GET",
      headers: config.headers(key),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        isValid: true,
        provider,
        details: {
          modelCount: data.data?.length || 0,
        },
      };
    }

    // Handle common error cases
    switch (response.status) {
      case 401:
        return {
          isValid: false,
          error: "Invalid API key - authentication failed",
          provider,
        };
      case 429:
        return {
          isValid: false,
          error: "Rate limit exceeded - key is likely valid but rate limited",
          provider,
        };
      default: {
        const errorData = await response.json().catch(() => ({}));
        return {
          isValid: false,
          error: errorData.error?.message || `API error: ${response.status}`,
          provider,
        };
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        isValid: false,
        error: "Validation timed out",
        provider,
      };
    }
    throw error;
  }
}
