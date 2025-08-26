import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface BlogPostProps {
  children: React.ReactNode;
  title?: string;
}

export function BlogPost({ children, title }: BlogPostProps) {
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

        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-16">{children}</div>
      </div>
    </article>
  );
}
