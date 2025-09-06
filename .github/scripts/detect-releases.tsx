import { setOutput } from "@actions/core";
import { Octokit } from "@octokit/rest";

async function detectReleases(): Promise<void> {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const { data: releases } = await octokit.rest.repos.listReleases({
    owner: "tambo-ai",
    repo: "tambo",
    per_page: 10,
  });

  // Filter for recent releases (within 7 days) and relevant packages
  const relevantReleases = releases.filter((release) => {
    if (!release.published_at) return false;
    const releaseDate = new Date(release.published_at);
    const daysSinceRelease =
      (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24);
    const isRecentRelease = daysSinceRelease <= 7;
    const isRelevantPackage =
      release.tag_name.includes("react-sdk") ||
      release.tag_name.includes("cli");
    return isRecentRelease && isRelevantPackage;
  });

  if (relevantReleases.length > 0) {
    const latestRelease = relevantReleases[0];
    setOutput("has-release", "true");
    setOutput("release-info", JSON.stringify(latestRelease));
    console.log(`Found ${relevantReleases.length} recent relevant releases`);
    console.log(`Latest: ${latestRelease.tag_name}`);
  } else {
    setOutput("has-release", "false");
    console.log("No recent relevant releases found");
  }
}

detectReleases().catch((e) => console.error(e));
