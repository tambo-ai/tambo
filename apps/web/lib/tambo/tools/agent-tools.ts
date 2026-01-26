import {
  updateProjectAgentSettingsToolInput as updateProjectAgentSettingsInputSchema,
  updateProjectAgentSettingsOutputSchema,
} from "@/lib/schemas/agent";
import { invalidateLlmSettingsCache, invalidateProjectCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";
import type { z } from "zod/v3";

// NOTE: `updateProjectAgentSettingsToolInput` models `agentHeaders` as `z.unknown()`
// to keep the tool input schema JSON-schema compatible. We validate/normalize
// before calling the tRPC mutation.
type UpdateProjectAgentSettingsToolInput = z.infer<
  typeof updateProjectAgentSettingsInputSchema
>;

function formatAgentHeaderKeyForError(key: string): string {
  const maxLength = 120;
  const truncatedKey =
    key.length > maxLength ? `${key.slice(0, maxLength)}…` : key;
  return JSON.stringify(truncatedKey);
}

// Block keys commonly used in prototype pollution attacks. This is defense-in-depth
// alongside using a null-prototype accumulator.
function isPrototypePollutionKey(key: string): boolean {
  return key === "__proto__" || key === "prototype" || key === "constructor";
}

// DoS guardrails for agent-provided headers. These are conservative limits chosen
// to stay comfortably within typical server/proxy header size bounds while still
// allowing realistic usage. Increase only with security review.
const maxAgentProvidedHeaderCount = 50;
const maxAgentProvidedHeaderNameLength = 200;
const maxAgentProvidedHeaderValueLength = 8_000;
const maxAgentProvidedHeadersTotalBytes = 16_000;

function getUtf8ByteLength(value: string): number {
  if (
    typeof Buffer !== "undefined" &&
    typeof Buffer.byteLength === "function"
  ) {
    return Buffer.byteLength(value, "utf8");
  }

  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }

  let bytes = 0;
  for (let i = 0; i < value.length; i++) {
    const codePoint = value.codePointAt(i);
    if (!codePoint) {
      continue;
    }

    if (codePoint <= 0x7f) {
      bytes += 1;
    } else if (codePoint <= 0x7ff) {
      bytes += 2;
    } else if (codePoint <= 0xffff) {
      bytes += 3;
    } else {
      bytes += 4;
      i++;
    }
  }

  return bytes;
}

// Header-name policy for this tool boundary:
// - Visible ASCII only (no whitespace / control characters)
// - Disallow ":" (header separator), and a small set of punctuation characters that
//   can cause downstream parsing/logging ambiguities: '"', '\\', ',', ';'.
// This is intentionally not a full RFC 7230 token implementation.
function isSafeHeaderName(key: string): boolean {
  if (key.length === 0) {
    return false;
  }

  for (let i = 0; i < key.length; i++) {
    const charCode = key.charCodeAt(i);
    // Allow visible ASCII only; disallow ":" (which would conflict with header parsing).
    // Also disallow quotes and backslashes to avoid downstream parsing/logging issues.
    if (
      charCode < 0x21 ||
      charCode > 0x7e ||
      charCode === 0x3a ||
      charCode === 0x22 ||
      charCode === 0x5c ||
      charCode === 0x2c ||
      charCode === 0x3b
    ) {
      return false;
    }
  }

  return true;
}

function hasUnsafeHeaderValueChars(value: string): boolean {
  for (const char of value) {
    const charCode = char.charCodeAt(0);
    // Disallow CTL characters (0x00-0x1F, 0x7F) per RFC 7230. We intentionally
    // disallow all control characters (including horizontal tab).
    if (charCode <= 0x1f || charCode === 0x7f) {
      return true;
    }
  }

  return false;
}

