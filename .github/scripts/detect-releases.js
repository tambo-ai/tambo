#!/usr/bin/env node

/**
 * Tambo Release Detection Script
 * Detects if the latest releases from the Release Please workflow are relevant for template upgrades
 */

const { Octokit } = require("@octokit/rest");
const core = require("@actions/core");

class ReleaseDetector {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    this.owner = process.env.GITHUB_REPOSITORY?.split("/")[0];
    this.repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
    this.workflowRunId = process.env.WORKFLOW_RUN_ID;
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  async getWorkflowRun() {
    try {
      const { data: workflowRun } =
        await this.octokit.rest.actions.getWorkflowRun({
          owner: this.owner,
          repo: this.repo,
          run_id: this.workflowRunId,
        });
      return workflowRun;
    } catch (error) {
      this.log("error", `Failed to get workflow run: ${error.message}`);
      throw error;
    }
  }

  async getRecentReleases() {
    try {
      const { data: releases } = await this.octokit.rest.repos.listReleases({
        owner: this.owner,
        repo: this.repo,
        per_page: 10,
      });
      return releases;
    } catch (error) {
      this.log("error", `Failed to get releases: ${error.message}`);
      throw error;
    }
  }

  isRelevantRelease(release) {
    const relevantPrefixes = [
      "cli-v",
      "create-tambo-app-v",
      "docs-v",
      "react-sdk-v",
      "showcase-v",
    ];
    return relevantPrefixes.some((prefix) =>
      release.tag_name.startsWith(prefix),
    );
  }

  async findRecentRelevantRelease(workflowTime) {
    const releases = await this.getRecentReleases();
    const timeThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds

    for (const release of releases) {
      const releaseTime = new Date(release.created_at);
      const timeDiff = Math.abs(releaseTime - workflowTime);

      if (timeDiff <= timeThreshold && this.isRelevantRelease(release)) {
        this.log(
          "info",
          `Found relevant release: ${release.tag_name} (${release.name})`,
        );
        return {
          tag: release.tag_name,
          name: release.name,
          url: release.html_url,
          created_at: release.created_at,
          body: release.body,
        };
      }
    }

    return null;
  }

  async detect() {
    try {
      this.log("info", "Starting release detection...");

      if (!this.owner || !this.repo) {
        throw new Error("GITHUB_REPOSITORY environment variable is required");
      }

      if (!this.workflowRunId) {
        throw new Error("WORKFLOW_RUN_ID environment variable is required");
      }

      const workflowRun = await this.getWorkflowRun();
      const workflowTime = new Date(workflowRun.created_at);

      this.log(
        "info",
        `Checking for releases near workflow time: ${workflowTime.toISOString()}`,
      );

      const recentRelease = await this.findRecentRelevantRelease(workflowTime);

      if (recentRelease) {
        this.log(
          "info",
          `Release detected: ${recentRelease.tag} - ${recentRelease.name}`,
        );

        // Set GitHub Actions outputs
        core.setOutput("has-release", "true");
        core.setOutput("release-info", JSON.stringify(recentRelease));

        // Also set as environment variables for shell access
        core.exportVariable("HAS_RELEASE", "true");
        core.exportVariable("RELEASE_TAG", recentRelease.tag);
        core.exportVariable("RELEASE_NAME", recentRelease.name);
        core.exportVariable("RELEASE_URL", recentRelease.url);

        return true;
      } else {
        this.log("info", "No relevant releases found");

        core.setOutput("has-release", "false");
        core.exportVariable("HAS_RELEASE", "false");

        return false;
      }
    } catch (error) {
      this.log("error", `Release detection failed: ${error.message}`);
      core.setFailed(error.message);
      return false;
    }
  }
}

// Run the detection if this script is executed directly
if (require.main === module) {
  const detector = new ReleaseDetector();
  detector
    .detect()
    .then((hasRelease) => {
      process.exit(hasRelease ? 0 : 1);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = ReleaseDetector;
