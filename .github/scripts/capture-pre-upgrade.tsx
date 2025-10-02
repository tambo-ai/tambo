import { readFileSync, writeFileSync, existsSync } from "fs";

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

function validatePackageJson(): void {
  if (!existsSync("package.json")) {
    console.error("❌ package.json not found in current directory");
    process.exit(1);
  }
}

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync("package.json", "utf8"));
}

function savePreUpgradeState(state: PreUpgradeState): void {
  writeFileSync("pre-upgrade-state.json", JSON.stringify(state, null, 2));
  writeFileSync("package.json.before", readFileSync("package.json", "utf8"));
}

async function capturePreUpgrade(): Promise<void> {
  console.log("📦 Capturing pre-upgrade state...");

  validatePackageJson();
  const packageJson = readPackageJson();

  const state: PreUpgradeState = {
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {},
    timestamp: new Date().toISOString(),
  };

  savePreUpgradeState(state);

  const totalDeps =
    Object.keys(state.dependencies).length +
    Object.keys(state.devDependencies).length;
  console.log(`✅ Pre-upgrade state captured (${totalDeps} dependencies)`);
}

capturePreUpgrade().catch((e) => console.error(e));
