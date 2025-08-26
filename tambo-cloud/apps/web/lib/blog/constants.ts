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

export const GRADIENTS = [
  "bg-gradient-to-br from-emerald-300/80 via-cyan-300/80 to-blue-400/80",
  "bg-gradient-to-br from-pink-300/80 via-rose-300/80 to-emerald-300/80",
  "bg-gradient-to-br from-blue-400/80 via-indigo-300/80 to-pink-300/80",
  "bg-gradient-to-br from-yellow-300/80 via-lime-300/80 to-emerald-300/80",
  "bg-gradient-to-br from-teal-400/80 via-cyan-400/80 to-blue-400/80",
  "bg-gradient-to-br from-emerald-400/80 via-teal-300/80 to-pink-300/80",
];
