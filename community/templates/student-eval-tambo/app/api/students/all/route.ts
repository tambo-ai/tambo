import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      orderBy: { score: "desc" },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("[api/students/all] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch students",
      },
      { status: 500 },
    );
  }
}
