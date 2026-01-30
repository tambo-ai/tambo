"use client";

import { ArticleCarousel } from "@/components/dashboard/article-carousel";
import { sanityClient, type Article } from "@/lib/sanity";
import { TamboThreadProvider } from "@tambo-ai/react";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const SANITY_STUDIO_URL =
  process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "https://sanity.io/manage";

export default function DashboardPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [recentReads, setRecentReads] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Load recent reads from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("tambo_recent_reads");
    if (saved) {
      try {
        setRecentReads(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent reads", e);
      }
    }
  }, []);

  const handleArticleClick = (article: Article) => {
    // Prevent duplicates and keep mostly recent
    const newRecent = [
        article,
        ...recentReads.filter(r => r._id !== article._id)
    ].slice(0, 10); 
    
    setRecentReads(newRecent);
    localStorage.setItem("tambo_recent_reads", JSON.stringify(newRecent));
  };

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
        const result = await sanityClient.fetch(query);
        setArticles(result);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
        setLoading(false);
      }
    };

    fetchInitial();

    // Real-time listener
    const subscription = sanityClient
      .listen(`*[_type == "article"]`)
      .subscribe(() => {
        // Simple approach: re-fetch on any update to ensure correct ordering/data
        // For production apps, you might optimize this to only splice the list
        fetchInitial();
      });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <TamboThreadProvider>
      <main className="relative flex min-h-screen flex-col items-center bg-zinc-950 text-zinc-300 selection:bg-violet-500/30 overflow-hidden">


        {/* Branding - Top Left */}
        <div className="absolute top-6 left-6 z-50 flex items-center gap-3 select-none pointer-events-none opacity-50">
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
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 w-full max-w-[85%] mt-20 gap-y-8 z-10 flex flex-col pb-12">
           
           {/* Section: User Articles */}
           <div className="flex flex-col gap-6">
              <div className="flex justify-between items-baseline px-1">
                 <h2 className="text-zinc-100 font-medium tracking-wide">User Articles</h2>
                 <div className="flex items-center gap-4">
                      <Link href="/" className="text-xs text-zinc-500 flex items-center gap-1.5 cursor-pointer hover:text-zinc-300 transition-colors uppercase tracking-wider font-medium">
                        <ArrowLeft className="w-3 h-3" />
                        Back
                      </Link>
                      <a 
                        href={SANITY_STUDIO_URL} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-zinc-500 flex items-center gap-1.5 cursor-pointer hover:text-zinc-300 transition-colors uppercase tracking-wider font-medium"
                      >
                         Studio
                         <ExternalLink className="w-3 h-3" />
                      </a>
                  </div>
              </div>
              
              <div className="w-full min-h-[220px]">
                {loading ? (
                    <div className="flex h-[200px] w-full items-center justify-center border border-zinc-800/50 rounded-[4px] bg-zinc-900/20">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                    </div>
                ) : (
                    <ArticleCarousel 
                        articles={articles} 
                        sanityStudioUrl={SANITY_STUDIO_URL} 
                        onArticleClick={handleArticleClick}
                        emptyMessage="No articles found. Start by generating one."
                    />
                )}
              </div>
           </div>

           {/* Divider */}
           <div className="border-t border-zinc-800/60 w-full" />

           {/* Section: Recent Reads */}
           <div className="flex flex-col gap-6">
              <div className="flex justify-between items-baseline px-1">
                 <h2 className="text-zinc-100 font-medium tracking-wide">Recent Reads</h2>
              </div>
              <div className="w-full min-h-[180px]">
                 <ArticleCarousel 
                        articles={recentReads} 
                        sanityStudioUrl={SANITY_STUDIO_URL} 
                        onArticleClick={handleArticleClick} // Clicking a recent read bumps it to top
                        emptyMessage="No recently viewed articles."
                    />
              </div>
           </div>

        </div>
      </main>
    </TamboThreadProvider>
  );
}
