import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const count = await prisma.thread.count();

  return NextResponse.json({
    ok: true,
    threads: count,
  });
}
