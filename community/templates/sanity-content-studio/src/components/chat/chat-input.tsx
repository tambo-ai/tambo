"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import {
  ArrowUp,
  AudioWaveform,
  Globe,
  Mic,
  Paperclip,
  Plus,
  Sparkles
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ChatInput() {
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { thread } = useTamboThread();
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const hasMessages = thread?.messages && thread.messages.length > 0;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (value.trim() && !isPending) {
      submit();
      setIsExpanded(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setIsExpanded(e.target.value.length > 100 || e.target.value.includes("\n"));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full transition-all duration-500 ease-in-out">
      {!hasMessages && (
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-center text-5xl font-bold tracking-tight leading-tight text-white/90 animate-in fade-in slide-in-from-bottom-4 duration-700 drop-shadow-sm">
            What&apos;s the move?
          </h1>
        </div>
      )}

      <form onSubmit={handleSubmit} className="group/composer w-full max-w-3xl mx-auto relative z-20">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={() => {}}
        />

        <div
          className={cn(
            "w-full bg-[#18181b] cursor-text overflow-hidden p-2.5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] border-0 transition-all duration-300 ease-out",
            {
              "rounded-3xl grid grid-cols-1 grid-rows-[auto_1fr_auto] gap-2": isExpanded,
              "rounded-[32px] grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] items-end": !isExpanded,
            }
          )}
          style={{
            gridTemplateAreas: isExpanded
              ? "'header' 'primary' 'footer'"
              : "'header header header' 'leading primary trailing' '. footer .'",
          }}
        >
          {/* ... existing input internals ... */}
          <div
            className={cn("flex", { hidden: isExpanded })}
            style={{ gridArea: "leading" }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white shadow-sm border border-white/5 transition-all ml-1 duration-200 hover:scale-105"
                >
                  <Plus className="h-5 w-5" strokeWidth={1.5} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="max-w-xs rounded-xl border-zinc-800 bg-[#18181b] text-zinc-200 p-2 shadow-2xl"
              >
                <DropdownMenuGroup className="space-y-1">
                  <DropdownMenuItem
                    className="rounded-lg hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="mr-2 h-4 w-4 opacity-60" strokeWidth={1.5} />
                    Add photos & files
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-lg hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  >
                    <Sparkles className="mr-2 h-4 w-4 opacity-60" strokeWidth={1.5} />
                    Agent mode
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-lg hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  >
                    <Globe className="mr-2 h-4 w-4 opacity-60" strokeWidth={1.5} />
                    Deep Research
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div
            className={cn(
              "flex min-h-[44px] items-center overflow-x-hidden px-2",
              {
                "px-2 py-2": isExpanded,
                "py-1": !isExpanded,
              }
            )}
            style={{ gridArea: "primary" }}
          >
            <div className="flex-1 overflow-auto max-h-52">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                disabled={isPending}
                className="min-h-0 w-full resize-none border-0 bg-transparent p-0 text-lg text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-hide shadow-none leading-relaxed selection:bg-white/20 pl-2 tracking-tight"
                rows={1}
              />
            </div>
          </div>

          <div
            className="flex items-center gap-2"
            style={{ gridArea: isExpanded ? "footer" : "trailing" }}
          >
            <div className="ms-auto flex items-center gap-2 mr-1">
              {/* Connected Dot */}
              <div className="flex items-center justify-center p-2" title="Connected">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>

              <Button
                type="button"
                size="icon"
                className="h-10 w-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white shadow-sm border border-white/5 transition-all duration-200 hover:scale-105"
                title="Voice Input"
              >
                <Mic className="h-4 w-4" strokeWidth={1.5} />
              </Button>

              <Button
                type="button"
                size="icon"
                className="h-10 w-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white shadow-sm border border-white/5 transition-all duration-200 hover:scale-105"
                title="Audio Mode"
              >
                <AudioWaveform className="h-4 w-4" strokeWidth={1.5} />
              </Button>

              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!value.trim() || isPending}
                size="icon"
                className={cn(
                  "h-10 w-10 transition-all duration-200 shadow-sm border border-white/5",
                  value.trim() 
                    ? "bg-black text-white hover:bg-zinc-900 shadow-md hover:scale-105 rounded-xl" 
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed rounded-xl"
                )}
              >
                <ArrowUp className="h-5 w-5" strokeWidth={3} />
              </Button>
            </div>
          </div>
        </div>
      </form>

      {!hasMessages && (
        <div className="mt-8 flex flex-wrap justify-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          {[
            "Create a blog post", 
            "Draft an email", 
            "Brainstorm ideas",
            "Summarize this article"
          ].map((suggestion) => (
            <button 
              key={suggestion} 
              onClick={() => {
                setValue(suggestion);
                textareaRef.current?.focus();
              }}
              className="rounded-full bg-zinc-800 border border-white/5 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
