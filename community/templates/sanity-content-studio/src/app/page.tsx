"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import Silk from "@/components/ui/silk";
import { TamboThreadProvider } from "@tambo-ai/react";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

const SANITY_STUDIO_URL =
  process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "https://sanity.io/manage";

export default function Home() {
  return (
    <TamboThreadProvider>
      <main className="relative flex min-h-screen flex-col overflow-hidden bg-black selection:bg-violet-500/30">
        <Silk className="opacity-40" />
        
        {/* Branding - Top Left */}
        <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl">
             <Image 
               src="/application.png" 
               alt="Content Studio" 
               fill
               className="object-cover"
             />
          </div>
          <span className="text-xl font-bold tracking-tight text-white/90 drop-shadow-sm">
            Content Studio
          </span>
        </div>

        {/* Actions - Top Right */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
          <a
            href={SANITY_STUDIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-zinc-800 border border-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 shadow-md transition-all hover:bg-zinc-700 hover:text-white hover:scale-105 active:scale-95 hover:shadow-lg"
          >
            Open Studio
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </div>

        <div className="relative z-10 flex flex-1 flex-col pt-20">
          <ChatLayout />
        </div>
      </main>
    </TamboThreadProvider>
  );
}
