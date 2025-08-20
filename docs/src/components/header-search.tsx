"use client";

import { Search } from "lucide-react";

export default function HeaderSearch() {
  function openSearch() {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label="Open search (⌘K)"
      className="flex w-full max-w-sm items-center gap-3 rounded-lg bg-[#e8e8e8] hover:bg-[#d8d8d8]/30 border border-black/10 px-3 py-2 text-left transition-colors cursor-pointer"
    >
      <Search className="h-4 w-4 text-gray-500" />
      <span className="flex-1 text-gray-500">Search</span>
      <div className="flex items-center gap-1">
        <kbd className="rounded bg-white px-1.5 py-0.5 text-xs font-medium shadow-sm text-gray-500">
          ⌘
        </kbd>
        <kbd className="rounded bg-white px-1.5 py-0.5 text-xs font-medium shadow-sm text-gray-500">
          K
        </kbd>
      </div>
    </button>
  );
}
