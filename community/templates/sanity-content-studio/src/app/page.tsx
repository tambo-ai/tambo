"use client";

import { ChatInput } from "@/components/chat/chat-input";
import { GenerationStatus } from "@/components/chat/generation-status";
import { MessageList } from "@/components/chat/message-list";
import Silk from "@/components/ui/silk";
import { TamboThreadProvider, useTamboThread } from "@tambo-ai/react";
import { ExternalLink, LayoutGrid } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const SANITY_STUDIO_URL =
  process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "https://sanity.io/manage";

function StudioContent() {
  const { thread } = useTamboThread();
  const messages = thread?.messages || [];
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Silk className="opacity-20" />
        </div>

        {/* Branding - Top Left */}
        <div className="absolute top-6 left-6 z-50 flex items-center gap-3 select-none pointer-events-none opacity-50">
             <div className="relative h-6 w-6 overflow-hidden rounded-md grayscale">
                <Image 
                  src="/application.png" 
                  alt="Logo" 
                  fill
                  className="object-cover"
                />
             </div>
             <span className="text-sm font-bold tracking-[0.2em] text-white/50">
               STUDIO
             </span>
        </div>

        {/* Actions - Top Right */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full bg-zinc-900/50 border border-white/5 px-4 py-2 text-xs font-semibold text-zinc-400 shadow-sm transition-all hover:bg-zinc-800 hover:text-white hover:scale-105 active:scale-95"
          >
            <LayoutGrid className="h-3.5 w-3.5 opacity-70" />
            Dashboard
          </Link>
          <a
            href={SANITY_STUDIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-zinc-900/50 border border-white/5 px-4 py-2 text-xs font-semibold text-zinc-400 shadow-sm transition-all hover:bg-zinc-800 hover:text-white hover:scale-105 active:scale-95"
          >
            Open Studio
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </div>

        {/* Chat Area */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-8">
            {isGenerating ? (
               <div className="flex flex-col items-center justify-center w-full">
                  <GenerationStatus
                      isVisible={isGenerating}
                  />
               </div>
            ) : messages.length === 0 ? (
               <div className="w-full max-w-xl mx-auto">
                   <ChatInput 
                       onMessageSent={() => setIsGenerating(true)} 
                   />
               </div>
            ) : (
                <div className="w-full flex justify-center h-[calc(100vh-120px)] overflow-hidden">
                    <div className="w-full flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                         {/* Success Banner */}
                         <div className="mb-4 flex justify-center shrink-0">
                            <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-medium text-emerald-400 flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Content Generated Successfully
                            </div>
                         </div>

                         {/* Message List Area */}
                         <div className="flex-1 overflow-y-auto scrollbar-hide mb-4">
                            <MessageList />
                         </div>

                         {/* Footer Actions */}
                         <div className="shrink-0 space-y-4">
                             <div className="flex justify-center">
                                <Link href="/dashboard" className="px-6 py-3 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200">
                                    Read &rarr;
                                </Link>
                             </div>
                             <div className="w-full max-w-3xl mx-auto opacity-50 pointer-events-none grayscale">
                                 <ChatInput />
                             </div>
                         </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default function Home() {
  return (
    <TamboThreadProvider>
        <StudioContent />
    </TamboThreadProvider>
  );
}
