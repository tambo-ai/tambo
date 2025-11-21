import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/tambo-ai/tambo",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          }),
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      stars: data.stargazers_count,
      forks: data.forks_count,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching GitHub stars:", error);

    // Return fallback data in case of error
    return NextResponse.json({
      stars: 472, // Current approximate count as fallback
      forks: 32,
      updatedAt: new Date().toISOString(),
    });
  }
}
