import { useState } from 'react'
import { TamboProvider, useTambo, useTamboThreadInput } from '@tambo-ai/react'
import { Calendar, Send } from 'lucide-react'

import { components, tools } from './components/tambo'
import './index.css'

// Utility for conditional classes (inline)
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

function Chat() {
  const { thread } = useTambo()
  const { value, setValue, submit } = useTamboThreadInput()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setIsLoading(true)
    await submit()
    setIsLoading(false)
  }

  if (!thread) return <div>No thread available</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Calendar size={24} className="text-white drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
              Tambo React Starter
            </h1>
            <p className="text-sm text-slate-500 font-medium">Generative UI Template</p>
          </div>
        </div>
      </header>

      {/* Chat Content */}
      <main className="max-w-2xl mx-auto px-6 pb-24 pt-4 md:px-8">
        {/* Welcome */}
        {thread.messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Calendar size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Welcome</h2>
            <p className="text-lg text-slate-600 max-w-md mx-auto mb-8">
              This template demonstrates AI-driven component rendering. Try a prompt below.
            </p>
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all cursor-pointer max-w-sm mx-auto"
              onClick={() => { setValue("Generate a timeline component with 3 example items"); }}
            >
              Try: Generate a timeline component
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4 mb-8">
          {thread.messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            const textContent = typeof msg.content === "string"
              ? msg.content
              : Array.isArray(msg.content) && msg.content.map ? msg.content.map((c: { text?: string }) => c.text ?? "").join("") : ""

            return (
              <div
                key={i}
                className={cn(
                  "group flex gap-4 p-5 rounded-2xl shadow-md transition-all",
                  "max-w-[90%] md:max-w-[85%]",
                  isUser
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 ml-auto"
                    : "bg-white border border-gray-200"
                )}
              >
                <div className={cn(
                  "flex-1 text-sm leading-relaxed",
                  isUser
                    ? "text-white font-medium"
                    : "text-gray-700 whitespace-pre-wrap"
                )}>
                  <p className={isUser ? "text-white" : "text-gray-800"}>
                    {textContent}
                  </p>
                  {msg.renderedComponent && (
                    <div className={cn(
                      "mt-4 pt-4 border-t",
                      isUser ? "border-white/20" : "border-gray-100"
                    )}>
                      {msg.renderedComponent}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* INPUT FORM - Glassmorphism */}
      <form onSubmit={handleSubmit} className="fixed bottom-0 left-0 right-0 backdrop-blur-md bg-white/80 border-t border-gray-100 z-40">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <div className="flex gap-3 items-center">
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Plan Q1 sync, summarize notes, create agenda..."
              className="flex-1 bg-white/60 border border-gray-200 hover:border-gray-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl px-5 py-3.5 text-base placeholder-gray-400 transition-all backdrop-blur-sm shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!value?.trim() || isLoading}
              className="w-12 h-12 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:shadow-none disabled:cursor-not-allowed flex-shrink-0"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Send size={20} className="-rotate-45" />
              )}
            </button>
          </div>
          {!import.meta.env.VITE_TAMBO_API_KEY && (
            <p className="text-center text-sm text-orange-600 mt-3 font-medium">
              🔑 Add your Tambo API key to .env to enable AI features
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

export default function App() {
  const apiKey = import.meta.env.VITE_TAMBO_API_KEY

  return (
    <TamboProvider
      apiKey={apiKey}
      components={components}
      tools={tools}
    >
      <Chat />
    </TamboProvider>
  )
}
