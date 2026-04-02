/**
 * SKILL.md frontmatter parser for the CLI.
 *
 * This is a local copy of the parser in packages/core/src/skills-frontmatter.ts.
 * The CLI cannot import from @tambo-ai-cloud/core at runtime because that
 * package exposes raw TypeScript source (no build step), which breaks when
 * Node.js tries to resolve extensionless ESM imports.
 */
import { load as parseYaml, dump as dumpYaml } from "js-yaml";

interface ParseSuccess {
  success: true;
  name: string;
  description: string;
  instructions: string;
}

interface ParseFailure {
  success: false;
  error: string;
}

export type ParseResult = ParseSuccess | ParseFailure;

/**
 * Parse a SKILL.md string into its frontmatter fields and markdown instructions.
 * @returns A discriminated union indicating success (with name, description,
 *   instructions) or failure (with an error message).
 */
export function parseSkillContent(content: string): ParseResult {
  // Normalize \r\n to \n for Windows paste compatibility
  const normalized = content.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  if (!match) {
    return {
      success: false,
      error: "No YAML frontmatter found (wrap with --- delimiters)",
    };
  }

  try {
    const raw = parseYaml(match[1]) as Record<string, unknown> | null;
    if (!raw || typeof raw !== "object") {
      return { success: false, error: "Invalid YAML in frontmatter" };
    }

    const name = raw.name;
    const description = raw.description;

    if (typeof name !== "string" || name.length === 0) {
      return { success: false, error: "Missing 'name' in frontmatter" };
    }
    if (typeof description !== "string" || description.length === 0) {
      return { success: false, error: "Missing 'description' in frontmatter" };
    }

    return {
      success: true,
      name,
      description,
      instructions: match[2],
    };
  } catch {
    return { success: false, error: "Invalid YAML in frontmatter" };
  }
}

/**
 * Reconstruct a SKILL.md string from its constituent parts.
 * Uses js-yaml dump() for correct YAML escaping of special characters.
 * @returns A SKILL.md formatted string with YAML frontmatter and markdown body.
 */
export function reconstructSkillContent(
  name: string,
  description: string,
  instructions: string,
): string {
  const frontmatter = dumpYaml({ name, description }, { lineWidth: -1 });
  return `---\n${frontmatter}---\n${instructions}`;
}
