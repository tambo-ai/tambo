import type { TamboComponent } from "@tambo-ai/react";
import {
  BookmarkCard,
  bookmarkCardPropsSchema,
  BookmarkList,
  bookmarkListPropsSchema,
  CategorySummary,
  categorySummaryPropsSchema,
} from "~/components/bookmark-card";

/**
 * Tambo component registry for generative UI.
 * These components can be rendered by the AI in chat responses.
 */
export const tamboComponents: TamboComponent[] = [
  {
    name: "BookmarkCard",
    description:
      "Displays a single bookmark as a clickable card with favicon, title, URL, and category. Use this when showing a specific bookmark to the user, such as after adding a new bookmark or finding a single result.",
    component: BookmarkCard,
    propsSchema: bookmarkCardPropsSchema,
  },
  {
    name: "BookmarkList",
    description:
      "Displays a list of multiple bookmarks as interactive cards. ALWAYS use this component to display results from the search_bookmarks tool. Use when showing search results, listing bookmarks in a category, or displaying multiple bookmarks. Pass the bookmarks array from the tool result directly to this component.",
    component: BookmarkList,
    propsSchema: bookmarkListPropsSchema,
  },
  {
    name: "CategorySummary",
    description:
      "Shows a visual summary of bookmark categories with a colorful progress bar. ALWAYS use this component to display results from the get_category_stats tool. Pass the categories array from the tool result directly to this component.",
    component: CategorySummary,
    propsSchema: categorySummaryPropsSchema,
  },
];
