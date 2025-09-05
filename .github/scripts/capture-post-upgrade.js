#!/usr/bin/env node

/**
 * Tambo Post-Upgrade Capture Script
 * Captures changes after the upgrade and generates a comprehensive summary
 */

const fs = require("fs").promises;
const { execSync } = require("child_process");
const core = require("@actions/core");

class PostUpgradeCapture {
  constructor() {
    this.summaryFile = process.env.UPGRADE_SUMMARY_FILE || "upgrade-summary.md";
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

  async hasGitChanges() {
    try {
      // Check for unstaged changes
      const unstagedChanges = this.execCommand("git diff --name-only", {
        allowFailure: true,
      });
      // Check for staged changes
      const stagedChanges = this.execCommand("git diff --cached --name-only", {
        allowFailure: true,
      });
      // Check for untracked files
      const untrackedFiles = this.execCommand(
        "git ls-files --others --exclude-standard",
        { allowFailure: true },
      );

      return (
        unstagedChanges.length > 0 ||
        stagedChanges.length > 0 ||
        untrackedFiles.length > 0
      );
    } catch (error) {
      this.log("warn", `Failed to check git changes: ${error.message}`);
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

  async readPackageJsonBefore() {
    try {
      if (await this.fileExists("package.json.before")) {
        const content = await fs.readFile("package.json.before", "utf8");
        return JSON.parse(content);
      }
      return null;
    } catch (error) {
      this.log("warn", `Failed to read package.json.before: ${error.message}`);
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

  compareDependencies(before, after, type = "dependencies") {
    const beforeDeps = before?.[type] || {};
    const afterDeps = after?.[type] || {};

    const changes = {
      added: {},
      removed: {},
      updated: {},
    };

    // Find added and updated dependencies
    for (const [name, version] of Object.entries(afterDeps)) {
      if (!beforeDeps[name]) {
        changes.added[name] = version;
      } else if (beforeDeps[name] !== version) {
        changes.updated[name] = { from: beforeDeps[name], to: version };
      }
    }

    // Find removed dependencies
    for (const [name, version] of Object.entries(beforeDeps)) {
      if (!afterDeps[name]) {
        changes.removed[name] = version;
      }
    }

    return changes;
  }

  formatDependencyChanges(changes, type) {
    let output = "";

    if (Object.keys(changes.added).length > 0) {
      output += `### ✅ Added ${type}\n\n`;
      for (const [name, version] of Object.entries(changes.added)) {
        output += `- **${name}**: ${version}\n`;
      }
      output += "\n";
    }

    if (Object.keys(changes.updated).length > 0) {
      output += `### 🔄 Updated ${type}\n\n`;
      for (const [name, { from, to }] of Object.entries(changes.updated)) {
        output += `- **${name}**: ${from} → ${to}\n`;
      }
      output += "\n";
    }

    if (Object.keys(changes.removed).length > 0) {
      output += `### ❌ Removed ${type}\n\n`;
      for (const [name, version] of Object.entries(changes.removed)) {
        output += `- **${name}**: ${version}\n`;
      }
      output += "\n";
    }

    return output;
  }

  async generatePostUpgradeSummary() {
    try {
      this.log("info", "Generating post-upgrade summary...");

      const hasChanges = await this.hasGitChanges();

      if (!hasChanges) {
        this.log("info", "No changes detected after upgrade");
        core.exportVariable("NO_CHANGES", "true");
        return false;
      }

      const packageJsonBefore = await this.readPackageJsonBefore();
      const packageJsonAfter = await this.readPackageJson();

      // Read existing summary
      let summary = "";
      if (await this.fileExists(this.summaryFile)) {
        summary = await fs.readFile(this.summaryFile, "utf8");
      }

      summary += "\n## Post-Upgrade Analysis\n\n";
      summary += `Analysis completed at: ${new Date().toISOString()}\n\n`;

      // Package dependency changes
      if (packageJsonBefore && packageJsonAfter) {
        const depChanges = this.compareDependencies(
          packageJsonBefore,
          packageJsonAfter,
          "dependencies",
        );
        const devDepChanges = this.compareDependencies(
          packageJsonBefore,
          packageJsonAfter,
          "devDependencies",
        );
        const peerDepChanges = this.compareDependencies(
          packageJsonBefore,
          packageJsonAfter,
          "peerDependencies",
        );

        const hasDepChanges =
          Object.keys(depChanges.added).length > 0 ||
          Object.keys(depChanges.updated).length > 0 ||
          Object.keys(depChanges.removed).length > 0;

        const hasDevDepChanges =
          Object.keys(devDepChanges.added).length > 0 ||
          Object.keys(devDepChanges.updated).length > 0 ||
          Object.keys(devDepChanges.removed).length > 0;

        const hasPeerDepChanges =
          Object.keys(peerDepChanges.added).length > 0 ||
          Object.keys(peerDepChanges.updated).length > 0 ||
          Object.keys(peerDepChanges.removed).length > 0;

        if (hasDepChanges || hasDevDepChanges || hasPeerDepChanges) {
          summary += "## 📦 Dependency Changes\n\n";

          if (hasDepChanges) {
            summary += "### Dependencies\n\n";
            summary += this.formatDependencyChanges(depChanges, "Dependencies");
          }

          if (hasDevDepChanges) {
            summary += "### Dev Dependencies\n\n";
            summary += this.formatDependencyChanges(
              devDepChanges,
              "Dev Dependencies",
            );
          }

          if (hasPeerDepChanges) {
            summary += "### Peer Dependencies\n\n";
            summary += this.formatDependencyChanges(
              peerDepChanges,
              "Peer Dependencies",
            );
          }
        } else {
          summary += "## 📦 Dependency Changes\n\n";
          summary += "No dependency changes detected.\n\n";
        }
      }

      // Git diff
      try {
        const gitDiff = this.execCommand("git diff", { allowFailure: true });
        if (gitDiff) {
          summary += "## 🔍 File Changes\n\n";
          summary += "```diff\n";
          summary += gitDiff;
          summary += "\n```\n\n";
        }
      } catch (error) {
        this.log("warn", `Failed to get git diff: ${error.message}`);
      }

      // Changed files list
      try {
        const changedFiles = this.execCommand("git diff --name-only", {
          allowFailure: true,
        });
        if (changedFiles) {
          summary += "## 📁 Modified Files\n\n";
          changedFiles.split("\n").forEach((file) => {
            if (file.trim()) {
              summary += `- ${file}\n`;
            }
          });
          summary += "\n";
        }
      } catch (error) {
        this.log("warn", `Failed to get changed files: ${error.message}`);
      }

      await fs.writeFile(this.summaryFile, summary);
      this.log("info", `Post-upgrade summary saved to ${this.summaryFile}`);

      return true;
    } catch (error) {
      this.log(
        "error",
        `Failed to generate post-upgrade summary: ${error.message}`,
      );
      throw error;
    }
  }

  async capture() {
    try {
      this.log("info", "Starting post-upgrade capture...");

      const hasChanges = await this.generatePostUpgradeSummary();

      if (!hasChanges) {
        this.log("info", "No changes detected - skipping further processing");
        return false;
      }

      // Set GitHub Actions outputs
      core.setOutput("has-changes", "true");
      core.setOutput("summary-file", this.summaryFile);

      this.log("info", "Post-upgrade capture completed successfully");
      return true;
    } catch (error) {
      this.log("error", `Post-upgrade capture failed: ${error.message}`);
      core.setFailed(error.message);
      return false;
    }
  }
}

// Run the capture if this script is executed directly
if (require.main === module) {
  const capture = new PostUpgradeCapture();
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

module.exports = PostUpgradeCapture;
