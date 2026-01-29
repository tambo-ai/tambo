"use client";

import { BookmarkList } from "@/components/tambo/bookmark-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { getBookmarks } from "@/lib/supabase";
import { useTambo } from "@tambo-ai/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const { thread } = useTambo();
  const [initialBookmarks, setInitialBookmarks] = useState([]);

  // Fetch mock data for the default view
  useEffect(() => {
    getBookmarks().then((data) => setInitialBookmarks(data as any));
  }, []);

  // Get the latest component rendered by the AI, if any
  const latestComponent =
    thread?.messages[thread.messages.length - 1]?.renderedComponent;

  // Default View: Show the mock bookmarks using our Generative Component
  const DefaultDashboard = (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-200">
        <p className="font-semibold mb-1">
          👋 Welcome to your Generative Bookmark Manager!
        </p>
        <p>
          This template demonstrates how to use{" "}
          <strong>Tambo + Supabase</strong> to build a CRUD app with a
          Generative UI.
        </p>
        <p className="mt-2 text-xs opacity-80">
          Try asking: <em>&quot;Add google.com to my bookmarks&quot;</em> or{" "}
          <em>&quot;Show me bookmarks tagged &apos;docs&apos;&quot;</em>
        </p>
      </div>

      <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
        Recent Bookmarks
      </h2>
      <BookmarkList bookmarks={initialBookmarks} />
    </div>
  );

  return (
    <main className="min-h-screen bg-neutral-100 dark:bg-neutral-950 p-8 font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/Octo-Icon.svg"
              alt="Tambo Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
              Generative Bookmarks
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/chat"
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold hover:opacity-90 transition shadow-lg"
            >
              Start Chatting →
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {latestComponent ? (
          <div className="animate-in fade-in duration-500">
            {latestComponent}
          </div>
        ) : (
          DefaultDashboard
        )}
      </div>
    </main>
  );
}
