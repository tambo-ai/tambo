/**
 * If you change this file, also update cli/src/utils/skill-frontmatter.ts
 * (the CLI has a local copy because it cannot import raw TS from this package).
 */
import { load as parseYaml, dump as dumpYaml } from "js-yaml";
import { z } from "zod";

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
    .min(1, "Missing 'name' in frontmatter"),
  description: z
    .string({ required_error: "Missing 'description' in frontmatter" })
    .min(1, "Missing 'description' in frontmatter"),
});

/**
 * Parse a SKILL.md string into its frontmatter fields and markdown instructions.
 * @returns A discriminated union indicating success (with name, description,
 *   instructions) or failure (with an error message).
 */
export function parseSkillContent(content: string): ParseResult {
  // Normalize \r\n to \n for Windows paste compatibility
  const normalized = content.replace(/\r\n/g, "\n");
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
    return {
      success: true,
      name: parsed.data.name,
      description: parsed.data.description,
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
