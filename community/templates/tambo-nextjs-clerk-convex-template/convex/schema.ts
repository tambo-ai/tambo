import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notes: defineTable({
    clerkUserId: v.string(),
    title: v.string(),
    content: v.string(),
    pinned: v.optional(v.boolean()),
    archived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_clerk_user_id_and_archived", ["clerkUserId", "archived"])
    .index("by_clerk_user_id_and_pinned", ["clerkUserId", "pinned"]),
});
