#!/usr/bin/env node

const fs = require("fs").promises;
const core = require("@actions/core");

async function capturePreUpgrade() {
  try {
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));

    const preState = {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      timestamp: new Date().toISOString(),
    };

    await fs.writeFile(
      "pre-upgrade-state.json",
      JSON.stringify(preState, null, 2),
    );

    console.log("Pre-upgrade state captured");
    console.log(`Dependencies: ${Object.keys(preState.dependencies).length}`);
    console.log(
      `DevDependencies: ${Object.keys(preState.devDependencies).length}`,
    );
  } catch (error) {
    core.setFailed(`Pre-upgrade capture failed: ${error.message}`);
  }
}

capturePreUpgrade();
