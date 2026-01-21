import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";
import { notFound } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return new NextResponse(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown; charset=UTF-8",
    },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
