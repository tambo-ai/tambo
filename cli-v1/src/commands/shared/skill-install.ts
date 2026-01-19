import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { COMPONENT_SUBDIR } from "../../constants/paths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SkillInstallOptions {
  prefix?: string;
  silent?: boolean;
}

export interface SkillInstallResult {
  installed: boolean;
  targetPath: string;
  filesInstalled: string[];
}

function getComponentDir(prefix?: string): string {
  const root = process.cwd();

  // Standard paths to check (in order of preference)
  const srcPath = path.join(root, "src", "components", COMPONENT_SUBDIR);
  const rootPath = path.join(root, "components", COMPONENT_SUBDIR);

  // If prefix is provided, it's an explicit CLI --prefix flag
  if (prefix) {
    const prefixPath = path.join(root, prefix);
    // Check if it already ends with the component subdir
    if (prefix.endsWith(COMPONENT_SUBDIR)) {
      return prefixPath;
    }
    return path.join(prefixPath, COMPONENT_SUBDIR);
  }

  // Auto-detect: check standard locations
  if (fs.existsSync(srcPath)) return srcPath;
  if (fs.existsSync(rootPath)) return rootPath;
  return srcPath;
}

/**
 * Recursively lists all files in a directory (relative paths)
 */
function listFilesRecursive(dir: string, base = ""): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relativePath = base ? path.join(base, entry.name) : entry.name;
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(path.join(dir, entry.name), relativePath));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

/**
 * Installs the tambo skill files to the component directory for AI agent guidance.
 * Copies the entire skill directory structure (SKILL.md, commands/, references/, assets/).
 *
 * @returns Details about what was installed
 */
export async function installSkill(
  options: SkillInstallOptions = {},
): Promise<SkillInstallResult> {
  const componentDir = getComponentDir(options.prefix);
  const skillSourceDir = path.join(__dirname, "../../../skills/tambov1");

  // Validate source exists
  if (!fs.existsSync(skillSourceDir)) {
    throw new Error(`Skill source directory not found: ${skillSourceDir}`);
  }

  // Ensure component directory exists
  fs.mkdirSync(componentDir, { recursive: true });

  // Copy entire skill directory using native fs.cpSync (Node 16.7+)
  fs.cpSync(skillSourceDir, componentDir, { recursive: true });

  // Get list of files that were installed
  const filesInstalled = listFilesRecursive(skillSourceDir);

  return {
    installed: true,
    targetPath: componentDir,
    filesInstalled,
  };
}
