import { ApiKeyCheck } from "@/components/ApiKeyCheck";
import Image from "next/image";

const FeaturesSection = () => (
  <div className="bg-gradient-to-br from-orange-50 to-amber-50 px-8 py-6 rounded-lg border border-orange-100">
    <h2 className="text-xl font-semibold mb-4 text-orange-900">
      ✨ Key Features
    </h2>
    <ul className="space-y-3 text-gray-700">
      <li className="flex items-start gap-3">
        <span className="text-orange-500 text-xl">🦆</span>
        <span>
          <strong>In-Browser SQL Engine</strong> - DuckDB-WASM runs entirely
          client-side for blazing-fast queries
        </span>
      </li>
      <li className="flex items-start gap-3">
        <span className="text-green-500 text-xl">🔒</span>
        <span>
          <strong>Privacy-First</strong> - Your data never leaves your browser;
          only query results are shared with AI
        </span>
      </li>
      <li className="flex items-start gap-3">
        <span className="text-blue-500 text-xl">📊</span>
        <span>
          <strong>Multi-Format Support</strong> - Upload CSV, Parquet, and JSON
          files instantly
        </span>
      </li>
      <li className="flex items-start gap-3">
        <span className="text-purple-500 text-xl">🤖</span>
        <span>
          <strong>AI-Powered Analytics</strong> - Ask questions in natural
          language, get SQL-powered insights
        </span>
      </li>
    </ul>
  </div>
);

const KeyFilesSection = () => (
  <div className="bg-white px-8 py-6 rounded-lg border border-gray-200">
    <h2 className="text-xl font-semibold mb-4">📁 Project Structure</h2>
    <ul className="space-y-3 text-gray-600">
      <li className="flex items-start gap-2">
        <span className="text-orange-500">🦆</span>
        <span>
          <code className="font-medium font-mono bg-gray-100 px-1 rounded">
            src/services/duckdb.ts
          </code>{" "}
          - Core DuckDB-WASM service initialization
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-orange-500">🦆</span>
        <span>
          <code className="font-medium font-mono bg-gray-100 px-1 rounded">
            src/contexts/DuckDBContext.tsx
          </code>{" "}
          - React Context for database state management
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-orange-500">🦆</span>
        <span>
          <code className="font-medium font-mono bg-gray-100 px-1 rounded">
            src/services/duckdb-query.ts
          </code>{" "}
          - AI-compatible query wrapper functions
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono bg-gray-100 px-1 rounded">
            src/app/chat/page.tsx
          </code>{" "}
          - Chat page with DuckDB integration
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono bg-gray-100 px-1 rounded">
            src/components/tambo/message-thread-full.tsx
          </code>{" "}
          - Chat UI with data upload button
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-blue-500">📄</span>
        <span>
          <code className="font-medium font-mono bg-gray-100 px-1 rounded">
            src/lib/tambo.ts
          </code>{" "}
          - Tambo tools registration (executeDuckDBQuery, getTableStats)
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-blue-500">📄</span>
        <span>
          <code className="font-medium font-mono bg-gray-100 px-1 rounded">
            README.md
          </code>{" "}
          - Full documentation with data flow diagram
        </span>
      </li>
    </ul>
    <div className="flex gap-4 flex-wrap mt-6">
      <a
        href="https://docs.tambo.co"
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 rounded-md font-medium transition-colors text-lg border border-gray-300 hover:bg-gray-50"
      >
        Tambo Docs
      </a>
      <a
        href="https://duckdb.org/docs/api/wasm/overview"
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 rounded-md font-medium transition-colors text-lg border border-orange-300 hover:bg-orange-50 text-orange-700"
      >
        DuckDB-WASM Docs
      </a>
    </div>
  </div>
);

export default function Home() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-white to-gray-50">
      <main className="max-w-2xl w-full space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-4 mb-4">
            <a
              href="https://tambo.co"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/Octo-Icon.svg"
                alt="Tambo AI Logo"
                width={70}
                height={70}
              />
            </a>
            <span className="text-3xl text-gray-400">+</span>
            <a
              href="https://duckdb.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/duckdb_logo.png"
                alt="DuckDB Logo"
                width={70}
                height={70}
              />
            </a>
          </div>
          <h1 className="text-4xl text-center font-bold bg-gradient-to-r from-gray-800 via-orange-600 to-amber-500 bg-clip-text text-transparent">
            Tambo + DuckDB-WASM
          </h1>
          <p className="text-gray-600 text-center mt-2 text-lg">
            AI-powered in-browser data analytics
          </p>
        </div>

        <div className="w-full space-y-6">
          <div className="bg-white px-8 py-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">🚀 Get Started</h2>
            <ApiKeyCheck>
              <div className="flex gap-4 flex-wrap">
                <a
                  href="/chat"
                  className="px-6 py-3 rounded-md font-medium shadow-sm transition-all text-lg bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white"
                >
                  Open Data Chat →
                </a>
                <a
                  href="/interactables"
                  className="px-6 py-3 rounded-md font-medium shadow-sm transition-colors text-lg bg-[#FFE17F] hover:bg-[#f5d570] text-gray-800"
                >
                  Interactables Demo →
                </a>
              </div>
            </ApiKeyCheck>
          </div>

          <FeaturesSection />
          <KeyFilesSection />
        </div>
      </main>
    </div>
  );
}
