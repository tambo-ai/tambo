import { z } from "zod";
import { BookmarkSchema } from "../../lib/tambo.js";

interface BookmarkListProps {
  bookmarks: Array<{
    id: string;
    title: string;
    url: string;
    description?: string;
    tags?: string[];
    createdAt: string;
  }>;
}

export const BookmarkList = ({ bookmarks }: BookmarkListProps) => {
  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-24 h-24 rounded-full bg-linear-to-br from-[#7FFFC3] to-[#FFE17F] flex items-center justify-center mb-6 opacity-40">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-800"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-muted-foreground text-lg">
          No bookmarks yet. Ask me to create one!
        </p>
      </div>
    );
  }

  // Get domain from URL for favicon
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return "";
    }
  };

  const getFaviconUrl = (url: string) => {
    const domain = getDomain(url);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  };

  return (
    <div className="w-full">
      {/* Header with gradient */}
      <div className="mb-8 pb-4 border-b-2 border-linear-to-r from-[#7FFFC3] to-[#FFE17F]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#7FFFC3] to-[#FFE17F] flex items-center justify-center shadow-md">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-gray-800"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Your Bookmarks
            </h3>
            <p className="text-sm text-muted-foreground">
              {bookmarks.length} {bookmarks.length === 1 ? "item" : "items"}{" "}
              saved
            </p>
          </div>
        </div>
      </div>

      {/* Bookmarks Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
        {bookmarks.map((bookmark, index) => (
          <div
            key={bookmark.id}
            className="group relative p-6 border-2 border-border rounded-2xl bg-card transition-all duration-300 flex flex-col gap-4 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* Gradient accent on hover */}
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-[#7FFFC3]/5 to-[#FFE17F]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Header with favicon and title */}
            <div className="flex items-start gap-4 relative z-10">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border overflow-hidden">
                <img
                  src={getFaviconUrl(bookmark.url)}
                  alt=""
                  className="w-6 h-6"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden",
                    );
                  }}
                />
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted-foreground hidden"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-foreground leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {bookmark.title}
                </h4>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground no-underline truncate block hover:text-primary transition-colors"
                  title={bookmark.url}
                >
                  {getDomain(bookmark.url)}
                </a>
              </div>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:rotate-12"
                title="Open bookmark"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>

            {/* Description */}
            {bookmark.description && (
              <p className="text-sm text-muted-foreground leading-relaxed relative z-10 line-clamp-3">
                {bookmark.description}
              </p>
            )}

            {/* Tags */}
            {bookmark.tags && bookmark.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 relative z-10">
                {bookmark.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-linear-to-br from-accent to-accent/80 text-accent-foreground rounded-full font-medium shadow-sm border border-accent/20 transition-transform hover:scale-105"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer with date */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border relative z-10">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>
                  {new Date(bookmark.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-medium text-primary flex items-center gap-1">
                  View
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer stats */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Bookmarks</p>
              <p className="text-lg font-bold text-foreground">
                {bookmarks.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-accent-foreground"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unique Tags</p>
              <p className="text-lg font-bold text-foreground">
                {new Set(bookmarks.flatMap((b) => b.tags || [])).size}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BookmarkListSchema = z.object({
  bookmarks: z.array(BookmarkSchema),
});
