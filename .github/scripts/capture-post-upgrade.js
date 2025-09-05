#!/usr/bin/env node

const fs = require("fs").promises;
const { execSync } = require("child_process");
const core = require("@actions/core");

async function capturePostUpgrade() {
  try {
    const preState = JSON.parse(
      await fs.readFile("pre-upgrade-state.json", "utf8"),
    );
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));

    const postState = {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      timestamp: new Date().toISOString(),
    };

    // Compare dependencies
    const changes = [];

    // Check regular dependencies
    for (const [name, version] of Object.entries(postState.dependencies)) {
      const oldVersion = preState.dependencies[name];
      if (oldVersion && oldVersion !== version) {
        changes.push(`- ${name}: ${oldVersion} → ${version}`);
      } else if (!oldVersion) {
        changes.push(`- ${name}: (new) → ${version}`);
      }
    }

    // Check dev dependencies
    for (const [name, version] of Object.entries(postState.devDependencies)) {
      const oldVersion = preState.devDependencies[name];
      if (oldVersion && oldVersion !== version) {
        changes.push(`- ${name}: ${oldVersion} → ${version} (dev)`);
      } else if (!oldVersion) {
        changes.push(`- ${name}: (new) → ${version} (dev)`);
      }
    }

    // Get git changes
    let gitChanges = "";
    try {
      gitChanges = execSync("git diff --name-only", {
        encoding: "utf8",
      }).trim();
    } catch (error) {
      gitChanges = "Unable to detect git changes";
    }

    // Generate summary
    const summary = `# Tambo Upgrade Summary

## Package Changes
${changes.length > 0 ? changes.join("\n") : "No package changes detected"}

## Files Modified
\`\`\`
${gitChanges}
\`\`\`

## Testing Checklist
- [ ] App builds successfully (\`npm run build\`)
- [ ] Core functionality works
- [ ] No TypeScript errors (\`npm run lint\`)

Generated at: ${postState.timestamp}
`;

    await fs.writeFile("upgrade-summary.md", summary);

    console.log("Post-upgrade summary generated");
    console.log(`Changes detected: ${changes.length}`);
  } catch (error) {
    core.setFailed(`Post-upgrade capture failed: ${error.message}`);
  }
}

capturePostUpgrade();
