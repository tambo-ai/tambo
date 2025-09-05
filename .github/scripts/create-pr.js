#!/usr/bin/env node

/**
 * Tambo PR Creation Script
 * Creates a pull request with the upgrade changes using GitHub CLI
 */

const fs = require("fs").promises;
const { execSync } = require("child_process");
const core = require("@actions/core");

class PRCreator {
  constructor() {
    this.summaryFile = process.env.UPGRADE_SUMMARY_FILE || "upgrade-summary.md";
    this.releaseTag = process.env.RELEASE_TAG;
    this.branchName = process.env.BRANCH_NAME;

    // Parse release info from environment
    try {
      const releaseInfo = JSON.parse(process.env.RELEASE_INFO || "{}");
      this.releaseName = releaseInfo.name;
      this.releaseUrl = releaseInfo.url;
      this.releaseTag = this.releaseTag || releaseInfo.tag;
    } catch (error) {
      this.log("warn", `Failed to parse RELEASE_INFO: ${error.message}`);
    }
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  execCommand(command, options = {}) {
    try {
      return execSync(command, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
        ...options,
      }).trim();
    } catch (error) {
      if (options.allowFailure) {
        return "";
      }
      throw error;
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readSummaryFile() {
    try {
      if (await this.fileExists(this.summaryFile)) {
        return await fs.readFile(this.summaryFile, "utf8");
      }
      return "No upgrade summary available.";
    } catch (error) {
      this.log("warn", `Failed to read summary file: ${error.message}`);
      return "Failed to read upgrade summary.";
    }
  }

  generatePRTitle() {
    if (this.releaseTag) {
      return `chore: upgrade to Tambo ${this.releaseTag}`;
    }
    return "chore: upgrade Tambo dependencies";
  }

  async generatePRBody() {
    const summary = await this.readSummaryFile();

    let body = "# 🚀 Tambo Template Upgrade\n\n";

    if (this.releaseName && this.releaseTag) {
      body += `This PR upgrades the template to use the latest Tambo release: **${this.releaseName}**\n\n`;
    } else {
      body +=
        "This PR upgrades the template to use the latest Tambo release.\n\n";
    }

    body += "## Release Information\n\n";

    if (this.releaseTag) {
      body += `- **Tag**: ${this.releaseTag}\n`;
    }

    if (this.releaseName && this.releaseUrl) {
      body += `- **Release**: [${this.releaseName}](${this.releaseUrl})\n`;
    } else if (this.releaseUrl) {
      body += `- **Release**: [View Release](${this.releaseUrl})\n`;
    }

    body += "\n## Upgrade Summary\n\n";
    body += summary;
    body += "\n\n---\n";
    body +=
      "*This PR was automatically created by the Tambo template maintenance workflow.*\n";

    return body;
  }

  async commitChanges() {
    try {
      this.log("info", "Committing changes...");

      // Add all changes
      this.execCommand("git add .");

      // Check if there are changes to commit
      const status = this.execCommand("git status --porcelain", {
        allowFailure: true,
      });
      if (!status) {
        this.log("warn", "No changes to commit");
        return false;
      }

      // Commit changes
      const commitMessage = this.generatePRTitle();
      this.execCommand(`git commit -m "${commitMessage}"`);

      this.log("info", "Changes committed successfully");
      return true;
    } catch (error) {
      this.log("error", `Failed to commit changes: ${error.message}`);
      throw error;
    }
  }

  async pushBranch() {
    try {
      this.log("info", `Pushing branch: ${this.branchName}`);

      if (!this.branchName) {
        throw new Error("BRANCH_NAME environment variable is required");
      }

      this.execCommand(`git push origin "${this.branchName}"`);

      this.log("info", "Branch pushed successfully");
      return true;
    } catch (error) {
      this.log("error", `Failed to push branch: ${error.message}`);
      throw error;
    }
  }

  async createPullRequest() {
    try {
      this.log("info", "Creating pull request...");

      const title = this.generatePRTitle();
      const body = await this.generatePRBody();

      // Write PR body to temporary file
      const bodyFile = "pr_body.md";
      await fs.writeFile(bodyFile, body);

      // Create PR using GitHub CLI
      const prCommand = [
        "gh pr create",
        `--title "${title}"`,
        `--body-file "${bodyFile}"`,
        `--head "${this.branchName}"`,
        "--base main",
      ].join(" ");

      const prOutput = this.execCommand(prCommand);

      // Clean up temporary file
      try {
        await fs.unlink(bodyFile);
      } catch (error) {
        this.log("warn", `Failed to clean up temporary file: ${error.message}`);
      }

      this.log("info", `Pull request created successfully: ${prOutput}`);

      // Extract PR URL from output
      const prUrl = prOutput.trim();
      core.setOutput("pr-url", prUrl);
      core.exportVariable("PR_URL", prUrl);

      return prUrl;
    } catch (error) {
      this.log("error", `Failed to create pull request: ${error.message}`);
      throw error;
    }
  }

  async validateEnvironment() {
    const requiredVars = ["BRANCH_NAME"];
    const missing = requiredVars.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`,
      );
    }

    // Check if gh CLI is available
    try {
      this.execCommand("gh --version");
    } catch (_error) {
      throw new Error("GitHub CLI (gh) is not available or not authenticated");
    }
  }

  async create() {
    try {
      this.log("info", "Starting PR creation process...");

      await this.validateEnvironment();

      const hasChanges = await this.commitChanges();
      if (!hasChanges) {
        this.log("info", "No changes to create PR for");
        return false;
      }

      await this.pushBranch();
      const prUrl = await this.createPullRequest();

      this.log("info", `PR creation completed successfully: ${prUrl}`);
      return true;
    } catch (error) {
      this.log("error", `PR creation failed: ${error.message}`);
      core.setFailed(error.message);
      return false;
    }
  }
}

// Run the PR creation if this script is executed directly
if (require.main === module) {
  const creator = new PRCreator();
  creator
    .create()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = PRCreator;
