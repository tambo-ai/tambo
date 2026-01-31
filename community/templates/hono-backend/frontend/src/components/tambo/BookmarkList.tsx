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
      <div className="text-center text-muted-foreground py-12 px-6">
        <p>No bookmarks yet. Ask me to create one!</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">
        Bookmarks ({bookmarks.length})
      </h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="p-6 border border-border rounded-lg bg-card transition-all flex flex-col gap-4 hover:border-primary hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex justify-between items-start gap-4">
              <h4 className="text-lg font-semibold text-foreground flex-1 leading-snug">
                {bookmark.title}
              </h4>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl no-underline text-primary transition-transform flex-shrink-0 inline-block hover:scale-110 hover:rotate-45"
              >
                ↗
              </a>
            </div>
            {bookmark.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {bookmark.description}
              </p>
            )}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary no-underline break-all transition-opacity block hover:opacity-80 hover:underline"
            >
              {bookmark.url}
            </a>
            {bookmark.tags && bookmark.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bookmark.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1.5 bg-accent text-accent-foreground rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <span className="text-xs text-muted-foreground mt-auto">
              {new Date(bookmark.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BookmarkListSchema = z.object({
  bookmarks: z.array(BookmarkSchema),
});
