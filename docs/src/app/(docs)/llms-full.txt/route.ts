import { source } from "@/lib/source";
import { type Page } from "fumadocs-core/source";

// This tells Next.js to cache the result forever
export const revalidate = false;

// Helper function to recursively get all pages from the tree
function flattenTree(tree: Page[]): Page[] {
  return tree.flatMap((page) => [
    page,
    ...(page.children ? flattenTree(page.children) : []),
  ]);
}

export async function GET() {
  try {
    // We use Object.values() to turn the pageTree object into an array
    const allPages = flattenTree(Object.values(source.pageTree));

    // Extract the raw MDX content from each page
    const allTextContents = allPages.map((page) => {
      // SAFELY access the raw content from the page data
      return page.data?.exports?.raw ?? "";
    });

    // Join all the text into a single string with separators
    const fullText = allTextContents.join("\n\n---\n\n");

    // Return the response as plain text
    return new Response(fullText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Failed to generate llms-full.txt:", error);
    return new Response("Error generating content.", { status: 500 });
  }
}
