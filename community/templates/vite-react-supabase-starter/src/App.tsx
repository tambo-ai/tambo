import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import ComponentsCanvas from "@/components/ui/components-canvas";
import { components, tools } from "@/lib/tambo";
import { useSupabaseNotes } from "@/lib/use-supabase-notes";
import { TamboProvider } from "@tambo-ai/react";
import { MessageSquare, Layout } from "lucide-react";
import { useState } from "react";

function App() {
  const mcpServers = useMcpServers();
  useSupabaseNotes();

  const [mobileView, setMobileView] = useState<"chat" | "canvas">("chat");

  return (
    <TamboProvider
      apiKey={import.meta.env.VITE_TAMBO_KEY}
      components={components}
      tools={tools}
      tamboUrl={import.meta.env.VITE_TAMBO_URL}
      mcpServers={mcpServers}
    >
      <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-white dark:bg-gray-900">
        <div className="md:hidden flex items-center justify-center gap-4 p-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setMobileView("chat")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mobileView === "chat"
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>
          <button
            onClick={() => setMobileView("canvas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mobileView === "canvas"
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
          >
            <Layout className="h-4 w-4" />
            Canvas
          </button>
        </div>

        <div
          className={`flex-1 overflow-hidden border-r border-gray-200 dark:border-gray-700 ${mobileView === "chat" ? "flex flex-col" : "hidden"
            } md:flex md:flex-col`}
        >
          <MessageThreadFull />
        </div>

        <div
          className={`flex-1 md:w-[55%] md:flex-none overflow-hidden ${mobileView === "canvas" ? "flex flex-col" : "hidden"
            } md:flex md:flex-col`}
        >
          <ComponentsCanvas className="flex-1" />
        </div>
      </div>
    </TamboProvider>
  );
}

export default App;
