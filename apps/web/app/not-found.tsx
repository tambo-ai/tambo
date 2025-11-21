import { OptimizedImage } from "@/components/optimized-image";
import { Schema } from "@/components/schema";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you're looking for doesn't exist or has been moved.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  const pageTitle = "Page Not Found";
  const pageDescription =
    "Oops! The page you're looking for doesn't exist or has been moved.";

  // Create JSON-LD schema for 404 page
  const notFoundSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `404 - ${pageTitle}`,
    description: pageDescription.replaceAll("&apos;", "'"),
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-16 text-center">
      {/* Background image positioned at the bottom */}
      <div className="absolute inset-0 z-0 flex h-full w-full flex-col justify-end after:absolute after:inset-0 after:bg-background after:opacity-85">
        <div className="flex w-full justify-center overflow-hidden -mb-16 md:-mb-24 lg:-mb-32">
          <OptimizedImage
            src="/assets/landing/octo-juggling-placeholder.png"
            alt=""
            width={1000}
            height={1000}
            priority
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-md space-y-8">
        <h1 className="font-heading text-8xl font-bold tracking-tighter">
          404
        </h1>
        <div className="relative mx-auto mb-2">
          <h2 className="font-heading text-3xl font-semibold">{pageTitle}</h2>
          <p className="mx-auto mt-2 max-w-sm text-lg text-muted-foreground">
            {pageDescription}
          </p>
        </div>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="px-8 py-6 text-base">
            <Link href="/">Go Home</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="px-8 py-6 text-base"
          >
            <a href={process.env.NEXT_PUBLIC_DOCS_URL || "/docs"}>
              View Documentation
            </a>
          </Button>
        </div>
      </div>
      <Schema jsonLd={notFoundSchema} />
    </div>
  );
}
