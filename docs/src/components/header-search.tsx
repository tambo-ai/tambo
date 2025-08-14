"use client";

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
      className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-left text-neutral-600 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
    >
      <span className="i-lucide-search h-4 w-4" aria-hidden />
      <span className="flex-1">Search…</span>
      <kbd className="rounded border px-1.5 py-0.5 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
        ⌘K
      </kbd>
    </button>
  );
}
