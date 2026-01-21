import { parse } from "dotenv";

/**
 * The possible Tambo API key names (with framework-specific prefixes)
 */
export const TAMBO_API_KEY_NAMES = [
  "NEXT_PUBLIC_TAMBO_API_KEY",
  "VITE_TAMBO_API_KEY",
  "REACT_APP_TAMBO_API_KEY",
  "TAMBO_API_KEY",
] as const;

export type TamboApiKeyName = (typeof TAMBO_API_KEY_NAMES)[number];

interface TamboApiKeyInfo {
  keyName: TamboApiKeyName;
  value: string;
}

/**
 * Parses a dotenv file content string and returns key-value pairs
 * Uses the official dotenv parser for correct handling of quotes, escapes, etc.
 */
export function parseDotenvContent(
  content: string,
): Record<string, string | undefined> {
  return parse(content);
}

/**
 * Finds an existing Tambo API key in dotenv content
 * Checks all known key name variants in priority order
 * @returns The key info if found, null otherwise
 */
export function findTamboApiKey(content: string): TamboApiKeyInfo | null {
  const parsed = parseDotenvContent(content);

  for (const keyName of TAMBO_API_KEY_NAMES) {
    const value = parsed[keyName];
    if (value !== undefined) {
      return { keyName, value };
    }
  }

  return null;
}

/**
 * Finds all existing Tambo API key variants in dotenv content
 * @returns Array of key names found (may be empty)
 */
export function findAllTamboApiKeys(content: string): TamboApiKeyName[] {
  const parsed = parseDotenvContent(content);
  return TAMBO_API_KEY_NAMES.filter((keyName) => parsed[keyName] !== undefined);
}

/**
 * Sets a Tambo API key in dotenv content
 * Removes any existing Tambo API key variants and appends the new key at the end
 *
 * This is a simple, predictable approach:
 * 1. Remove lines that start with any Tambo API key variant
 * 2. Append the new key=value at the end
 *
 * @param content The existing dotenv file content
 * @param keyName The key name to use (e.g., NEXT_PUBLIC_TAMBO_API_KEY)
 * @param value The API key value
 * @returns The updated content string
 */
export function setTamboApiKey(
  content: string,
  keyName: TamboApiKeyName,
  value: string,
): string {
  // Split into lines, filter out any existing Tambo API key lines
  const lines = content.split("\n");
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    // Keep empty lines, comments, and non-Tambo-key lines
    return !TAMBO_API_KEY_NAMES.some((name) => trimmed.startsWith(`${name}=`));
  });

  // Join back and ensure we have a newline before appending
  let result = filteredLines.join("\n");

  // Ensure content ends with exactly one newline before adding the new key
  result = result.trimEnd();
  if (result.length > 0) {
    result += "\n";
  }

  // Append the new key
  result += `${keyName}=${value}\n`;

  return result;
}

/**
 * Removes all Tambo API key variants from dotenv content
 * @param content The existing dotenv file content
 * @returns The updated content string with all Tambo keys removed
 */
export function removeTamboApiKeys(content: string): string {
  const lines = content.split("\n");
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    return !TAMBO_API_KEY_NAMES.some((name) => trimmed.startsWith(`${name}=`));
  });

  return filteredLines.join("\n");
}
