"use client";

import { Bookmark, deleteBookmark } from "@/lib/supabase";
import { useTambo } from "@tambo-ai/react";
import { motion } from "framer-motion";
import { ExternalLink, Tag as TagIcon, Trash2 } from "lucide-react";
import * as React from "react";

export const BookmarkList = ({ bookmarks }: { bookmarks: Bookmark[] }) => {
  const { thread } = useTambo();
  const [items, setItems] = React.useState(bookmarks);

  const handleDelete = async (id: string) => {
    try {
      setItems(items.filter((b) => b.id !== id));
      await deleteBookmark({ id });
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-12 text-neutral-500 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-200/50 dark:border-neutral-800/50"
      >
        <p>No bookmarks found.</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {items.map((bookmark, index) => (
        <motion.div
          key={bookmark.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="group relative flex flex-col p-5 bg-white dark:bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-3">
            <h3
              className="font-semibold text-neutral-900 dark:text-white truncate pr-6 text-base tracking-tight"
              title={bookmark.title}
            >
              {bookmark.title}
            </h3>
            <button
              onClick={() => handleDelete(bookmark.id!)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-neutral-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-neutral-500 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5 mb-4 truncate"
          >
            <div className="p-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
              <ExternalLink className="w-3 h-3" />
            </div>
            {new URL(bookmark.url).hostname.replace("www.", "")}
          </a>

          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800/50">
              {bookmark.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-neutral-100/50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50"
                >
                  <TagIcon className="w-3 h-3 mr-1.5 opacity-40" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};
