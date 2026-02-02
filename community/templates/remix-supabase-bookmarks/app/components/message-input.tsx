import { useTamboThreadInput } from "@tambo-ai/react";
import { useEffect, useRef, useCallback } from "react";
import { Loader2, Paperclip, SendHorizonal, X } from "lucide-react";
import DictationButton from "./dictation-button";

// ============================================================================
// Staged Images Component
// ============================================================================

function StagedImages() {
  const { images, removeImage } = useTamboThreadInput();

  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-200">
      {images.map((image, index) => (
        <div key={image.id} className="relative group">
          <div className="w-20 h-20 rounded-md overflow-hidden border border-slate-200 shadow-sm">
            <img
              src={image.dataUrl}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => removeImage(image.id)}
            className="absolute -top-1 -right-1 w-5 h-5 bg-white border border-slate-300 text-slate-600 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors shadow-sm"
            aria-label="Remove image"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// File Button Component
// ============================================================================

function FileButton() {
  const { addImages, images } = useTamboThreadInput();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 10;

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    try {
      const totalImages = images.length + files.length;

      if (totalImages > MAX_IMAGES) {
        console.warn(`Max ${MAX_IMAGES} uploads at a time`);
        e.target.value = "";
        return;
      }

      await addImages(files);
    } catch (error) {
      console.error("Failed to add selected files:", error);
    }
    e.target.value = "";
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={images.length >= MAX_IMAGES}
      className="p-2 text-slate-600 transition hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Attach Images"
      title="Attach Images"
    >
      <Paperclip className="h-5 w-5" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </button>
  );
}

// ============================================================================
// Message Input Component
// ============================================================================

export function MessageInput() {
  const { value, setValue, submit, isPending, addImages, images, removeImage } =
    useTamboThreadInput();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_IMAGES = 10;
  const IMAGE_CLEAR_DELAY_MS = 100;

  const clearAllImages = useCallback(() => {
    images.forEach((image) => {
      removeImage(image.id);
    });
  }, [images, removeImage]);

  const doSubmit = useCallback(() => {
    if ((value.trim() || images.length > 0) && !isPending) {
      submit();
      // Manually clear images after submit
      setTimeout(() => {
        clearAllImages();
      }, IMAGE_CLEAR_DELAY_MS);
    }
  }, [value, images.length, isPending, submit, clearAllImages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSubmit();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems: File[] = [];

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          imageItems.push(file);
        }
      }
    }

    if (imageItems.length > 0) {
      e.preventDefault();
      const totalImages = images.length + imageItems.length;

      if (totalImages > MAX_IMAGES) {
        console.warn(`Max ${MAX_IMAGES} uploads at a time`);
        return;
      }

      try {
        await addImages(imageItems);
      } catch (error) {
        console.error("Failed to add pasted images:", error);
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const suggestions = [
    {
      title: "Save https://remix.run as...",
      query: "Save https://remix.run as a tech resource",
    },
    { title: "Find my tech bookmarks", query: "Find my tech bookmarks" },
    { title: "Show my categories", query: "Show all my bookmark categories" },
  ];

  return (
    <div className="border-t border-slate-200 bg-white">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 py-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-100">
          <StagedImages />
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <FileButton />
            </div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Type your message or paste images..."
              disabled={isPending}
              rows={1}
              className="w-full resize-none rounded-xl bg-transparent pl-12 pr-24 py-3 text-sm placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <DictationButton />
              <button
                type="submit"
                disabled={isPending || (!value.trim() && images.length === 0)}
                className="rounded-lg bg-slate-900 p-2 text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.title}
              type="button"
              onClick={() => setValue(suggestion.query)}
              disabled={isPending}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
            >
              {suggestion.title}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
