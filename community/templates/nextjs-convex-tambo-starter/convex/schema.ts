import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    status: v.string(), // "New", "Contacted", "Closed"
    notes: v.optional(v.string()),
  }),
});
