import { z } from "zod";
import React, { useState, useEffect, useMemo } from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ComponentErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Component render error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-2 text-red-500 text-sm rounded border border-red-200 bg-red-50">
            Failed to render component
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// Schema for the bookmark card props - used by Tambo for generation
// Must match the structure returned by search_bookmarks tool
// All fields have defaults to handle partial props during streaming
export const bookmarkCardPropsSchema = z.object({
  id: z.string().default("").describe("Unique identifier for the bookmark"),
  url: z.string().default("").describe("The bookmark URL"),
  title: z
    .string()
    .nullable()
    .default(null)
    .describe("Display title for the bookmark"),
  category: z
    .string()
    .nullable()
    .default(null)
    .describe("Category/tag for organization"),
  created_at: z.string().optional().describe("When the bookmark was created"),
});

export type BookmarkCardProps = z.infer<typeof bookmarkCardPropsSchema>;

/**
 * BookmarkCard - A visual card component for displaying bookmarks in chat.
 * This component is registered with Tambo for generative UI rendering.
 */
function BookmarkCardInner({ url, title, category }: BookmarkCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  const domain = useMemo(() => {
    if (!url) return "";
    const isIncompleteStreamingUrl =
      url === "https://" || url === "http://" || url.length < 10;
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch (error) {
      if (!isIncompleteStreamingUrl) {
        console.warn(`Invalid URL format: ${url}`, error);
      }
      return url;
    }
  }, [url]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!url) {
    return null;
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  return (
    <div
      className={`my-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <img
              src={faviconUrl}
              alt=""
              className="h-8 w-8 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'%3E%3C/path%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'%3E%3C/path%3E%3C/svg%3E";
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-gray-900">
              {title ?? domain}
            </h3>
            <p className="truncate text-sm text-gray-500">{domain}</p>
          </div>
          {category && (
            <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {category}
            </span>
          )}
        </div>
      </a>
    </div>
  );
}

export function BookmarkCard(props: BookmarkCardProps) {
  return (
    <ComponentErrorBoundary>
      <BookmarkCardInner {...props} />
    </ComponentErrorBoundary>
  );
}

BookmarkCard.displayName = "BookmarkCard";

// Schema for bookmark list props
export const bookmarkListPropsSchema = z.object({
  bookmarks: z
    .array(bookmarkCardPropsSchema)
    .default([])
    .describe("Array of bookmarks to display"),
  title: z.string().optional().describe("Optional title for the list"),
});

export type BookmarkListProps = z.infer<typeof bookmarkListPropsSchema>;

/**
 * BookmarkList - Displays a list of bookmark cards.
 * Useful when the AI wants to show multiple search results.
 */
function BookmarkListInner({ bookmarks, title }: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="my-2 space-y-2">
        {title && (
          <h4 className="mb-2 text-sm font-medium text-gray-700">{title}</h4>
        )}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-200 bg-white p-3"
          >
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
              </div>
              <div className="h-5 w-16 rounded-full bg-gray-100" />
            </div>
          </div>
        ))}
        <p className="mt-2 text-xs text-gray-400">Loading bookmarks...</p>
      </div>
    );
  }

  return (
    <div className="my-2">
      {title && (
        <h4 className="mb-2 text-sm font-medium text-gray-700">{title}</h4>
      )}
      <div className="space-y-2">
        {bookmarks.map((bookmark, index) => (
          <div
            key={bookmark.id || index}
            style={{ animationDelay: `${index * 100}ms` }}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <BookmarkCard {...bookmark} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        {bookmarks.length} bookmark{bookmarks.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function BookmarkList(props: BookmarkListProps) {
  return (
    <ComponentErrorBoundary>
      <BookmarkListInner {...props} />
    </ComponentErrorBoundary>
  );
}

BookmarkList.displayName = "BookmarkList";

// Schema for category summary props
export const categorySummaryPropsSchema = z.object({
  categories: z
    .array(
      z.object({
        name: z.string().default("").describe("Category name"),
        count: z
          .number()
          .default(0)
          .describe("Number of bookmarks in this category"),
      }),
    )
    .default([])
    .describe("Array of category summaries"),
});

export type CategorySummaryProps = z.infer<typeof categorySummaryPropsSchema>;

/**
 * CategorySummary - Shows a visual breakdown of bookmark categories.
 */
const CATEGORY_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-red-500",
];

function CategorySummaryInner({ categories }: CategorySummaryProps) {
  const [isVisible, setIsVisible] = useState(false);
  const total = categories.reduce((sum, cat) => sum + cat.count, 0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (categories.length === 0) {
    return (
      <div className="my-2 animate-pulse rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 h-5 w-32 rounded bg-gray-200" />
        <div className="mb-3 h-3 w-full rounded-full bg-gray-100" />
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400">Loading categories...</p>
      </div>
    );
  }

  return (
    <div
      className={`my-2 rounded-lg border border-gray-200 bg-white p-4 transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <h4 className="mb-3 font-medium text-gray-900">Your Categories</h4>
      <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-gray-100">
        {categories.map((cat, i) => (
          <div
            key={cat.name}
            className={`${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} transition-all duration-700`}
            style={{
              width: isVisible ? `${(cat.count / total) * 100}%` : "0%",
              transitionDelay: `${i * 100}ms`,
            }}
            title={`${cat.name}: ${cat.count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {categories.map((cat, i) => (
          <div key={cat.name} className="flex items-center gap-1.5 text-sm">
            <div
              className={`h-2.5 w-2.5 rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
            />
            <span className="text-gray-700">{cat.name}</span>
            <span className="text-gray-400">({cat.count})</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-400">{total} total bookmarks</p>
    </div>
  );
}

export function CategorySummary(props: CategorySummaryProps) {
  return (
    <ComponentErrorBoundary>
      <CategorySummaryInner {...props} />
    </ComponentErrorBoundary>
  );
}

CategorySummary.displayName = "CategorySummary";
