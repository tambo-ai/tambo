import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";
import { execSync } from "child_process";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

interface PreUpgradeState {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  timestamp: string;
}

interface DependencyChange {
  name: string;
  before: string;
  after: string;
  type: "added" | "removed" | "updated";
}

interface UpgradeSummary {
  dependencyChanges: DependencyChange[];
  gitChanges: string[];
  timestamp: string;
}

function validateRequiredFiles(): void {
  const requiredFiles = ["pre-upgrade-state.json", "package.json"];
  const missingFiles = requiredFiles.filter((file) => !existsSync(file));

  if (missingFiles.length > 0) {
    console.error(`Missing required files: ${missingFiles.join(", ")}`);
    process.exit(1);
  }
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function detectDependencyChanges(
  preState: PreUpgradeState,
  currentPackage: PackageJson,
): DependencyChange[] {
  const currentDeps = {
    ...currentPackage.dependencies,
    ...currentPackage.devDependencies,
  };
  const preDeps = { ...preState.dependencies, ...preState.devDependencies };
  const changes: DependencyChange[] = [];

  // Find added and updated dependencies
  for (const [name, version] of Object.entries(currentDeps)) {
    if (!preDeps[name]) {
      changes.push({ name, before: "", after: version, type: "added" });
    } else if (preDeps[name] !== version) {
      changes.push({
        name,
        before: preDeps[name],
        after: version,
        type: "updated",
      });
    }
  }

  // Find removed dependencies
  for (const name of Object.keys(preDeps)) {
    if (!currentDeps[name]) {
      changes.push({ name, before: preDeps[name], after: "", type: "removed" });
    }
  }

  return changes;
}

function detectGitChanges(): string[] {
  try {
    const gitOutput = execSync("git diff --name-only", { encoding: "utf8" });
    return gitOutput.trim().split("\n").filter(Boolean);
  } catch (error) {
    console.warn("Unable to detect git changes:", error);
    return [];
  }
}

function setNoChangesEnv(): void {
  console.log("No changes detected, setting NO_CHANGES=true");
  if (process.env.GITHUB_ENV) {
    appendFileSync(process.env.GITHUB_ENV, "NO_CHANGES=true\n");
  }
}

async function capturePostUpgrade(): Promise<void> {
  validateRequiredFiles();

  const preState = readJsonFile<PreUpgradeState>("pre-upgrade-state.json");
  const currentPackage = readJsonFile<PackageJson>("package.json");

  const dependencyChanges = detectDependencyChanges(preState, currentPackage);
  const gitChanges = detectGitChanges();

  const summary: UpgradeSummary = {
    dependencyChanges,
    gitChanges,
    timestamp: new Date().toISOString(),
  };

  // Generate markdown summary
  let markdown = "# Tambo Upgrade Summary\n\n";

  if (dependencyChanges.length > 0) {
    markdown += "## Package Updates\n\n";
    dependencyChanges.forEach((change) => {
      const action =
        change.type === "added"
          ? "Added"
          : change.type === "removed"
            ? "Removed"
            : "Updated";
      if (change.type === "updated") {
        markdown += `- **${change.name}**: ${change.before} → ${change.after}\n`;
      } else {
        const version =
          change.type === "removed" ? change.before : change.after;
        markdown += `- **${action}**: ${change.name} ${version}\n`;
      }
    });
  }

  if (gitChanges.length > 0) {
    markdown += "\n## Modified Files\n\n";
    gitChanges.forEach((file) => (markdown += `- ${file}\n`));
  }

  if (dependencyChanges.length === 0 && gitChanges.length === 0) {
    markdown += "No changes detected in this upgrade.\n";
  }

  writeFileSync("upgrade-summary.md", markdown);
  writeFileSync("upgrade-summary.json", JSON.stringify(summary, null, 2));

  // Set NO_CHANGES environment variable for workflow
  const hasChanges = dependencyChanges.length > 0 || gitChanges.length > 0;
  if (!hasChanges) {
    setNoChangesEnv();
  } else {
    console.log(
      `Detected ${dependencyChanges.length} dependency changes and ${gitChanges.length} file changes`,
    );
  }

  console.log("Post-upgrade analysis complete");
}

capturePostUpgrade().catch((e) => console.error(e));
