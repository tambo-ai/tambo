import { useTambo, useTamboThreadInput } from "@tambo-ai/react";
import {
  Sparkles,
  ArrowUpRight,
  User,
  ArrowLeft,
  Command,
  Mic,
} from "lucide-react";
import { FormEvent, Suspense } from "react";
import DictationButton from "./components/DictationButton";

function App() {
  const { thread, isIdle } = useTambo();
  const { value: input, setValue, submit } = useTamboThreadInput();

  const messages = thread?.messages || [];
  const isLoading = !isIdle;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    submit();
    setValue("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900 font-sans flex flex-col items-center py-6 md:py-12 px-4">
      {/* Header */}
      <div className="w-full max-w-3xl flex items-center gap-4 mb-12 md:mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
        {messages.length > 0 && (
          <button
            onClick={() => window.location.reload()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
            title="Back to Home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center border border-indigo-400/20 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Tambo + Elysia.js
            </h1>
            <p className="text-xs text-slate-500">
              Full-stack starter with voice & components
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-full max-w-3xl flex-1 flex flex-col gap-6 mb-8">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 min-h-[50vh] animate-in fade-in duration-1000">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                What can I build for you?
              </h2>
              <p className="text-slate-500 text-base max-w-md mx-auto">
                Ask me to create interactive components, visualize data, or
                manage tasks. Use your voice for hands-free input.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setValue("Show me a chart of user growth")}
                className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Command className="h-4 w-4" />
                Show me a chart
              </button>
              <button
                onClick={() => setValue("Create a todo list for a launch plan")}
                className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Command className="h-4 w-4" />
                Create a todo list
              </button>
              <button
                onClick={() => setValue("Use my voice to give a command")}
                className="px-4 py-2.5 rounded-lg border border-indigo-200 bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Mic className="h-4 w-4" />
                Try voice input
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-4">
            {messages
              .filter((m) => m.role === "user" || m.role === "assistant")
              .map((m, i, arr) => {
                const isSequence = i > 0 && arr[i - 1].role === m.role;
                return (
                  <div
                    key={m.id}
                    className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                      m.role === "user"
                        ? "flex-row-reverse items-start"
                        : "items-start"
                    } ${isSequence ? "!mt-1" : "mt-4"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                        m.role !== "user" ? "mt-1" : ""
                      }
                    ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                        : "bg-white text-slate-900 border border-slate-200"
                    } ${isSequence ? "opacity-0" : ""}`}
                    >
                      {m.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`flex-1 overflow-hidden space-y-3 max-w-2xl ${
                        m.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {m.content.map((c, i) => (
                        <div
                          key={i}
                          className={`text-sm leading-relaxed ${
                            m.role === "user"
                              ? "text-slate-700 font-medium"
                              : "text-slate-600"
                          }`}
                        >
                          {c.type === "text" && (
                            <span className="whitespace-pre-wrap">
                              {c.text}
                            </span>
                          )}
                        </div>
                      ))}
                      {m.renderedComponent && (
                        <div className="w-full border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow p-4">
                          {m.renderedComponent}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            {isLoading &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-4 animate-in fade-in mt-4">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                    <Sparkles className="h-4 w-4 text-slate-700 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1 h-8">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="w-full max-w-3xl sticky bottom-6 md:bottom-8">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg shadow-slate-100 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
            <input
              value={input}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type or use voice input..."
              className="flex-1 text-slate-900 placeholder:text-slate-600 font-medium outline-none bg-transparent text-base"
              style={{ color: "rgb(15 23 42)" }}
              autoFocus
            />
            <div className="flex items-center gap-1">
              <Suspense fallback={null}>
                <DictationButton />
              </Suspense>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 transition-all transform active:scale-95"
              >
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
