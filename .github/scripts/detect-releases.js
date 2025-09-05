#!/usr/bin/env node

const { Octokit } = require("@octokit/rest");
const core = require("@actions/core");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

async function detectReleases() {
  try {
    const { data: releases } = await octokit.rest.repos.listReleases({
      owner,
      repo,
      per_page: 5,
    });

    const relevantRelease = releases.find(
      (release) =>
        release.tag_name.includes("react-sdk-v") ||
        release.tag_name.includes("cli-v"),
    );

    if (relevantRelease) {
      core.setOutput("release_detected", "true");
      core.setOutput("release_tag", relevantRelease.tag_name);
      core.setOutput("release_name", relevantRelease.name);
      core.setOutput("release_url", relevantRelease.html_url);
      console.log(`Detected relevant release: ${relevantRelease.tag_name}`);
    } else {
      core.setOutput("release_detected", "false");
      console.log("No relevant releases found");
    }
  } catch (error) {
    core.setFailed(`Release detection failed: ${error.message}`);
  }
}

detectReleases();
