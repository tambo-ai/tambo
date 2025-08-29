import { source } from "@/lib/source";
import { getLLMText } from "@/lib/llm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;

  // Handle the slug properly - it comes from the URL path
  // For nested pages (/api/mdx/path/to/page), pass the slug array
  // For root page (/api/mdx/), pass undefined
  const page = source.getPage(slug && slug.length > 0 ? slug : undefined);

  if (!page) {
    return new NextResponse("Page not found", { status: 404 });
  }

  try {
    const llmText = await getLLMText(page);

    return new NextResponse(llmText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating LLM text:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
