import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";
import { NextRequest } from "next/server";

const docsSearch = createFromSource(source);

export async function GET(request: NextRequest) {
  return await docsSearch.GET(request);
}
