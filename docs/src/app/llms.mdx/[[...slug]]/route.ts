import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";
import { type NextRequest, NextResponse } from "next/server";

export const revalidate = 3600;

/**
 * Builds a plain-text 404 body listing every valid documentation page.
 * Returned when an agent requests a path that doesn't exist, so it can
 * self-correct instead of silently failing.
 */
function build404Response(requestedPath: string): NextResponse {
  const pages = source.getPages().map((p) => `- ${p.url} — ${p.data.title}`);

  const body = [
    `404 — page not found: ${requestedPath}`,
    "",
    "All valid documentation pages on this site:",
    "",
    ...pages,
    "",
    "Helpful endpoints:",
    "- /llms.txt        — structured page index",
    "- /llms-full.txt   — complete docs in one file",
    "- Append .mdx to any page URL above for raw Markdown",
  ].join("\n");

  return new NextResponse(body, {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=UTF-8" },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return build404Response(`/${(slug ?? []).join("/")}`);
  }

  return new NextResponse(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown; charset=UTF-8",
    },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
