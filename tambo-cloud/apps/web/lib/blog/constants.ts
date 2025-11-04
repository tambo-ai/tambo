import type { BlogCategory } from "./types";

export const CATEGORY_DISPLAY_MAP: Record<BlogCategory, string> = {
  new: "New",
  feature: "Feature",
  "bug fix": "Bug Fix",
  update: "Update",
  event: "Event",
  tutorial: "Tutorial",
  announcement: "Announcement",
};

export const CATEGORY_COLORS: Record<BlogCategory, string> = {
  new: "bg-green-100 text-green-800",
  feature: "bg-blue-100 text-blue-800",
  "bug fix": "bg-red-100 text-red-800",
  update: "bg-yellow-100 text-yellow-800",
  event: "bg-purple-100 text-purple-800",
  tutorial: "bg-indigo-100 text-indigo-800",
  announcement: "bg-gray-100 text-gray-800",
};