function normalizeAgentHeaders(
  agentHeaders: unknown,
): Record<string, string> | null | undefined {
  // Tool inputs are expected to be plain JSON objects; we intentionally reject
  // other collection types here (Map, Headers, etc.).
  if (agentHeaders === null || agentHeaders === undefined) {
    return agentHeaders;
  }

  if (typeof agentHeaders !== "object" || Array.isArray(agentHeaders)) {
    throw new Error(
      "Invalid agentHeaders: must be an object mapping string keys to string values (e.g. { key: 'value' })",
    );
  }

  const agentHeadersPrototype = Object.getPrototypeOf(agentHeaders);
  if (
    agentHeadersPrototype !== Object.prototype &&
    agentHeadersPrototype !== null
  ) {
    throw new Error(
      "Invalid agentHeaders: must be a plain object with prototype null or Object.prototype",
    );
  }

  if (Object.getOwnPropertySymbols(agentHeaders).length > 0) {
    throw new Error(
      "Invalid agentHeaders: symbol keys are not allowed; header names must be strings",
    );
  }

  const headers = Object.create(null) as Record<string, string>;

  let headerCount = 0;
  let totalBytes = 0;
  // Use `for...in` + `hasOwnProperty.call` so we can stop early on large objects without
  // allocating intermediate arrays (DoS guardrail) and so we work with null-prototype
  // objects.
  for (const key in agentHeaders as Record<string, unknown>) {
    if (!Object.prototype.hasOwnProperty.call(agentHeaders, key)) {
      continue;
    }

    const value = (agentHeaders as Record<string, unknown>)[key];

    headerCount++;
    if (headerCount > maxAgentProvidedHeaderCount) {
      throw new Error(
        `Invalid agentHeaders: too many headers (max ${maxAgentProvidedHeaderCount})`,
      );
    }

    if (key.length > maxAgentProvidedHeaderNameLength) {
      throw new Error(
        `Invalid agentHeaders: header name too long ${formatAgentHeaderKeyForError(key)}`,
      );
    }
    if (isPrototypePollutionKey(key)) {
      throw new Error(
        `Invalid agentHeaders: forbidden key ${formatAgentHeaderKeyForError(key)}`,
      );
    }
    if (!isSafeHeaderName(key)) {
      throw new Error(
        `Invalid agentHeaders: invalid header name ${formatAgentHeaderKeyForError(key)}`,
      );
    }
    if (typeof value !== "string") {
      throw new Error(
        `Invalid agentHeaders: value for header ${formatAgentHeaderKeyForError(key)} must be a string (received ${typeof value})`,
      );
    }

    if (value.length > maxAgentProvidedHeaderValueLength) {
      throw new Error(
        `Invalid agentHeaders: header value too long for ${formatAgentHeaderKeyForError(key)}`,
      );
    }

    const keyBytes = getUtf8ByteLength(key);
    const valueBytes = getUtf8ByteLength(value);
    const nextTotalBytes = totalBytes + keyBytes + valueBytes;
    if (nextTotalBytes > maxAgentProvidedHeadersTotalBytes) {
      throw new Error(
        `Invalid agentHeaders: total header names + values too large when adding ${formatAgentHeaderKeyForError(key)} (${nextTotalBytes} bytes, max ${maxAgentProvidedHeadersTotalBytes} bytes)`,
      );
    }
    totalBytes = nextTotalBytes;

    if (hasUnsafeHeaderValueChars(value)) {
      throw new Error(
        `Invalid agentHeaders: header value for ${formatAgentHeaderKeyForError(key)} contains control characters`,
      );
    }
    headers[key] = value;
  }

  return headers;
}

/**
 * Register agent-specific settings management tools
 */
export function registerAgentTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to update agent settings for a project.
   * Updates the provider type (LLM or AGENT) and agent-specific configurations.
   * @returns Updated agent settings
   */
  registerTool({
    name: "updateProjectAgentSettings",
    description:
      "Updates agent settings for a project, including provider type and agent-specific configurations. Requires complete project ID.",
    tool: async ({
      projectId,
      providerType,
      agentProviderType,
      agentUrl,
      agentName,
      agentHeaders,
    }: UpdateProjectAgentSettingsToolInput) => {
      const result =
        await ctx.trpcClient.project.updateProjectAgentSettings.mutate({
          projectId,
          providerType,
          agentProviderType,
          agentUrl,
          agentName,
          agentHeaders: normalizeAgentHeaders(agentHeaders),
        });

      // Invalidate all caches that display agent settings (shown in LLM settings view)
      await Promise.all([
        invalidateLlmSettingsCache(ctx, projectId),
        ctx.utils.project.getProjectById.invalidate(projectId),
        invalidateProjectCache(ctx),
      ]);

      return result;
    },
    inputSchema: updateProjectAgentSettingsInputSchema,
    outputSchema: updateProjectAgentSettingsOutputSchema,
  });
}
