import BlogListItem from "@/components/blog-card";
import { Button } from "@/components/ui/button";
import { getBlogPosts } from "@/lib/blog";
import { siteConfig } from "@/lib/config";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description: `Latest news and updates from ${siteConfig.name}.`,
};

export default async function Blog() {
  const allPosts = await getBlogPosts();

  const articles = await Promise.all(
    allPosts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  );

  return (
    <>
      <div className="mx-auto w-full max-w-screen-xl px-2.5 lg:px-16 mt-16 md:mt-20 relative">
        {/* Decorative accent element */}
        <div className="absolute -top-10 right-10 md:right-20 w-24 h-24 rounded-full bg-accent/20 blur-2xl" />

        <div className="text-center py-8 md:py-10 relative">
          <h1 className="text-3xl font-heading font-bold text-foreground sm:text-4xl">
            <span className="relative">
              Articles
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-accent/40 rounded-full mx-auto w-1/4" />
            </span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Latest news and updates from {siteConfig.name}
          </p>

          <div className="mt-6 flex justify-center">
            <Button variant="outline" size="sm" asChild>
              <Link href="/" className="text-accent hover:text-accent">
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-[50vh] bg-background/50 dark:bg-background/80 shadow-[inset_10px_-50px_94px_0_rgb(199,199,199,0.2)] dark:shadow-[inset_10px_-50px_94px_0_rgb(0,0,0,0.2)] backdrop-blur-lg relative">
        {/* Decorative accent element */}
        <div className="absolute -bottom-10 left-10 md:left-20 w-32 h-32 rounded-full bg-accent/10 blur-3xl" />

        <div className="mx-auto w-full max-w-screen-xl px-2.5 py-6 md:py-8 lg:px-16 relative">
          <div className="flex flex-col divide-y dark:divide-gray-800">
            {articles.map((data, idx) => (
              <BlogListItem key={data.slug} data={data} priority={idx <= 1} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
