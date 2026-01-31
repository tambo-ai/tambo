import { z } from "zod";
import { defineTool } from "@tambo-ai/react";

const BookmarkSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
});

export const tools = [
  defineTool({
    name: "getBookmarks",
    description:
      "Fetches all bookmarks from the backend API. After calling this tool, you MUST IMMEDIATELY render the BookmarkList component with the returned bookmarks data to display the beautiful bookmark cards. The BookmarkList component will show magnificent cards with website favicons, gradient accents, 3D hover effects, tags, and statistics footer. NEVER just show the raw JSON - ALWAYS render the BookmarkList component.",
    tool: async () => {
      const response = await fetch("/api/bookmarks");
      if (!response.ok) {
        throw new Error(`Failed to fetch bookmarks: ${response.statusText}`);
      }
      const data = await response.json();

      // Return data in a format that triggers BookmarkList rendering
      return {
        bookmarks: data.bookmarks,
        _component: "BookmarkList",
      };
    },
    inputSchema: z.object({}),
    outputSchema: z.object({
      bookmarks: z.array(BookmarkSchema),
      _component: z.string().optional(),
    }),
  }),
  defineTool({
    name: "createBookmark",
    description: "Creates a new bookmark in the backend",
    tool: async ({
      title,
      url,
      description,
      tags,
    }: {
      title: string;
      url: string;
      description?: string;
      tags?: string[];
    }) => {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, url, description, tags }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || `Failed to create bookmark: ${response.statusText}`,
        );
      }
      const data = await response.json();
      return data;
    },
    inputSchema: z.object({
      title: z.string().describe("The title of the bookmark"),
      url: z.string().describe("The URL of the bookmark"),
      description: z
        .string()
        .optional()
        .describe("Optional description of the bookmark"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Optional tags for categorizing the bookmark"),
    }),
    outputSchema: z.object({
      bookmark: BookmarkSchema,
    }),
  }),
  defineTool({
    name: "updateBookmark",
    description: "Updates an existing bookmark by ID",
    tool: async ({
      id,
      title,
      url,
      description,
      tags,
    }: {
      id: string;
      title?: string;
      url?: string;
      description?: string;
      tags?: string[];
    }) => {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, url, description, tags }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || `Failed to update bookmark: ${response.statusText}`,
        );
      }
      const data = await response.json();
      return data;
    },
    inputSchema: z.object({
      id: z.string().describe("The ID of the bookmark to update"),
      title: z.string().optional().describe("The new title for the bookmark"),
      url: z.string().optional().describe("The new URL for the bookmark"),
      description: z
        .string()
        .optional()
        .describe("The new description for the bookmark"),
      tags: z
        .array(z.string())
        .optional()
        .describe("The new tags for the bookmark"),
    }),
    outputSchema: z.object({
      bookmark: BookmarkSchema,
    }),
  }),
  defineTool({
    name: "deleteBookmark",
    description: "Deletes a bookmark by ID from the backend",
    tool: async ({ id }: { id: string }) => {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || `Failed to delete bookmark: ${response.statusText}`,
        );
      }
      const data = await response.json();
      return data;
    },
    inputSchema: z.object({
      id: z.string().describe("The ID of the bookmark to delete"),
    }),
    outputSchema: z.object({
      message: z.string(),
    }),
  }),
];

export { BookmarkSchema };
