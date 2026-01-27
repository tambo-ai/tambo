import { Hono } from "hono";
import {
  Bookmark,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
} from "../types.js";

const bookmarks: Bookmark[] = [];

export const bookmarksRouter = new Hono()
  .get("/", (c) => {
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

    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      title: title.trim(),
      url: url.trim(),
      description: description?.trim(),
      tags: tags || [],
      createdAt: new Date().toISOString(),
    };

    bookmarks.push(newBookmark);
    return c.json({ bookmark: newBookmark }, 201);
  })
  .put("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<UpdateBookmarkRequest>();

    const bookmarkIndex = bookmarks.findIndex((b) => b.id === id);
    if (bookmarkIndex === -1) {
      return c.json({ error: "Bookmark not found" }, 404);
    }

    const existingBookmark = bookmarks[bookmarkIndex];

    if (body.url) {
      try {
        new URL(body.url);
      } catch {
        return c.json({ error: "Invalid URL format" }, 400);
      }
    }

    const updatedBookmark: Bookmark = {
      ...existingBookmark,
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.url !== undefined && { url: body.url.trim() }),
      ...(body.description !== undefined && {
        description: body.description?.trim(),
      }),
      ...(body.tags !== undefined && { tags: body.tags }),
    };

    bookmarks[bookmarkIndex] = updatedBookmark;
    return c.json({ bookmark: updatedBookmark });
  })
  .delete("/:id", (c) => {
    const id = c.req.param("id");
    const bookmarkIndex = bookmarks.findIndex((b) => b.id === id);

    if (bookmarkIndex === -1) {
      return c.json({ error: "Bookmark not found" }, 404);
    }

    bookmarks.splice(bookmarkIndex, 1);
    return c.json({ message: "Bookmark deleted" });
  });
