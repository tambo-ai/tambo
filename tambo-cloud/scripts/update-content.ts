import { execSync } from "child_process";
import * as fs from "fs";

const replacements = [
  // PascalCase components and types
  { from: /(?<!t)Hydra([A-Z][a-zA-Z]*)/g, to: "Tambo$1" },
  { from: /HydraAI/g, to: "Tambo" },

  // camelCase variables and hooks
  { from: /useHydra([A-Z][a-zA-Z]*|\b|\()/g, to: "useTambo$1" },
  { from: /([a-z]+)Hydra([A-Z][a-zA-Z]*)/g, to: "$1Tambo$2" }, // matches useMessageHydra -> useMessageTambo
  { from: /(?<!t)hydra([A-Z][a-zA-Z]*)/g, to: "tambo$1" },
  { from: /hydraAI/g, to: "tambo" },

  // Package names and imports
  { from: /"name":\s*"@use-hydra-ai\/([^"]+)"/g, to: '"name": "@tambo/$1"' },
  { from: /"name":\s*"hydra-([^"]+)"/g, to: '"name": "tambo-$1"' },
  { from: /"@use-hydra-ai\/([^"]+)"/g, to: '"@tambo/$1"' },
  { from: /"hydra-([^"]+)"/g, to: '"tambo-$1"' },
  { from: /--filter=hydra-([^"'\s]+)/g, to: "--filter=tambo-$1" },
  { from: /@use-hydra-ai\//g, to: "@tambo/" },
  { from: /@use-hydra-ai/g, to: "@tambo" },
  { from: /use-hydra-ai/g, to: "tambo" },
  { from: /usehydra\.ai/gi, to: "tambo.co" },
  { from: /hydra\.ai/gi, to: "tambo.co" },

  // Social media handles
  { from: /usehydraai/gi, to: "tamboai" },
  { from: /@usehydraai/gi, to: "@tamboai" },

  // Service and folder names
  { from: /hydra-ai\/services/g, to: "tambo/services" },

  // Environment variables and constants
  { from: /NEXT_PUBLIC_HYDRA/g, to: "NEXT_PUBLIC_TAMBO" },
  { from: /HYDRA_AI/g, to: "TAMBO" },
  { from: /HYDRA_/g, to: "TAMBO_" },

  // Config files
  { from: /hydra\.config/gi, to: "tambo.config" },
  { from: /hydra\.setup/gi, to: "tambo.setup" },
  { from: /hydra\.json/gi, to: "tambo.json" },

  // Script names in package.json
  { from: /"hydra-api:([^"]+)"/g, to: '"tambo-api:$1"' },
  { from: /"hydra:([^"]+)"/g, to: '"tambo:$1"' },

  // General replacements (must come last)
  { from: /hydra-ai/gi, to: "tambo" },
  { from: /hydra_ai/gi, to: "tambo" },
  { from: /hydra ai/gi, to: "tambo" },
  { from: /\b(?<!t)hydra\b(?![-.:]|t)/gi, to: "tambo" }, // Don't match if preceded by 't' or followed by '-', '.' or 't'
];

const ignorePatterns = [
  /node_modules/,
  /\.git/,
  /\.next/,
  /\.turbo/,
  /dist/,
  /build/,
  /scripts\/update-content\.ts/,
  /scripts\/rename-files\.ts/,
  /\.env\.local/,
  /\.env\.production/,
  /\.env\.development/,
];

const textFileExtensions = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mdx",
  ".html",
  ".css",
  ".scss",
  ".yaml",
  ".yml",
  ".toml",
  ".txt",
  ".env.example",
  ".mjs",
  ".cjs",
  ".mdc",
  ".gitignore",
  ".npmrc",
  ".eslintrc",
  ".prettierrc",
  ".env",
  ".MD",
];

function shouldProcess(filePath: string): boolean {
  return (
    !ignorePatterns.some((pattern) => pattern.test(filePath)) &&
    textFileExtensions.some((ext) => filePath.endsWith(ext))
  );
}

async function main() {
  const changedFiles = new Set<string>();
  const errors = new Set<string>();

  const files = execSync("git ls-files").toString().split("\n").filter(Boolean);
  console.log("\nUpdating file contents...");

  for (const file of files) {
    if (!shouldProcess(file)) continue;

    try {
      const content = fs.readFileSync(file, "utf8");
      if (!content) continue;

      let newContent = content;
      let hadChanges = false;

      for (const { from, to } of replacements) {
        const tempContent = newContent.replace(from, to);
        if (tempContent !== newContent) {
          hadChanges = true;
          newContent = tempContent;
        }
      }

      if (hadChanges) {
        fs.writeFileSync(file, newContent, "utf8");
        changedFiles.add(file);
        console.log(`✓ Modified: ${file}`);
      }
    } catch (error) {
      errors.add(`Failed to process ${file}: ${error}`);
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  console.log("\nSummary:");
  console.log(`- Modified ${changedFiles.size} files`);

  if (errors.size > 0) {
    console.log("\nErrors encountered:");
    errors.forEach((error) => console.log(`- ${error}`));
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
