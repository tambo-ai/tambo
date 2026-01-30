import { createArticle } from "@/lib/sanity";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, excerpt, body: articleBody } = body;

    if (!title || !excerpt || !articleBody) {
      return NextResponse.json(
        { error: "Missing required fields: title, excerpt, body" },
        { status: 400 }
      );
    }

    const article = await createArticle({
      title,
      excerpt,
      body: articleBody,
    });
    
    return NextResponse.json(article);
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
