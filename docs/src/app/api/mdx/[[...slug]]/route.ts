import { NextRequest, NextResponse } from "next/server";
import { source } from "@/lib/source";
import { getLLMText } from "@/lib/llm";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug?: string[] } },
) {
  const slug = params?.slug?.length ? params.slug : undefined;

  const page = source.getPage(slug);
  if (!page) return new NextResponse("Page not found", { status: 404 });

  try {
    const llmText = await getLLMText(page);
    return new NextResponse(llmText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new NextResponse(`Internal Server Error: ${msg}`, { status: 500 });
  }
}
