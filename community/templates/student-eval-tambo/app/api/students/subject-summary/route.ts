import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const students = await prisma.student.findMany();

    const summary: Record<string, { total: number; count: number }> = {};

    students.forEach((s) => {
      if (!summary[s.subject]) {
        summary[s.subject] = { total: 0, count: 0 };
      }
      summary[s.subject].total += s.score;
      summary[s.subject].count += 1;
    });

    const result = Object.entries(summary).map(([subject, data]) => ({
      subject,
      averageScore: Math.round(data.total / data.count),
      studentCount: data.count,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/students/subject-summary] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate subject summary",
      },
      { status: 500 },
    );
  }
}
