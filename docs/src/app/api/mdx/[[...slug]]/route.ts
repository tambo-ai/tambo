// app/api/mdx/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { source } from "@/lib/source";
import { getLLMText } from "@/lib/llm";

// If your source/llm use fs or other Node APIs, keep this:
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug?: string[] } },
) {
  const slug = params?.slug && params.slug.length > 0 ? params.slug : undefined;

  const page = source.getPage(slug);
  if (!page) {
    return new NextResponse("Page not found", { status: 404 });
  }

  try {
    const llmText = await getLLMText(page);
    return new NextResponse(llmText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating LLM text", {
      slug,
      error,
      pageUrl: page?.url,
    });
    const message = error instanceof Error ? error.message : String(error);
    return new NextResponse(`Internal Server Error: ${message}`, {
      status: 500,
    });
  }
}
