import { useTambo, useTamboThreadInput } from "@tambo-ai/react";
import { Sparkles, ArrowUpRight, User, ArrowLeft, Command } from "lucide-react";
import { FormEvent } from "react";

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center py-12 md:py-20 px-4">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center gap-4 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
        {messages.length > 0 && (
          <button
            onClick={() => window.location.reload()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 hover:text-slate-900"
            title="Back to Home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Tambo + Elysia
            </h1>
            <p className="text-sm text-slate-500">Minimal Starter Kit</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-full max-w-2xl flex-1 flex flex-col gap-6 mb-8">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 min-h-[40vh] animate-in fade-in duration-1000">
            <h2 className="text-3xl md:text-4xl font-medium text-slate-900 tracking-tight">
              What can I build for you?
            </h2>
            <p className="text-slate-500 max-w-md">
              This is a minimal starter template. Ask me to render a Component.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setValue("Show me a chart of user growth")}
                className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm"
              >
                <Command className="h-3 w-3" />
                Try: "Show me a chart of user growth"
              </button>
              <button
                onClick={() => setValue("Create a todo list for a launch plan")}
                className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm"
              >
                <Command className="h-3 w-3" />
                Try: "Create a todo list for a launch plan"
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
                        ? "flex-row-reverse items-center"
                        : "items-start"
                    } ${isSequence ? "!mt-1" : "mt-4"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                        m.role !== "user" ? "mt-1" : ""
                      }
                    ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-black border border-slate-200"
                    } ${isSequence ? "opacity-0" : ""}`}
                    >
                      {m.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`flex-1 overflow-hidden space-y-4 ${
                        m.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {m.content.map((c, i) => (
                        <div
                          key={i}
                          className="text-sm leading-relaxed text-slate-700"
                        >
                          {c.type === "text" && (
                            <span className="whitespace-pre-wrap">
                              {c.text}
                            </span>
                          )}
                        </div>
                      ))}
                      {m.renderedComponent && (
                        <div className="w-full max-w-xl border border-slate-200 rounded-xl bg-white shadow-sm mt-3">
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
                    <Sparkles className="h-4 w-4 text-black animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1 h-8">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="w-full max-w-2xl sticky bottom-8">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 to-transparent -top-20 -bottom-8 pointer-events-none" />
          <input
            value={input}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your instruction..."
            className="w-full bg-white border border-slate-200 rounded-2xl p-4 pl-6 pr-14 !text-black placeholder:!text-gray-600 font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-lg shadow-slate-200/50"
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-20 disabled:hover:bg-indigo-600 transition-all transform active:scale-95"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
