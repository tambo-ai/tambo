import { Hono } from "hono";
import {
  Bookmark,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
} from "../types.js";
import {
  bookmarkQueries,
  serializeTags,
  deserializeTags,
} from "../db/database.js";

export const bookmarksRouter = new Hono()
  .get("/", (c) => {
    const rows = bookmarkQueries.getAll.all() as Array<{
      id: string;
      title: string;
      url: string;
      description: string | null;
      tags: string | null;
      created_at: string;
    }>;

    const bookmarks: Bookmark[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      description: row.description || undefined,
      tags: deserializeTags(row.tags),
      createdAt: row.created_at,
    }));

    return c.json({ bookmarks });
  })
  .post("/", async (c) => {
    const body = await c.req.json<CreateBookmarkRequest>();
    const { title, url, description, tags = [] } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return c.json({ error: "Title is required" }, 400);
    }

    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return c.json({ error: "URL is required" }, 400);
    }

    try {
      new URL(url);
    } catch {
      return c.json({ error: "Invalid URL format" }, 400);
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    bookmarkQueries.create.run(
      id,
      title.trim(),
      url.trim(),
      description?.trim() || null,
      serializeTags(tags),
      createdAt,
    );

    const newBookmark: Bookmark = {
      id,
      title: title.trim(),
      url: url.trim(),
      description: description?.trim(),
      tags: tags || [],
      createdAt,
    };

    return c.json({ bookmark: newBookmark }, 201);
  })
  .put("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<UpdateBookmarkRequest>();

    const existing = bookmarkQueries.getById.get(id) as
      | {
          id: string;
          title: string;
          url: string;
          description: string | null;
          tags: string | null;
          created_at: string;
        }
      | undefined;

    if (!existing) {
      return c.json({ error: "Bookmark not found" }, 404);
    }

    if (body.url) {
      try {
        new URL(body.url);
      } catch {
        return c.json({ error: "Invalid URL format" }, 400);
      }
    }

    const updatedTitle = body.title?.trim() ?? existing.title;
    const updatedUrl = body.url?.trim() ?? existing.url;
    const updatedDescription =
      body.description !== undefined
        ? body.description?.trim()
        : existing.description;
    const updatedTags =
      body.tags !== undefined ? serializeTags(body.tags) : existing.tags;

    bookmarkQueries.update.run(
      updatedTitle,
      updatedUrl,
      updatedDescription,
      updatedTags,
      id,
    );

    const updatedBookmark: Bookmark = {
      id: existing.id,
      title: updatedTitle,
      url: updatedUrl,
      description: updatedDescription || undefined,
      tags: deserializeTags(updatedTags),
      createdAt: existing.created_at,
    };

    return c.json({ bookmark: updatedBookmark });
  })
  .delete("/:id", (c) => {
    const id = c.req.param("id");

    const existing = bookmarkQueries.getById.get(id);
    if (!existing) {
      return c.json({ error: "Bookmark not found" }, 404);
    }

    bookmarkQueries.delete.run(id);
    return c.json({ message: "Bookmark deleted successfully" });
  });
