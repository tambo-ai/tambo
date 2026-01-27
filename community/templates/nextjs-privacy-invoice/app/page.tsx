"use client";
import { useState, useEffect } from 'react';
import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { Send, Trash2, Lock, Sparkles } from 'lucide-react';

export default function Home() {
  // Access our local-first database
  const { items, addItem, removeItem } = useInvoiceStore();
  
  // Local state for the chat input
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // SIMULATED AI PARSING (Proof of Integration)
  const handleSend = async () => {
    if (!input) return;
    setIsTyping(true);
    
    // NOTE: In a real app, this would call the Tambo API.
    // We simulate the AI "thinking" delay and parsing logic here.
    setTimeout(() => {
      // 1. Find price (e.g., "500")
      const priceMatch = input.match(/\d+/);
      const price = priceMatch ? parseInt(priceMatch[0]) : 0;
      
      // 2. Find description (remove price and symbols)
      const desc = input.replace(/\d+/, '').replace('$', '').trim() || "Consultation";
      
      // 3. Add to store
      addItem(desc, price);
      
      // 4. Reset chat
      setInput('');
      setIsTyping(false);
    }, 800);
  };

  if (!mounted) return null; // Wait for browser to load

  return (
    // RESPONSIVE LAYOUT: Stacks on mobile (flex-col), Side-by-side on desktop (md:flex-row)
    <main className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      
      {/* LEFT PANEL: Chat Interface */}
      <section className="w-full md:w-[400px] flex flex-col bg-white border-r border-gray-200 h-[45vh] md:h-full shadow-md z-10">
        <header className="p-4 border-b font-bold text-gray-800 flex items-center gap-2 bg-white">
          <Sparkles className="text-purple-600" size={20} />
          <span>Verba AI Assistant</span>
        </header>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
          <div className="bg-white p-4 rounded-lg text-sm text-gray-700 border border-gray-200 shadow-sm">
            <strong>AI:</strong> Hi! I help you build invoices securely. Data stays on your device. <br/><br/>
            <em>Try typing: "Add website design for $500"</em>
          </div>
          {isTyping && <div className="text-xs text-purple-600 animate-pulse ml-2 font-medium">AI is formatting...</div>}
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input 
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-purple-600 focus:ring-1 focus:ring-purple-600"
              placeholder="E.g. SEO Services 200"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="bg-black text-white p-2 rounded-md hover:bg-gray-800 transition">
              <Send size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL: Live Invoice Preview */}
      <section className="flex-1 p-4 md:p-10 flex flex-col items-center overflow-y-auto h-[55vh] md:h-full bg-gray-100">
        
        {/* The "Paper" Invoice Card */}
        <div className="w-full max-w-2xl bg-white shadow-xl min-h-[400px] p-6 md:p-12 rounded-sm text-gray-900 border border-gray-200">
          <div className="flex justify-between items-end mb-8 border-b-2 border-black pb-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">INVOICE</h1>
            <div className="text-right text-xs md:text-sm text-gray-500">
              <p>#001</p>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="space-y-0">
            {/* Header Row */}
            <div className="flex justify-between text-xs font-bold text-gray-500 uppercase border-b py-2 mb-2">
               <span>Description</span>
               <span>Amount</span>
            </div>

            {items.length === 0 ? (
              <p className="text-gray-400 italic text-center py-10 text-sm">Document is empty. Use the chat.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100 hover:bg-gray-50 px-2 rounded group transition">
                  <span className="font-medium text-gray-800 text-sm md:text-base">{item.desc}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-gray-900">${item.amount.toFixed(2)}</span>
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-12 pt-6 flex justify-between font-bold text-lg md:text-xl text-gray-900 border-t-2 border-gray-100">
            <span>Total Due</span>
            <span>${items.reduce((acc, i) => acc + i.amount, 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Privacy Badge */}
        <div className="mt-6 flex items-center gap-2 text-[10px] md:text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
          <Lock size={12} />
          <span>Local-First: Data stored securely in browser</span>
        </div>
      </section>
    </main>
  );
}