import dotenv from "dotenv";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";

dotenv.config();

const REPO = "tambo-ai/tambo";
const PER_PAGE = 100; // GitHub API max per page
const OUTPUT_FILE_JSON = path.join(__dirname, "github-stars.json");
const OUTPUT_FILE_CSV = path.join(__dirname, "github-stars.csv");

// GitHub token is optional but helps with rate limits
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

// Define type for GitHub Stargazer
interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

// Define type for processed stargazer
interface ProcessedStargazer {
  username: string;
  profile: string;
  avatar: string;
  id: number;
  type: string;
}

async function fetchStargazers(): Promise<GitHubUser[]> {
  let page = 1;
  let hasMore = true;
  const allStargazers: GitHubUser[] = [];

  console.log(`Fetching stargazers for ${REPO}...`);

  while (hasMore) {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };

    if (GITHUB_TOKEN) {
      headers["Authorization"] = `token ${GITHUB_TOKEN}`;
    }

    const url = `https://api.github.com/repos/${REPO}/stargazers?per_page=${PER_PAGE}&page=${page}`;

    try {
      console.log(`Fetching page ${page}...`);
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const stargazers = (await response.json()) as GitHubUser[];

      if (stargazers.length === 0) {
        hasMore = false;
      } else {
        allStargazers.push(...stargazers);
        page++;

        // Check if we've reached the last page
        const linkHeader = response.headers.get("link");
        if (linkHeader && !linkHeader.includes('rel="next"')) {
          hasMore = false;
        }

        // Respect rate limits
        const remaining = response.headers.get("x-ratelimit-remaining");
        if (remaining && parseInt(remaining, 10) < 10) {
          console.log("Approaching rate limit, waiting for a minute...");
          await new Promise((resolve) => setTimeout(resolve, 61000));
        }
      }
    } catch (error) {
      console.error("Error fetching stargazers:", error);
      hasMore = false;
    }
  }

  return allStargazers;
}

async function saveStargazers(stargazers: GitHubUser[]): Promise<void> {
  // Process the data to extract useful information
  const processedData: ProcessedStargazer[] = stargazers.map((user) => ({
    username: user.login,
    profile: user.html_url,
    avatar: user.avatar_url,
    id: user.id,
    type: user.type,
  }));

  // Save as JSON
  fs.writeFileSync(OUTPUT_FILE_JSON, JSON.stringify(processedData, null, 2));

  // Save as CSV
  const csvHeader = "username,profile,avatar,id,type";
  const csvRows = processedData.map(
    (user) =>
      `${user.username},${user.profile},${user.avatar},${user.id},${user.type}`,
  );
  const csvContent = [csvHeader, ...csvRows].join("\n");
  fs.writeFileSync(OUTPUT_FILE_CSV, csvContent);

  // Print summary
  console.log("\nSummary:");
  console.log(`Total stargazers: ${processedData.length}`);
  console.log(`JSON data saved to: ${OUTPUT_FILE_JSON}`);
  console.log(`CSV data saved to: ${OUTPUT_FILE_CSV}`);

  // Print the first few stargazers as a sample
  console.log("\nFirst 5 stargazers:");
  processedData.slice(0, 5).forEach((user) => {
    console.log(`- ${user.username} (${user.profile})`);
  });
}

async function main(): Promise<void> {
  try {
    const stargazers = await fetchStargazers();
    await saveStargazers(stargazers);
  } catch (error) {
    console.error("Error in main process:", error);
  }
}

main();
