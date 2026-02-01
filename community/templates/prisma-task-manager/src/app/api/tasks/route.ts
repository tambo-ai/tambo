import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  const task = await prisma.task.create({
    data: { title: body.title },
  });

  return NextResponse.json(task);
}

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}
