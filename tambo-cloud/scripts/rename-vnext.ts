import * as fs from "fs";
import * as path from "path";

type ReplaceFunction = (substring: string, ...args: string[]) => string;

type Replacement = {
  from: RegExp;
  to: string | ReplaceFunction;
};

// Define replacements specific to the vnext content
const replacements: Replacement[] = [
  // PascalCase components and types
  { from: /(?<!t)Hydra([A-Z][a-zA-Z]*)/g, to: "Tambo$1" },
  { from: /HydraAI/g, to: "Tambo" },

  // camelCase variables and hooks
  { from: /useHydra([A-Z][a-zA-Z]*|\b|\()/g, to: "useTambo$1" },
  { from: /([a-z]+)Hydra([A-Z][a-zA-Z]*)/g, to: "$1Tambo$2" },
  { from: /(?<!t)hydra([A-Z][a-zA-Z]*)/g, to: "tambo$1" },
  { from: /hydraAI/g, to: "tambo" },

  // Package names and imports
  { from: /@use-hydra-ai\//g, to: "@tambo/" },
  { from: /@use-hydra-ai/g, to: "@tambo" },
  { from: /use-hydra-ai/g, to: "tambo" },
  { from: /usehydra\.ai/gi, to: "tambo.co" },
  { from: /hydra\.ai/gi, to: "tambo.co" },

  // Social media handles
  { from: /usehydraai/gi, to: "tamboai" },
  { from: /@usehydraai/gi, to: "@tamboai" },

  // General replacements (must come last)
  { from: /hydra-ai/gi, to: "tambo" },
  { from: /hydra_ai/gi, to: "tambo" },
  { from: /hydra ai/gi, to: "tambo" },
  { from: /\b(?<!t)hydra\b(?![-.:]|t)/gi, to: "tambo" }, // Don't match if preceded by 't' or followed by '-', '.' or 't'
];

// Define the vnext directory path
const vnextDir = "apps/web/content/vnext";

// File extensions to process
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
];

function shouldProcess(filePath: string): boolean {
  return textFileExtensions.some((ext) => filePath.endsWith(ext));
}

// Function to recursively get all files in a directory
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

async function main() {
  const changedFiles = new Set<string>();
  const errors = new Set<string>();

  console.log(`\nUpdating content in ${vnextDir}...`);

  try {
    // Get all files in the vnext directory
    const files = getAllFiles(vnextDir);

    for (const file of files) {
      if (!shouldProcess(file)) continue;

      try {
        const content = fs.readFileSync(file, "utf8");
        if (!content) continue;

        let newContent = content;
        let hadChanges = false;

        for (const { from, to } of replacements) {
          const tempContent = newContent.replace(from, to as string);
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
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
