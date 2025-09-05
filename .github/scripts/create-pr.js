#!/usr/bin/env node

const fs = require("fs").promises;
const { execSync } = require("child_process");
const core = require("@actions/core");

async function createPR() {
  try {
    const releaseTag = process.env.RELEASE_TAG || "latest";
    const branchName = `tambo-upgrade-${releaseTag.replace(/[^a-zA-Z0-9]/g, "-")}`;

    // Read the upgrade summary
    let summary =
      "# Tambo Upgrade\n\nThis PR updates your template to the latest Tambo release.";
    try {
      summary = await fs.readFile("upgrade-summary.md", "utf8");
    } catch (error) {
      console.log("No upgrade summary found, using default");
    }

    // Check if there are changes to commit
    let hasChanges = false;
    try {
      const gitStatus = execSync("git status --porcelain", {
        encoding: "utf8",
      });
      hasChanges = gitStatus.trim().length > 0;
    } catch (error) {
      console.log("Unable to check git status");
    }

    if (!hasChanges) {
      console.log("No changes to commit");
      return;
    }

    // Create and switch to new branch
    execSync(`git checkout -b ${branchName}`);

    // Stage and commit changes
    execSync("git add .");
    execSync(`git commit -m "chore: upgrade tambo to ${releaseTag}"`);

    // Push branch
    execSync(`git push origin ${branchName}`);

    // Create PR using GitHub CLI
    const prTitle = `Tambo Upgrade - ${releaseTag}`;
    execSync(
      `gh pr create --title "${prTitle}" --body "${summary.replace(/"/g, '\\"')}" --head ${branchName}`,
    );

    console.log(`PR created successfully: ${prTitle}`);
  } catch (error) {
    core.setFailed(`PR creation failed: ${error.message}`);
  }
}

createPR();
