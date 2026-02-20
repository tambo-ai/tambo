import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Bookmark } from "~/lib/database.types";

// Tool factory that creates tools with Supabase client and user context
export function createBookmarkTools(
  supabase: SupabaseClient<Database>,
  userId: string,
  onMutate: () => void, // callback to refresh the bookmark list
): TamboTool[] {
  // Tool: Add a new bookmark
  const addBookmarkTool: TamboTool = {
    name: "add_bookmark",
    description:
      "Save a new bookmark to the user's collection. Use this when the user wants to save a URL, link, or article.",
    tool: async ({
      url,
      title,
      category,
    }: {
      url: string;
      title?: string;
      category?: string;
    }) => {
      const { data, error } = await supabase
        .from("bookmarks")
        .insert({
          user_id: userId,
          url,
          title: title ?? null,
          category: category ?? null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add bookmark: ${error.message}`);
      }

      onMutate();
      return {
        success: true,
        bookmark: data,
        message: `Saved "${title ?? url}" to your bookmarks${category ? ` in category "${category}"` : ""}.`,
      };
    },
    inputSchema: z.object({
      url: z.string().url().describe("The URL to bookmark"),
      title: z
        .string()
        .optional()
        .describe("A descriptive title for the bookmark"),
      category: z
        .string()
        .optional()
        .describe(
          "Category to organize the bookmark (e.g., 'Tech', 'Cooking', 'News')",
        ),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      bookmark: z.object({
        id: z.string(),
        url: z.string(),
        title: z.string().nullable(),
        category: z.string().nullable(),
      }),
      message: z.string(),
    }),
  };

  // Tool: Search bookmarks
  const searchBookmarksTool: TamboTool = {
    name: "search_bookmarks",
    description:
      "Search through the user's saved bookmarks by keyword, category, or URL. Use this when the user wants to find, list, or show bookmarks. IMPORTANT: After calling this tool, always render the results using the BookmarkList component to display them visually.",
    tool: async ({
      query,
      category,
    }: {
      query?: string;
      category?: string;
    }) => {
      const baseQuery = supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      const finalQuery = category
        ? baseQuery.ilike("category", `%${category}%`)
        : baseQuery;

      const { data, error } = await finalQuery;

      if (error) {
        throw new Error(`Failed to search bookmarks: ${error.message}`);
      }

      let results = (data ?? []) as Bookmark[];

      // Client-side text search if query provided
      if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(
          (b) =>
            b.url.toLowerCase().includes(lowerQuery) ||
            b.title?.toLowerCase().includes(lowerQuery) ||
            b.category?.toLowerCase().includes(lowerQuery),
        );
      }

      return {
        count: results.length,
        bookmarks: results.slice(0, 10), // Limit to 10 results
        message:
          results.length > 0
            ? `Found ${results.length} bookmark${results.length === 1 ? "" : "s"}.`
            : "No bookmarks found matching your search.",
      };
    },
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .describe("Text to search for in bookmark titles and URLs"),
      category: z.string().optional().describe("Filter by category name"),
    }),
    outputSchema: z.object({
      count: z.number(),
      bookmarks: z.array(
        z.object({
          id: z.string(),
          url: z.string(),
          title: z.string().nullable(),
          category: z.string().nullable(),
          created_at: z.string(),
        }),
      ),
      message: z.string(),
    }),
  };

  // Tool: Categorize bookmarks
  const categorizeBookmarksTool: TamboTool = {
    name: "categorize_bookmarks",
    description:
      "Update the category of one or more bookmarks. Use this when the user wants to organize, tag, or categorize their bookmarks.",
    tool: async ({
      bookmarkIds,
      category,
    }: {
      bookmarkIds: string[];
      category: string;
    }) => {
      const { data, error } = await supabase
        .from("bookmarks")
        .update({ category })
        .in("id", bookmarkIds)
        .eq("user_id", userId)
        .select();

      if (error) {
        throw new Error(`Failed to categorize bookmarks: ${error.message}`);
      }

      onMutate();
      return {
        success: true,
        updatedCount: data?.length ?? 0,
        message: `Updated ${data?.length ?? 0} bookmark${data?.length === 1 ? "" : "s"} to category "${category}".`,
      };
    },
    inputSchema: z.object({
      bookmarkIds: z
        .array(z.string())
        .describe("Array of bookmark IDs to categorize"),
      category: z.string().describe("The category to assign to the bookmarks"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      updatedCount: z.number(),
      message: z.string(),
    }),
  };

  // Tool: Update bookmark
  const updateBookmarkTool: TamboTool = {
    name: "update_bookmark",
    description:
      "Update an existing bookmark's title, URL, or category. Use this when the user wants to edit, rename, change, or fix a bookmark.",
    tool: async ({
      bookmarkId,
      title,
      url,
      category,
    }: {
      bookmarkId: string;
      title?: string;
      url?: string;
      category?: string;
    }) => {
      const updates: { title?: string; url?: string; category?: string } = {};
      if (title !== undefined) updates.title = title;
      if (url !== undefined) updates.url = url;
      if (category !== undefined) updates.category = category;

      if (Object.keys(updates).length === 0) {
        return {
          success: false,
          message:
            "No updates provided. Please specify at least one of: title, url, or category.",
        };
      }

      const { data, error } = await supabase
        .from("bookmarks")
        .update(updates)
        .eq("id", bookmarkId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update bookmark: ${error.message}`);
      }

      onMutate();
      const changedFields = Object.keys(updates).join(", ");
      const bookmark = data as Bookmark;
      return {
        success: true,
        bookmark,
        message: `Updated bookmark (${changedFields}): "${bookmark.title ?? bookmark.url}".`,
      };
    },
    inputSchema: z.object({
      bookmarkId: z.string().describe("The ID of the bookmark to update"),
      title: z.string().optional().describe("New title for the bookmark"),
      url: z.string().url().optional().describe("New URL for the bookmark"),
      category: z.string().optional().describe("New category for the bookmark"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      bookmark: z
        .object({
          id: z.string(),
          url: z.string(),
          title: z.string().nullable(),
          category: z.string().nullable(),
        })
        .optional(),
      message: z.string(),
    }),
  };

  // Tool: Delete bookmark
  const deleteBookmarkTool: TamboTool = {
    name: "delete_bookmark",
    description:
      "Delete a bookmark from the user's collection. Use this when the user wants to remove a saved link.",
    tool: async ({ bookmarkId }: { bookmarkId: string }) => {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", bookmarkId)
        .eq("user_id", userId);

      if (error) {
        throw new Error(`Failed to delete bookmark: ${error.message}`);
      }

      onMutate();
      return {
        success: true,
        message: "Bookmark deleted successfully.",
      };
    },
    inputSchema: z.object({
      bookmarkId: z.string().describe("The ID of the bookmark to delete"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  };

  // Tool: Get uncategorized bookmarks
  const getUncategorizedTool: TamboTool = {
    name: "get_uncategorized_bookmarks",
    description:
      "Get all bookmarks that don't have a category assigned. Use this to help the user organize their bookmarks.",
    tool: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .is("category", null)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(
          `Failed to get uncategorized bookmarks: ${error.message}`,
        );
      }

      return {
        count: data?.length ?? 0,
        bookmarks: data ?? [],
        message: data?.length
          ? `Found ${data.length} uncategorized bookmark${data.length === 1 ? "" : "s"}.`
          : "All your bookmarks are categorized!",
      };
    },
    inputSchema: z.object({}),
    outputSchema: z.object({
      count: z.number(),
      bookmarks: z.array(
        z.object({
          id: z.string(),
          url: z.string(),
          title: z.string().nullable(),
          category: z.string().nullable(),
          created_at: z.string(),
        }),
      ),
      message: z.string(),
    }),
  };

  // Tool: Get category statistics
  const getCategoryStatsTool: TamboTool = {
    name: "get_category_stats",
    description:
      "Get statistics about the user's bookmark categories. Use when user asks 'what categories do I have?', 'show my categories', or wants an overview. IMPORTANT: After calling this tool, always render the results using the CategorySummary component.",
    tool: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("category")
        .eq("user_id", userId);

      if (error) {
        throw new Error(`Failed to get category stats: ${error.message}`);
      }

      // Count bookmarks per category
      const categoryMap = new Map<string, number>();
      for (const bookmark of data ?? []) {
        const cat = bookmark.category ?? "Uncategorized";
        categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
      }

      // Convert to sorted array
      const categories = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      return {
        categories,
        totalBookmarks: data?.length ?? 0,
        message:
          categories.length > 0
            ? `You have ${categories.length} categor${categories.length === 1 ? "y" : "ies"} across ${data?.length ?? 0} bookmarks.`
            : "You don't have any bookmarks yet.",
      };
    },
    inputSchema: z.object({}),
    outputSchema: z.object({
      categories: z.array(
        z.object({
          name: z.string(),
          count: z.number(),
        }),
      ),
      totalBookmarks: z.number(),
      message: z.string(),
    }),
  };

  return [
    addBookmarkTool,
    searchBookmarksTool,
    updateBookmarkTool,
    categorizeBookmarksTool,
    deleteBookmarkTool,
    getUncategorizedTool,
    getCategoryStatsTool,
  ];
}
