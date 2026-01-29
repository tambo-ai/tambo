"use client";

import { ApiKeyCheck } from "@/components/ApiKeyCheck";
import Image from "next/image";
import { useSession, signOut } from "@/lib/auth-client";

const KeyFilesSection = () => (
  <div className="bg-white px-8 py-4">
    <h2 className="text-xl font-semibold mb-4">Key Features:</h2>
    <ul className="space-y-4 text-gray-600">
      <li className="flex items-start gap-2">
        <span>🔐</span>
        <span>
          <strong>Authentication:</strong> Email, Google, and GitHub OAuth via
          BetterAuth
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>🤖</span>
        <span>
          <strong>Tambo AI:</strong> Chat interface with custom tools and
          components
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>🛒</span>
        <span>
          <strong>Shopping Demo:</strong> Add products to cart via natural
          language ("add headphones to cart")
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>⚙️</span>
        <span>
          <strong>Backend:</strong> Hono server with Drizzle ORM and PostgreSQL
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📁</span>
        <span>
          <code className="font-mono text-sm">src/lib/tambo.ts</code> - Tool
          and component registration
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📁</span>
        <span>
          <code className="font-mono text-sm">
            src/lib/shopping-tools.ts
          </code>{" "}
          - AI shopping tool definitions
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📁</span>
        <span>
          <code className="font-mono text-sm">
            src/app/interactables/
          </code>{" "}
          - AI chat and shopping demo page
        </span>
      </li>
    </ul>
    <div className="flex gap-4 flex-wrap mt-4">
      <a
        href="https://docs.tambo.co"
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 rounded-md font-medium transition-colors text-lg mt-4 border border-gray-300 hover:bg-gray-50"
      >
        Tambo Docs
      </a>
      <a
        href="https://www.betterauth.com"
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 rounded-md font-medium transition-colors text-lg mt-4 border border-gray-300 hover:bg-gray-50"
      >
        BetterAuth Docs
      </a>
      <a
        href="https://hono.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 rounded-md font-medium transition-colors text-lg mt-4 border border-gray-300 hover:bg-gray-50"
      >
        Hono Docs
      </a>
      
    </div>
  </div>
);

export default function Home() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-2xl w-full space-y-8">
        <div className="flex flex-col items-center">
          <a href="https://tambo.co" target="_blank" rel="noopener noreferrer">
            <Image
              src="/Octo-Icon.svg"
              alt="Tambo AI Logo"
              width={80}
              height={80}
              className="mb-4"
            />
          </a>
          <h1 className="text-4xl text-center">
            tambo betterauth + Hono + drizzle template
          </h1>
        </div>

        <div className="w-full space-y-8">
          <div className="bg-white px-8 py-4">
            <h2 className="text-xl font-semibold mb-4">Get Started</h2>
            <ApiKeyCheck>
              <div className="flex gap-4 flex-wrap">
                {session ? (
                  <>
                    <span className="px-6 py-3 text-lg text-gray-700">
                      Welcome, {session.user?.email || "User"}!
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="px-6 py-3 rounded-md font-medium shadow-sm transition-colors text-lg mt-4 bg-red-500 hover:bg-red-600 text-white"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <a
                    href="/auth/sign-in"
                    className="px-6 py-3 rounded-md font-medium shadow-sm transition-colors text-lg mt-4 bg-[#7fc1ff] hover:bg-[#72a0e6] text-gray-800"
                  >
                    Sign In
                  </a>
                )}

                <a
                  href="/interactables"
                  className="px-6 py-3 rounded-md font-medium shadow-sm transition-colors text-lg mt-4 bg-[#FFE17F] hover:bg-[#f5d570] text-gray-800"
                >
                  View Shopping Demo →
                </a>
              </div>
            </ApiKeyCheck>
          </div>

          <KeyFilesSection />
        </div>
      </main>
    </div>
  );
}
