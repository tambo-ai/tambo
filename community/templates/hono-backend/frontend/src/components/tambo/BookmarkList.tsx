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
      <div className="bookmark-list empty">
        <p>No bookmarks yet. Ask me to create one!</p>
      </div>
    );
  }

  return (
    <div className="bookmark-list">
      <h3 className="bookmark-list-title">Bookmarks ({bookmarks.length})</h3>
      <div className="bookmark-grid">
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id} className="bookmark-card">
            <div className="bookmark-header">
              <h4 className="bookmark-title">{bookmark.title}</h4>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bookmark-link"
              >
                ↗
              </a>
            </div>
            {bookmark.description && (
              <p className="bookmark-description">{bookmark.description}</p>
            )}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bookmark-url"
            >
              {bookmark.url}
            </a>
            {bookmark.tags && bookmark.tags.length > 0 && (
              <div className="bookmark-tags">
                {bookmark.tags.map((tag, i) => (
                  <span key={i} className="bookmark-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <span className="bookmark-date">
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
