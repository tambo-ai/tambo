/**
 * Generates the SDK reference from skill files
 *
 * Reads canonical skill documentation from plugins/tambo/skills/ and writes
 * a generated TypeScript file that exports the combined content. This keeps
 * the execution prompt automatically in sync with the authoritative docs.
 *
 * Regenerate: npm run generate-sdk-reference -w cli
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.resolve(CLI_ROOT, "../plugins/tambo/skills");
const OUTPUT_FILE = path.resolve(
  CLI_ROOT,
  "src/utils/plan-generation/generated-sdk-reference.ts",
);

const SKILL_FILES = [
  "components/SKILL.md",
  "tools-and-context/SKILL.md",
  "cli/SKILL.md",
];

/**
 * Strip YAML frontmatter (--- delimited block at start of file)
 *
 * @returns Content with frontmatter removed
 */
function stripFrontmatter(content: string): string {
  const match = /^---\n[\s\S]*?\n---\n/.exec(content);
  if (match) {
    return content.slice(match[0].length).trim();
  }
  return content.trim();
}

function main(): void {
  console.log("Generating SDK reference from skill files...");

  const sections: string[] = [];

  for (const relativePath of SKILL_FILES) {
    const fullPath = path.join(SKILLS_DIR, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Skill file not found: ${fullPath}`);
    }

    const raw = fs.readFileSync(fullPath, "utf-8");
    const content = stripFrontmatter(raw);
    sections.push(content);
    console.log(`  ✓ Read ${relativePath}`);
  }

  const combined = sections.join("\n\n---\n\n");

  const output = `// AUTO-GENERATED — DO NOT EDIT
// Source: plugins/tambo/skills/
// Regenerate: npm run generate-sdk-reference -w cli

export const TAMBO_SDK_REFERENCE = ${JSON.stringify(combined)};
`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");

  console.log(`\nSDK reference written to ${OUTPUT_FILE}`);
}

main();
