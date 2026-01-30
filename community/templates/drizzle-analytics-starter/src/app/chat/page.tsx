"use client";
import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { ApiKeyCheck } from "@/components/ui/ApiKeyCheck";
import { cn } from "@/lib/utils";

interface MessageContentPart {
  text?: string;
  type?: string;
}

interface MessageContent {
  text?: string;
  parts?: MessageContentPart[];
}

function extractText(content: string | MessageContent | MessageContentPart[] | null | undefined): string {
  if (!content) return "";

  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content.map((p) => p?.text ?? "").join("");
  }

  if (typeof content === "object") {
    if ("text" in content && typeof content.text === "string") {
      return content.text;
    }
    if ("parts" in content && Array.isArray(content.parts)) {
      return content.parts.map((p: MessageContentPart) => p?.text ?? "").join("");
    }
  }

  return "";
}

export default function ChatPage() {
  const { thread } = useTamboThread({ autoStart: true });
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-100 font-sans">
      <ApiKeyCheck />

      <header className="px-6 py-4 border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <h1 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Drizzle Analytics
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 max-w-4xl mx-auto w-full scroll-smooth">
        {thread.messages.map((m) => {
          const text = extractText(m.content as MessageContent);

          return (
            <div
              key={m.id}
              className={cn(
                "flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500",
                m.role === "user" ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "px-6 py-4 rounded-2xl max-w-[85%] text-[14px] leading-relaxed shadow-lg",
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none"
                )}
              >
                <div className="whitespace-pre-wrap font-medium">
                  {text || "..."}
                </div>
              </div>

              {m.renderedComponent && (
                <div className="mt-6 w-full animate-in zoom-in-95 duration-300">
                  {m.renderedComponent}
                </div>
              )}
            </div>
          );
        })}

        {isPending && (
          <div className="flex items-center gap-3 text-zinc-500 text-xs px-2 italic animate-pulse">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            Processing database query...
          </div>
        )}
      </div>

      <div className="p-8 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await submit();
            setValue("");
          }}
          className="max-w-3xl mx-auto relative flex items-center"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search analytics records..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-6 pr-16 py-4 text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all shadow-2xl"
          />
          <button
            type="submit"
            disabled={!value || isPending}
            className="absolute right-2 px-4 py-2 bg-zinc-100 text-black rounded-xl text-xs font-bold hover:bg-white active:scale-95 disabled:opacity-20 transition-all shadow-sm"
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}