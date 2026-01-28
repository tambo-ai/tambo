import {
  TamboProvider,
  useTamboThread,
  useTamboThreadInput,
  useTamboVoice,
} from "@tambo-ai/react";
import { Mic, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { tools } from "../lib/tambo";
import { ProductGrid } from "./ProductGrid";

function Chat({ products, setProducts }: { products: any[]; setProducts: (p: any[]) => void }) {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { isRecording, startRecording, stopRecording, transcript } = useTamboVoice();

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
      const content = typeof lastToolMessage.content === 'string' 
        ? JSON.parse(lastToolMessage.content) 
        : lastToolMessage.content;
      
      let newProducts = null;

      if (content?.products && Array.isArray(content.products)) {
        newProducts = content.products;
      } else if (Array.isArray(content) && content.length > 0) {
        const firstBlock = content[0];
        
        if (firstBlock?.products && Array.isArray(firstBlock.products)) {
          newProducts = firstBlock.products;
        } else if (firstBlock?.type === 'text' && typeof firstBlock.text === 'string') {
          try {
             const parsedText = JSON.parse(firstBlock.text);
             if (parsedText?.products && Array.isArray(parsedText.products)) {
               newProducts = parsedText.products;
             }
          } catch {
             // Ignore parsing errors for non-JSON text
          }
        } else if (firstBlock?.result?.products && Array.isArray(firstBlock.result.products)) {
          newProducts = firstBlock.result.products;
        }
      } else if (content?.result?.products && Array.isArray(content.result.products)) {
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">TechnoStore AI</h1>
          <p className="text-gray-500">Voice-controlled inventory search</p>
        </header>

        <main className="flex-1 p-6 md:p-8">
           <ProductGrid products={products} />
        </main>
      </div>

      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-700 font-mono text-sm tracking-wide">Tambo AI</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {thread.messages.filter(m => m.role !== 'system' && m.role !== 'tool').map((m) => (
             <div key={m.id} className={`p-3 rounded-lg text-sm ${
               m.role === 'user' 
                 ? 'bg-blue-50 text-blue-900 ml-auto max-w-[90%]' 
                 : 'bg-gray-50 text-gray-600 mr-auto max-w-[90%]'
             }`}>
               <div className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${m.role === 'user' ? 'text-blue-400' : 'text-gray-400'}`}>
                 {m.role === 'user' ? 'User' : 'System'}
               </div>
               {m.content.map((c, i) => c.type === 'text' ? <p key={i}>{c.text}</p> : null)}
             </div>
          ))}
          {isPending && (
            <div className="bg-gray-50 text-gray-400 text-xs p-2 rounded-lg animate-pulse mr-auto">
              System processing...
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
           <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-3 focus-within:ring-1 focus-within:ring-gray-300 transition-all">
            <button
              className={`icon-btn w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                isRecording ? "bg-red-50 text-red-600 animate-pulse border border-red-100" : "text-gray-400 hover:bg-gray-200"
              }`}
              onClick={handleMicClick}
              title="Press to speak"
            >
              <Mic size={16} />
            </button>
            
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-700 placeholder-gray-400 outline-none font-mono"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={isRecording ? "Listening..." : "Command..."}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              disabled={isPending}
            />

            <button 
              className={`icon-btn w-8 h-8 flex items-center justify-center rounded-md transition-all ${
                value.trim() ? "bg-gray-900 text-white hover:bg-black" : "text-gray-300 cursor-not-allowed"
              }`}
              onClick={() => submit()}
              disabled={!value.trim() || isPending}
            >
              <Send size={14} />
            </button>
          </div>
          <div className="text-center mt-2">
             <p className="text-[10px] text-gray-300 font-mono">SYSTEM READY</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatInterface() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/search')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Failed to load initial products", err));
  }, []);

  return (
    <TamboProvider
      apiKey={import.meta.env.PUBLIC_TAMBO_API_KEY}
      tools={tools}
    >
      <Chat products={products} setProducts={setProducts} />
    </TamboProvider>
  );
}
