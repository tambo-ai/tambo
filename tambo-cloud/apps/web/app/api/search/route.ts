import { source } from "@/lib/source";
import { vnextSource } from "@/lib/vnext-source";
import { createFromSource } from "fumadocs-core/search/server";
import { NextRequest } from "next/server";

const docsSearch = createFromSource(source);
const vnextSearch = createFromSource(vnextSource);

export async function GET(request: NextRequest) {
  // Check if the request is coming from the vnext docs based on the referer
  const referer = request.headers.get("referer") || "";
  const isVnext = referer.includes("/vnext");

  if (isVnext) {
    return vnextSearch.GET(request);
  }

  return docsSearch.GET(request);
}
