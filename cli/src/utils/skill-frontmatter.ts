/**
 * SKILL.md frontmatter parser for the CLI.
 *
 * This is a local copy of the parser in packages/core/src/skills-frontmatter.ts.
 * The CLI cannot import from @tambo-ai-cloud/core at runtime because that
 * package exposes raw TypeScript source (no build step), which breaks when
 * Node.js tries to resolve extensionless ESM imports.
 *
 * If you change this file, also update packages/core/src/skills-frontmatter.ts.
 */
import { load as parseYaml, dump as dumpYaml } from "js-yaml";

// Duplicated from packages/core/src/skills.ts (same constraint as above).
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKILL_NAME_MAX_LENGTH = 200;
const SKILL_DESCRIPTION_MAX_LENGTH = 2000;
const SKILL_INSTRUCTIONS_MAX_LENGTH = 100_000;

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
 * Validates name format, and enforces length limits matching the server-side schema.
 * @returns A discriminated union indicating success (with name, description,
 *   instructions) or failure (with an error message).
 */
export function parseSkillContent(content: string): ParseResult {
  // Normalize \r\n to \n for Windows paste compatibility
  const normalized = content.replace(/\r\n/g, "\n");

  // Match YAML frontmatter between the first pair of --- delimiters.
  // The non-greedy [\s\S]*? ensures we stop at the first closing ---.
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

    if (!SKILL_NAME_PATTERN.test(name)) {
      return {
        success: false,
        error:
          "Name must be kebab-case (lowercase letters, numbers, hyphens). Example: my-skill-name",
      };
    }
    if (name.length > SKILL_NAME_MAX_LENGTH) {
      return {
        success: false,
        error: `Name must be at most ${SKILL_NAME_MAX_LENGTH} characters`,
      };
    }
    if (description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
      return {
        success: false,
        error: `Description must be at most ${SKILL_DESCRIPTION_MAX_LENGTH} characters`,
      };
    }

    const instructions = match[2];
    if (instructions.length > SKILL_INSTRUCTIONS_MAX_LENGTH) {
      return {
        success: false,
        error: `Instructions must be at most ${SKILL_INSTRUCTIONS_MAX_LENGTH} characters`,
      };
    }

    return { success: true, name, description, instructions };
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
