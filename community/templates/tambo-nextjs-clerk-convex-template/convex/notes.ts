import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all notes for the current user
 */
export const getNotes = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    let notes = await ctx.db
      .query("notes")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", identity.subject),
      )
      .collect();

    // Filter out archived unless requested
    if (!args.includeArchived) {
      notes = notes.filter((note) => !note.archived);
    }

    // Sort: pinned first, then by updatedAt
    return notes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  },
});

/**
 * Get a single note by ID
 */
export const getNote = query({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const note = await ctx.db.get(args.id);
    if (!note || note.clerkUserId !== identity.subject) {
      return null;
    }

    return note;
  },
});

/**
 * Create a new note
 */
export const createNote = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    pinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const id = await ctx.db.insert("notes", {
      clerkUserId: identity.subject,
      title: args.title,
      content: args.content,
      pinned: args.pinned ?? false,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });

    return { id, title: args.title };
  },
});

/**
 * Update an existing note
 */
export const updateNote = mutation({
  args: {
    id: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.id);
    if (!note || note.clerkUserId !== identity.subject) {
      throw new Error("Note not found");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return { id, ...filteredUpdates };
  },
});

/**
 * Delete a note
 */
export const deleteNote = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.id);
    if (!note || note.clerkUserId !== identity.subject) {
      throw new Error("Note not found");
    }

    await ctx.db.delete(args.id);
    return { success: true, deletedId: args.id };
  },
});

/**
 * Search notes by title or content
 */
export const searchNotes = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", identity.subject),
      )
      .collect();

    const searchLower = args.query.toLowerCase();
    return notes
      .filter(
        (note) =>
          !note.archived &&
          (note.title.toLowerCase().includes(searchLower) ||
            note.content.toLowerCase().includes(searchLower)),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});
