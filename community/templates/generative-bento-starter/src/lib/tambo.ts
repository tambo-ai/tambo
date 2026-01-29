/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { BookmarkList } from "@/components/tambo/bookmark-list";
import {
  bookmarkSchema,
  createBookmark,
  deleteBookmark,
  getBookmarks,
  updateBookmark,
} from "@/lib/supabase";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 */
export const tools: TamboTool[] = [
  {
    name: "getBookmarks",
    description: "Fetch bookmarks with an optional tag filter",
    tool: getBookmarks,
    inputSchema: z.object({
      tag: z.string().optional(),
    }),
    outputSchema: z.array(bookmarkSchema),
  },
  {
    name: "createBookmark",
    description: "Save a new bookmark",
    tool: createBookmark,
    inputSchema: z.object({
      title: z.string(),
      url: z.string().url(),
      tags: z.array(z.string()).optional(),
    }),
    outputSchema: bookmarkSchema,
  },
  {
    name: "updateBookmark",
    description: "Update a bookmark title or tags",
    tool: updateBookmark,
    inputSchema: z.object({
      id: z.string(),
      updates: z.object({
        title: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    }),
    outputSchema: bookmarkSchema,
  },
  {
    name: "deleteBookmark",
    description: "Delete a bookmark by ID",
    tool: deleteBookmark,
    inputSchema: z.object({
      id: z.string(),
    }),
    outputSchema: z.void(),
  },
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 */
export const components: TamboComponent[] = [
  {
    name: "BookmarkList",
    description: "Displays a grid of bookmark cards.",
    component: BookmarkList,
    propsSchema: z.object({
      bookmarks: z.array(bookmarkSchema),
    }),
  },
];
