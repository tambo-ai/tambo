import { fetchArticles, type Article } from "@/lib/sanity";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "draft" | "published" | undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const search = searchParams.get("search") || undefined;

    const articles: Article[] = await fetchArticles({ status, limit, search });
    
    return NextResponse.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
