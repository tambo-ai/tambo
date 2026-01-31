import { useTamboThreadInput, useTamboThread } from "@tambo-ai/react";
import type React from "react";
import { useState, useEffect, useRef } from "react";
import { DictationButton } from "./tambo/DictationButton.js";

// Helper to check if message has text content
const hasTextContent = (content: unknown): boolean => {
  if (!content) return false;
  if (typeof content === "string") return content.trim().length > 0;
  if (Array.isArray(content)) {
    return content.some((part: unknown) => {
      if (
        typeof part === "object" &&
        part !== null &&
        "type" in part &&
        "text" in part
      ) {
        const typedPart = part as { type?: string; text?: string };
        return (
          typedPart.type === "text" &&
          typeof typedPart.text === "string" &&
          typedPart.text.trim().length > 0
        );
      }
      return false;
    });
  }
  return false;
};

const MAX_IMAGES = 10;

export const Chat = () => {
  const { value, setValue, submit, isPending, addImages, images, removeImage } =
    useTamboThreadInput();
  const { thread } = useTamboThread();
  const [isDark, setIsDark] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply theme on mount and when changed
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isPending) return;
    await submit();
    setValue("");
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    try {
      const totalImages = images.length + files.length;

      if (totalImages > MAX_IMAGES) {
        setImageError(`Max ${MAX_IMAGES} uploads at a time`);
        e.target.value = "";
        return;
      }

      setImageError(null);
      await addImages(files);
    } catch (error) {
      console.error("Failed to add selected files:", error);
      setImageError("Failed to upload files");
    }
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Professional Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-[#7FFFC3] to-[#FFE17F] flex items-center justify-center shadow-md">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-gray-800"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Tambo AI</h1>
            <p className="text-xs text-muted-foreground">
              Hono Backend Template
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg hover:bg-accent transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-foreground"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-foreground"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-background">
        {thread.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-6 opacity-40">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#7FFFC3] to-[#FFE17F] flex items-center justify-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-800"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground mb-3">
              Start a conversation
            </p>
            <p className="text-sm text-muted-foreground max-w-125">
              Try: "Create a bookmark for https://hono.dev" or "Show me all
              bookmarks"
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            {thread.messages.map((message) => {
              const hasText = hasTextContent(message.content);
              const hasComponent = !!message.renderedComponent;

              // Don't render empty assistant messages (only tool calls, no text/component)
              if (message.role === "assistant" && !hasText && !hasComponent) {
                return null;
              }

              return (
                <div
                  key={message.id}
                  className={`flex gap-4 items-start ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === "user"
                        ? "bg-linear-to-br from-primary to-primary/80 shadow-md"
                        : "bg-linear-to-br from-[#7FFFC3] to-[#FFE17F] shadow-md"
                    }`}
                  >
                    {message.role === "user" ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-primary-foreground"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="text-gray-800"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <path d="M9 9h6M9 15h6" />
                      </svg>
                    )}
                  </div>

                  {/* Message Content */}
                  <div
                    className={`flex-1 flex flex-col gap-3 ${
                      message.role === "user" ? "items-end" : ""
                    } ${message.role === "user" ? "max-w-[75%]" : "w-full"}`}
                  >
                    {hasText && (
                      <div
                        className={`px-5 py-3 rounded-2xl shadow-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border text-foreground"
                        }`}
                      >
                        {Array.isArray(message.content) ? (
                          message.content.map((part, i) =>
                            part.type === "text" ? (
                              <p
                                key={i}
                                className="m-0 wrap-break-word leading-relaxed"
                              >
                                {part.text}
                              </p>
                            ) : null,
                          )
                        ) : (
                          <p className="m-0 wrap-break-word leading-relaxed">
                            {String(message.content)}
                          </p>
                        )}
                      </div>
                    )}
                    {hasComponent && (
                      <div className="w-full">{message.renderedComponent}</div>
                    )}
                  </div>
                </div>
              );
            })}
            {isPending && (
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-linear-to-br from-[#7FFFC3] to-[#FFE17F] shadow-md">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-gray-800"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <path d="M9 9h6M9 15h6" />
                  </svg>
                </div>
                <div className="flex-1 flex flex-col gap-3 w-full">
                  <div className="px-5 py-4 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-[typing_1.4s_infinite]" />
                      <span
                        className="w-2 h-2 rounded-full bg-muted-foreground animate-[typing_1.4s_infinite]"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-muted-foreground animate-[typing_1.4s_infinite]"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card shadow-lg">
        <form className="max-w-4xl mx-auto p-4" onSubmit={handleSubmit}>
          {/* Image Previews */}
          {images.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group w-20 h-20 rounded-lg overflow-hidden border-2 border-border bg-muted shadow-sm"
                >
                  <img
                    src={image.dataUrl}
                    alt={image.name || "Upload"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center text-sm hover:bg-destructive/80 shadow-md"
                      title="Remove image"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-1">
                      <span className="text-white text-[10px] block truncate">
                        {image.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {imageError && (
            <div className="mb-3 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {imageError}
            </div>
          )}

          <div className="flex gap-2 items-end">
            {/* File Input (hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            {/* Attachment Button */}
            <button
              type="button"
              onClick={handleFileClick}
              disabled={isPending}
              className="p-3 rounded-lg border-2 border-border bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach files"
              aria-label="Attach files"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-foreground"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ask me to create, update, or manage bookmarks..."
                disabled={isPending}
                className="w-full px-5 py-3 border-2 border-border rounded-lg bg-background text-foreground text-base outline-none transition-all focus:border-ring focus:ring-4 focus:ring-ring/20 disabled:opacity-60 disabled:cursor-not-allowed pr-12"
              />
            </div>

            {/* Voice Input Button */}
            <DictationButton />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isPending || !value.trim()}
              className="px-6 py-3 border-0 rounded-lg bg-primary text-primary-foreground text-base font-semibold cursor-pointer transition-all whitespace-nowrap shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-md flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
};
