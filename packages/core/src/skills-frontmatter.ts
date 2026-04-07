/**
 * If you change this file, also update cli/src/utils/skill-frontmatter.ts
 * (the CLI has a local copy because it cannot import raw TS from this package).
 */
import { load as parseYaml, dump as dumpYaml } from "js-yaml";
import { z } from "zod";
import {
  SKILL_NAME_PATTERN,
  SKILL_NAME_MAX_LENGTH,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_INSTRUCTIONS_MAX_LENGTH,
} from "./skills";

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

const frontmatterSchema = z.object({
  name: z
    .string({ required_error: "Missing 'name' in frontmatter" })
    .min(1, "Missing 'name' in frontmatter")
    .max(
      SKILL_NAME_MAX_LENGTH,
      `Name must be at most ${SKILL_NAME_MAX_LENGTH} characters`,
    )
    .regex(
      SKILL_NAME_PATTERN,
      "Name must be kebab-case (e.g. scheduling-assistant)",
    ),
  description: z
    .string({ required_error: "Missing 'description' in frontmatter" })
    .min(1, "Missing 'description' in frontmatter")
    .max(
      SKILL_DESCRIPTION_MAX_LENGTH,
      `Description must be at most ${SKILL_DESCRIPTION_MAX_LENGTH} characters`,
    ),
});

/**
 * Parse a SKILL.md string into its frontmatter fields and markdown instructions.
 * Validates name format and enforces length limits matching the server-side schema.
 * @returns A discriminated union indicating success (with name, description,
 *   instructions) or failure (with an error message).
 */
export function parseSkillContent(content: string): ParseResult {
  // Normalize \r\n to \n for Windows paste compatibility
  const normalized = content.replace(/\r\n/g, "\n");

  // Match YAML frontmatter between the first pair of --- delimiters.
  // The non-greedy [\s\S]*? ensures we stop at the first closing ---.
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return {
      success: false,
      error: "No YAML frontmatter found (wrap with --- delimiters)",
    };
  }

  try {
    const raw = parseYaml(match[1]);
    const parsed = frontmatterSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const instructions = match[2];
    if (instructions.length > SKILL_INSTRUCTIONS_MAX_LENGTH) {
      return {
        success: false,
        error: `Instructions must be at most ${SKILL_INSTRUCTIONS_MAX_LENGTH} characters`,
      };
    }

    return {
      success: true,
      name: parsed.data.name,
      description: parsed.data.description,
      instructions,
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
