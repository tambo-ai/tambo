#!/usr/bin/env node

/**
 * Tambo Pre-Upgrade Capture Script
 * Captures the current state of packages before running the upgrade
 */

const fs = require("fs").promises;
const path = require("path");
const core = require("@actions/core");

class PreUpgradeCapture {
  constructor() {
    this.summaryFile = "upgrade-summary.md";
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readPackageJson() {
    try {
      if (await this.fileExists("package.json")) {
        const content = await fs.readFile("package.json", "utf8");
        return JSON.parse(content);
      }
      return null;
    } catch (error) {
      this.log("warn", `Failed to read package.json: ${error.message}`);
      return null;
    }
  }

  formatDependencies(deps) {
    if (!deps || Object.keys(deps).length === 0) {
      return "No dependencies found";
    }

    return Object.entries(deps)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, version]) => `  "${name}": "${version}"`)
      .join(",\n");
  }

  async generatePreUpgradeSummary() {
    try {
      this.log("info", "Generating pre-upgrade summary...");

      const packageJson = await this.readPackageJson();

      let summary = "# Pre-upgrade State\n\n";
      summary += `Generated at: ${new Date().toISOString()}\n\n`;

      if (packageJson) {
        summary += "## Package Information\n\n";
        summary += `**Name**: ${packageJson.name || "Unknown"}\n`;
        summary += `**Version**: ${packageJson.version || "Unknown"}\n\n`;

        // Dependencies
        if (packageJson.dependencies) {
          summary += "## Dependencies (Before Upgrade)\n\n";
          summary += "```json\n{\n";
          summary += this.formatDependencies(packageJson.dependencies);
          summary += "\n}\n```\n\n";
        }

        // Dev Dependencies
        if (packageJson.devDependencies) {
          summary += "## Dev Dependencies (Before Upgrade)\n\n";
          summary += "```json\n{\n";
          summary += this.formatDependencies(packageJson.devDependencies);
          summary += "\n}\n```\n\n";
        }

        // Peer Dependencies
        if (packageJson.peerDependencies) {
          summary += "## Peer Dependencies (Before Upgrade)\n\n";
          summary += "```json\n{\n";
          summary += this.formatDependencies(packageJson.peerDependencies);
          summary += "\n}\n```\n\n";
        }

        // Scripts
        if (packageJson.scripts) {
          summary += "## Scripts\n\n";
          summary += "```json\n{\n";
          summary += this.formatDependencies(packageJson.scripts);
          summary += "\n}\n```\n\n";
        }
      } else {
        summary += "## Package Information\n\n";
        summary += "No package.json found in the current directory.\n\n";
      }

      // Save backup of package.json for comparison
      if (packageJson) {
        await fs.writeFile(
          "package.json.before",
          JSON.stringify(packageJson, null, 2),
        );
        this.log("info", "Saved package.json backup as package.json.before");
      }

      await fs.writeFile(this.summaryFile, summary);
      this.log("info", `Pre-upgrade summary saved to ${this.summaryFile}`);

      return summary;
    } catch (error) {
      this.log(
        "error",
        `Failed to generate pre-upgrade summary: ${error.message}`,
      );
      throw error;
    }
  }

  async capture() {
    try {
      this.log("info", "Starting pre-upgrade capture...");

      const summary = await this.generatePreUpgradeSummary();

      // Set GitHub Actions output
      core.setOutput("summary-file", this.summaryFile);
      core.exportVariable("UPGRADE_SUMMARY_FILE", this.summaryFile);

      this.log("info", "Pre-upgrade capture completed successfully");
      return true;
    } catch (error) {
      this.log("error", `Pre-upgrade capture failed: ${error.message}`);
      core.setFailed(error.message);
      return false;
    }
  }
}

// Run the capture if this script is executed directly
if (require.main === module) {
  const capture = new PreUpgradeCapture();
  capture
    .capture()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = PreUpgradeCapture;
