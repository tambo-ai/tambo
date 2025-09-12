import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface BlogPostProps {
  children: React.ReactNode;
  title?: string;
  author?: string;
  date?: string;
}

export function BlogPost({ children, title, author, date }: BlogPostProps) {
  return (
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            {title && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium truncate">
                  {title}
                </span>
              </>
            )}
          </div>
        </nav>

        {/* Title */}
        {title && (
          <h1 className="text-center font-bold text-3xl sm:text-4xl md:text-5xl mb-8 mt-8 md:mt-12">
            {title}
          </h1>
        )}

        {/* Author and Date Information */}
        {(author || date) && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full text-sm border">
              {author && (
                <span className="font-medium text-foreground">By {author}</span>
              )}
              {author && date && (
                <span className="text-muted-foreground">•</span>
              )}
              {date && (
                <span className="text-muted-foreground font-medium">
                  {date}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-16">{children}</div>
      </div>
    </article>
  );
}
