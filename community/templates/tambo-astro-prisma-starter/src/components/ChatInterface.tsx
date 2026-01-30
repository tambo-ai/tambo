import {
  TamboProvider,
  useTamboThread,
  useTamboThreadInput,
  useTamboVoice,
} from "@tambo-ai/react";
import { Mic, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { tools } from "../lib/tambo";
import { ProductGrid, type Product } from "./ProductGrid";

function Chat({
  products,
  setProducts,
}: {
  products: Product[];
  setProducts: (p: Product[]) => void;
}) {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { isRecording, startRecording, stopRecording, transcript } =
    useTamboVoice();

  useEffect(() => {
    if (transcript) {
      setValue(transcript);
    }
  }, [transcript, setValue]);

  useEffect(() => {
    if (!thread?.messages) return;

    const lastToolMessage = thread.messages
      .slice()
      .reverse()
      .find((m) => m.role === "tool");

    if (!lastToolMessage) return;

    try {
      const content =
        typeof lastToolMessage.content === "string"
          ? JSON.parse(lastToolMessage.content)
          : lastToolMessage.content;

      let newProducts = null;

      if (content?.products && Array.isArray(content.products)) {
        newProducts = content.products;
      } else if (Array.isArray(content) && content.length > 0) {
        const firstBlock = content[0];

        if (firstBlock?.products && Array.isArray(firstBlock.products)) {
          newProducts = firstBlock.products;
        } else if (
          firstBlock?.type === "text" &&
          typeof firstBlock.text === "string"
        ) {
          try {
            const parsedText = JSON.parse(firstBlock.text);
            if (parsedText?.products && Array.isArray(parsedText.products)) {
              newProducts = parsedText.products;
            }
          } catch {
            // Ignore parsing errors for non-JSON text
          }
        } else if (
          firstBlock?.result?.products &&
          Array.isArray(firstBlock.result.products)
        ) {
          newProducts = firstBlock.result.products;
        }
      } else if (
        content?.result?.products &&
        Array.isArray(content.result.products)
      ) {
        newProducts = content.result.products;
      }

      if (newProducts) {
        setProducts(newProducts);
      }
    } catch (e) {
      console.error("Error parsing tool result", e);
    }
  }, [thread?.messages, setProducts]);

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="p-8 border-b border-gray-100 bg-white">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            TechnoStore AI
          </h1>
          <p className="text-gray-500">Voice-controlled inventory search</p>
        </header>

        <main className="flex-1 p-6 md:p-8">
          <ProductGrid products={products} />
        </main>
      </div>

      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-700 font-mono text-sm tracking-wide">
            Tambo AI
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {thread.messages
            .filter((m) => m.role !== "system" && m.role !== "tool")
            .map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isUser
                        ? "bg-gray-200 text-gray-600"
                        : "bg-black text-white"
                    }`}
                  >
                    {isUser ? (
                      <span className="text-xs font-bold">U</span>
                    ) : (
                      <span className="text-xs font-bold">AI</span>
                    )}
                  </div>

                  <div
                    className={`flex flex-col max-w-[85%] ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`
                    py-2 px-3 rounded-2xl text-[14px] leading-relaxed shadow-sm
                    ${
                      isUser
                        ? "bg-gray-100 text-gray-900 rounded-tr-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                    }
                  `}
                    >
                      {Array.isArray(m.content) &&
                        m.content.map((c, i) => {
                          if (c.type === "text") {
                            return (
                              <p key={i} className="whitespace-pre-wrap">
                                {c.text}
                              </p>
                            );
                          }
                          return null;
                        })}
                      {/* Render Interactive Components (Streaming) */}
                      {m.renderedComponent}
                    </div>
                    {/* Timestamp/Label */}
                    <span className="text-[10px] text-gray-300 mt-1 uppercase tracking-wider font-mono">
                      {m.role}
                    </span>
                  </div>
                </div>
              );
            })}

          {/* Typing Indicator / Pending State */}
          {isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-gray-500">AI</span>
              </div>
              <div className="flex flex-col items-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm py-3 px-4 shadow-sm">
                  <div className="flex space-x-1 h-3 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all shadow-sm">
            <button
              className={`icon-btn w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                isRecording
                  ? "bg-red-50 text-red-500 animate-pulse"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
              onClick={handleMicClick}
              title="Press to speak"
            >
              <Mic size={18} />
            </button>

            <input
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-700 placeholder-gray-400 outline-none font-sans"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={isRecording ? "Listening..." : "Type a command..."}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              disabled={isPending}
            />

            <button
              className={`icon-btn w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                value.trim()
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              onClick={() => submit()}
              disabled={!value.trim() || isPending}
            >
              <Send size={14} />
            </button>
          </div>
          <div className="text-center mt-3">
            <p className="text-[10px] text-gray-400 font-medium tracking-wide">
              AI FLIGHT CONTROL ACTIVE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatInterface() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/search")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Failed to load initial products", err));
  }, []);

  return (
    <TamboProvider apiKey={import.meta.env.PUBLIC_TAMBO_API_KEY} tools={tools}>
      <Chat products={products} setProducts={setProducts} />
    </TamboProvider>
  );
}
