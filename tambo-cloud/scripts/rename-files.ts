import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

type ReplaceFunction = (substring: string, ...args: string[]) => string;

type Replacement = {
  from: RegExp;
  to: string | ReplaceFunction;
};

const replacements: Replacement[] = [
  // Specific package names first
  { from: /hydra-ai-server/g, to: "tambo-server" },
  { from: /hydra-ai-landing/g, to: "tambo-landing" },
  { from: /hydra-ai-react/g, to: "tambo-react" },
  { from: /hydra-ai-core/g, to: "tambo-core" },
  { from: /hydra-api/g, to: "tambo-api" },
  { from: /hydra-web/g, to: "tambo-web" },
  { from: /hydra-docs/g, to: "tambo-docs" },
  { from: /hydra-types/g, to: "tambo-types" },
  { from: /hydra-utils/g, to: "tambo-utils" },
  { from: /hydra-config/g, to: "tambo-config" },

  // Service and component directories
  { from: /services\/(?<!t)hydra-ai/g, to: "services/tambo" },
  { from: /src\/(?<!t)hydra-ai/g, to: "src/tambo" },

  // Config files
  {
    from: /(?<!t)hydra\.config\.[^/]+$/g,
    to: (match: string) => match.replace("hydra", "tambo"),
  },
  {
    from: /(?<!t)hydra\.setup\.[^/]+$/g,
    to: (match: string) => match.replace("hydra", "tambo"),
  },
  { from: /(?<!t)hydra\.json$/g, to: "tambo.json" },

  // General patterns (must come last)
  { from: /(?<!t)hydra[-_]ai[-_]([a-z0-9-_]+)/g, to: "tambo-$1" },
  { from: /(?<!t)hydra[-_]([a-z0-9-_]+)(?!t)/g, to: "tambo-$1" },
  { from: /([^-_t])hydra([^-_t])/g, to: "$1tambo$2" }, // matches internal hydra in names, excluding when next to 't'
  { from: /hydra_api/g, to: "tambo_api" },
];

const _ignorePatterns = [
  /node_modules/,
  /\.git/,
  /\.next/,
  /\.turbo/,
  /dist/,
  /build/,
  /scripts\/update-content\.ts/,
  /scripts\/update-package\.ts/,
  /scripts\/rename-files\.ts/,
];

async function main() {
  const renamedFiles = new Set<string>();
  const errors = new Set<string>();

  const files = execSync("git ls-files").toString().split("\n").filter(Boolean);
  console.log("\nRenaming files...");

  // Build rename operations
  const renameOps = files
    .map((file) => {
      const dir = path.dirname(file);
      const filename = path.basename(file);
      if (!filename) return null;

      let newFilename = filename;
      let newDir = dir;

      for (const { from, to } of replacements) {
        newFilename = newFilename.replace(from, to as string);
        newDir = newDir.replace(from, to as string);
      }

      return {
        oldPath: file,
        newPath: path.join(newDir, newFilename),
        shouldRename: newFilename !== filename || newDir !== dir,
      };
    })
    .filter((op): op is NonNullable<typeof op> => op !== null)
    .filter(({ shouldRename }) => shouldRename)
    .sort((a, b) => a.oldPath.split("/").length - b.oldPath.split("/").length);

  // Execute renames
  for (const { oldPath, newPath } of renameOps) {
    try {
      fs.mkdirSync(path.dirname(newPath), { recursive: true });
      execSync(`git mv "${oldPath}" "${newPath}"`);
      renamedFiles.add(`${oldPath} → ${newPath}`);
      console.log(`✓ Renamed: ${oldPath} → ${newPath}`);
    } catch (error) {
      errors.add(`Failed to rename ${oldPath}: ${error}`);
      console.error(`❌ Failed to rename ${oldPath}:`, error);
    }
  }

  console.log("\nSummary:");
  console.log(`- Renamed ${renamedFiles.size} files`);

  if (errors.size > 0) {
    console.log("\nErrors encountered:");
    errors.forEach((error) => console.log(`- ${error}`));
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
