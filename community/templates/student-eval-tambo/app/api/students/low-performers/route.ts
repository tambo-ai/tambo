import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const thresholdParam = searchParams.get("threshold");
    const threshold = thresholdParam ? Number(thresholdParam) : 60;

    const students = await prisma.student.findMany({
      where: {
        score: { lt: threshold },
      },
      orderBy: { score: "asc" },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("[api/students/low-performers] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch low performers",
      },
      { status: 500 },
    );
  }
}
