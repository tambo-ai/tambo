"use client";

import { ArticleCarousel } from "@/components/dashboard/article-carousel";
import { sanityRealtimeClient, type Article } from "@/lib/sanity";
import { TamboThreadProvider } from "@tambo-ai/react";
import { cn } from "@/lib/utils";
import { ArrowLeft, ExternalLink, Grid3x3, List, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const SANITY_STUDIO_URL =
  process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "https://sanity.io/manage";

type StatusFilter = "all" | "published" | "draft";

export default function DashboardPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    // Initial fetch
    const fetchInitial = async () => {
      try {
        const query = `*[_type == "article"] | order(_createdAt desc) {
          _id,
          _type,
          title,
          "slug": slug.current,
          excerpt,
          body,
          status,
          publishedAt,
          _createdAt,
          _updatedAt
        }`;
        const result = await sanityRealtimeClient.fetch(query);
        setArticles(result);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
        setLoading(false);
      }
    };

    fetchInitial();

    // Real-time listener
    const subscription = sanityRealtimeClient
      .listen(`*[_type == "article"]`)
      .subscribe(() => {
        fetchInitial();
      });

    return () => subscription.unsubscribe();
  }, []);

  // Filter articles by status
  const filteredArticles = articles.filter((article) => {
    if (statusFilter === "all") return true;
    return article.status === statusFilter;
  });

  return (
    <TamboThreadProvider>
      <main className="relative flex min-h-screen flex-col items-center bg-zinc-950 text-zinc-300 selection:bg-violet-500/30 overflow-hidden">

        {/* Branding - Top Left with Studio Link */}
        <div className="absolute top-6 left-6 z-50 flex items-center gap-3 select-none">
          <div className="relative h-6 w-6 overflow-hidden rounded-md grayscale">
            <Image
              src="/application.png"
              alt="Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-sm font-bold tracking-[0.2em] text-white/50">
            STUDIO
          </span>
          <a
            href={SANITY_STUDIO_URL}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-600 flex items-center gap-1.5 cursor-pointer hover:text-zinc-400 transition-colors uppercase tracking-wider font-medium"
          >
            Studio
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full max-w-[85%] mt-20 z-10 flex flex-col pb-12">

          {/* Header with Back, Tabs, and Toggle */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex justify-between items-center">
              <Link
                href="/"
                className="text-xs text-zinc-500 flex items-center gap-1.5 cursor-pointer hover:text-zinc-300 transition-colors uppercase tracking-wider font-medium"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </Link>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-zinc-900/50 border border-zinc-800 rounded-full p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    viewMode === "list"
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <List className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    viewMode === "grid"
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Grid3x3 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center bg-zinc-900/50 border border-zinc-800 rounded-full p-1 gap-1">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                    statusFilter === "all"
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("published")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                    statusFilter === "published"
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Published
                </button>
                <button
                  onClick={() => setStatusFilter("draft")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                    statusFilter === "draft"
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Drafts
                </button>
              </div>
            </div>
          </div>

          {/* Articles View */}
          <div className="w-full">
            {loading ? (
              <div className="flex h-[200px] w-full items-center justify-center border border-zinc-800/50 rounded-[4px] bg-zinc-900/20">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
              </div>
            ) : (
              <ArticleCarousel
                articles={filteredArticles}
                sanityStudioUrl={SANITY_STUDIO_URL}
                viewMode={viewMode}
                emptyMessage={
                  statusFilter === "all"
                    ? "No articles found. Start by generating one."
                    : statusFilter === "published"
                      ? "No published articles yet."
                      : "No drafts found."
                }
              />
            )}
          </div>

        </div>
      </main>
    </TamboThreadProvider>
  );
}
