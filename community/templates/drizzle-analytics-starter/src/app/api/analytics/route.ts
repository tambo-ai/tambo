import { NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsData } from "@/db/schema";

export async function GET() {
  try {
    const data = await db.select().from(analyticsData);
    return NextResponse.json(data);
  } catch (_error) {
    // Add underscore
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
