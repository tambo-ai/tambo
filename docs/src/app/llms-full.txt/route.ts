import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";
import { makeReadableStream } from "@/lib/stream";
import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  const scan = source.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);

  return new NextResponse(makeReadableStream(scanned), {
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
  });
}
