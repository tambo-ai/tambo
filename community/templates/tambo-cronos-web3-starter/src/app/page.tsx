"use client";

import { ConnectButton } from "@/components/ui/ConnectButton";
import { ChatInterface } from "@/components/ui/ChatInterface";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cronos-secondary to-cronos-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">
                Cronos AI Assistant
              </h1>
              <p className="text-white/50 text-sm">Powered by Tambo</p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        <ChatInterface />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-4 text-center">
        <p className="text-white/40 text-sm">
          Built with{" "}
          <a
            href="https://tambo.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cronos-secondary hover:underline"
          >
            Tambo
          </a>{" "}
          +{" "}
          <a
            href="https://cronos.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cronos-secondary hover:underline"
          >
            Cronos
          </a>
        </p>
      </footer>
    </main>
  );
}
