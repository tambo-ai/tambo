import { useTambo, useTamboThreadInput } from "@tambo-ai/react";
import {
  User,
  Sparkles,
  Layout,
  FileText,
  Bell,
  ArrowUpRight,
  BarChart3,
  Database,
  Zap,
  CheckSquare,
  CreditCard,
  Plus,
  Table,
} from "lucide-react";
import { FormEvent } from "react";

function App() {
  const { thread, isIdle, startNewThread } = useTambo();
  const { value: input, setValue, submit } = useTamboThreadInput();

  const messages = thread?.messages || [];
  const isLoading = !isIdle;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    submit();
    setValue("");
  };

  const handleSuggestionClick = (text: string) => {
    setValue(text);
  };

  const handleDashboardClick = () => {
    startNewThread();
  };

  const availableComponents = [
    {
      name: "Chart",
      desc: "Visual data graph",
      icon: <BarChart3 className="h-3.5 w-3.5" />,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      name: "DataTable",
      desc: "Excel-style data",
      icon: <Table className="h-3.5 w-3.5" />,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      name: "Pricing",
      desc: "Plan tables",
      icon: <CreditCard className="h-3.5 w-3.5" />,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      name: "TaskList",
      desc: "Managed items",
      icon: <CheckSquare className="h-3.5 w-3.5" />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  const suggestions = [
    {
      icon: <Database className="h-4 w-4" />,
      text: "Q3 Financial Report",
      prompt:
        "Generate a comprehensive financial report for a hypothetical SaaS company 'CloudScale' for Q3 2023. 1. Create a detailed table with columns: 'Month', 'New MRR', 'Churn Rate (%)', and 'Active Customers'. Use realistic numbers for July, August, and September. 2. Generate a bar chart showing the 'New MRR' growth trend over these months.",
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      text: "Market Share Analysis",
      prompt:
        "Analyze the global EV market for 2023. Show a table of the top 5 manufacturers by sales volume and market share. Then, visualize the market share in a chart. Include a recommendation for a 'pro' analytics subscription.",
    },
    {
      icon: <CreditCard className="h-4 w-4" />,
      text: "Compare Pricing Plans",
      prompt:
        "Show me a comparison of three pricing plans for a developer platform: Basic, Pro, and Enterprise. Highlight the Pro plan with features like SSO and priority support.",
    },
    {
      icon: <Zap className="h-4 w-4" />,
      text: "System Health & Alerts",
      prompt:
        "Identify potential system bottlenecks. Show a table of current server load across regions and highlight any that are over 80%. Use a chart to show latency trends.",
    },
  ];

  return (
    <div className="flex h-screen bg-[#fafafa] text-slate-900 font-sans">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-[#0d0d0d] text-white p-6 justify-between border-r border-white/5">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-base tracking-tight text-white/90">
                ChatBot
              </span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="px-2">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4 font-bold">
                Main
              </h3>
              <div className="space-y-1">
                <button
                  onClick={handleDashboardClick}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 text-white text-sm transition-colors hover:bg-white/10"
                >
                  <Layout className="h-4 w-4 text-white/60" />
                  <span className="font-medium text-white/90">Dashboard</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-colors group">
                  <FileText className="h-4 w-4 text-white/30 group-hover:text-white/60" />
                  <span className="font-medium">Projects</span>
                </button>
              </div>
            </div>

            <div className="px-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
                  Library
                </h3>
                <Plus className="h-3 w-3 text-white/20 hover:text-white/50 cursor-pointer" />
              </div>
              <div className="space-y-1">
                {availableComponents.map((comp) => (
                  <div
                    key={comp.name}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-all cursor-pointer group"
                  >
                    <div
                      className={`p-1 rounded bg-white/5 ${comp.color} group-hover:bg-white/10`}
                    >
                      {comp.icon}
                    </div>
                    <span className="font-medium">{comp.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-2">
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-3 py-2 text-white/30">
              <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
              <span className="text-[10px] font-medium tracking-wider uppercase">
                System Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafafa]">
        {messages.length === 0 ? (
          // Empty State (ChatBot Layout)
          <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-5xl mx-auto w-full">
            <div className="flex-1 flex flex-col justify-center w-full max-w-2xl px-4">
              <h1 className="text-4xl md:text-5xl font-medium text-slate-900 mb-3 tracking-tight">
                Hi, VK
              </h1>
              <h2 className="text-4xl md:text-5xl font-medium text-slate-400 mb-12 tracking-tight">
                What can I help you with?
              </h2>

              {/* Input Box (Visual for empty state, functional) */}
              <form onSubmit={handleSubmit} className="relative mb-12">
                <div className="relative flex items-center">
                  <input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Message ChatBot..."
                    className="w-full bg-white border border-slate-200/60 rounded-2xl p-5 pl-6 pr-14 text-base outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all placeholder:text-slate-400 shadow-sm h-16"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-2.5 rounded-xl transition-all hover:bg-slate-800 disabled:opacity-20 disabled:bg-slate-400"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </button>
                </div>
              </form>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.slice(0, 4).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s.prompt)}
                    className="flex items-center justify-between p-4 border border-slate-200/50 rounded-xl hover:bg-white hover:border-slate-300/60 hover:shadow-sm transition-all text-left bg-transparent group"
                  >
                    <span className="text-sm text-slate-600 font-medium line-clamp-1">
                      {s.text}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8 flex gap-6 text-[10px] font-medium uppercase tracking-widest text-slate-300">
              <span className="hover:text-slate-400 cursor-pointer transition-colors">
                Privacy
              </span>
              <span className="hover:text-slate-400 cursor-pointer transition-colors">
                Terms
              </span>
              <span className="hover:text-slate-400 cursor-pointer transition-colors">
                Support
              </span>
            </div>
          </div>
        ) : (
          // Chat Interface
          <div className="flex flex-col h-full font-sans">
            {/* Header for Chat Mode (Optional, maybe breadcrumbs or simple title) */}
            <div className="h-14 border-b border-slate-200/40 flex items-center px-6 justify-between flex-shrink-0 bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Chat
                </span>
                <span className="text-xs text-slate-200">/</span>
                <span className="text-xs font-semibold text-slate-900 uppercase tracking-widest">
                  New Session
                </span>
              </div>
              <div className="flex gap-4 text-slate-400">
                <Bell className="h-4 w-4 hover:text-slate-600 cursor-pointer transition-colors" />
                <Layout className="h-4 w-4 hover:text-slate-600 cursor-pointer transition-colors" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-6 scroll-smooth">
              {messages.map((m, index) => {
                // Find previous visual message to check for consecutive roles
                let prevVisualMessage = null;
                for (let i = index - 1; i >= 0; i--) {
                  const msg = messages[i];
                  const hasContent =
                    msg.content.some(
                      (c) => c.type === "text" && c.text?.trim(),
                    ) || msg.renderedComponent;
                  if (hasContent) {
                    prevVisualMessage = msg;
                    break;
                  }
                }

                const isConsecutive = prevVisualMessage?.role === m.role;
                const hasVisualContent =
                  m.content.some((c) => c.type === "text" && c.text?.trim()) ||
                  m.renderedComponent;

                if (!hasVisualContent) return null;

                return (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-3 duration-500 ${isConsecutive ? "mt-[-1.5rem]" : ""}`}
                  >
                    <div
                      className={`flex gap-6 max-w-3xl w-full ${m.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`
                              w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1
                              ${m.role === "user" ? "bg-slate-900" : "bg-white border border-slate-200 shadow-sm"}
                              ${isConsecutive ? "opacity-0 invisible" : ""}
                              `}
                      >
                        {m.role === "user" ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-slate-900" />
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        {!isConsecutive && (
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            {m.role === "user" ? "You" : "ChatBot"}
                          </div>
                        )}
                        <div
                          className={`
                               text-[15px] leading-relaxed
                               ${
                                 m.role === "user"
                                   ? "text-slate-800"
                                   : "text-slate-900 font-medium"
                               }
                             `}
                        >
                          {m.content.map((part, i) => {
                            if (part.type === "text") {
                              return (
                                <div key={i} className="whitespace-pre-wrap">
                                  {part.text}
                                </div>
                              );
                            }
                            return null;
                          })}
                          {m.renderedComponent && (
                            <div className="mt-6 w-fit max-w-full overflow-visible">
                              {m.renderedComponent}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-[#ccff00] fill-[#ccff00]" />
                    </div>
                    <div className="flex items-center gap-1 h-8">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area (Chat Mode) */}
            <div className="p-8 bg-[#fafafa]">
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="relative group">
                    <input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Type a message..."
                      className="w-full bg-white border border-slate-200/60 rounded-2xl p-5 pl-6 pr-14 text-sm outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all shadow-sm placeholder:text-slate-400"
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <button
                        type="submit"
                        disabled={isLoading || !input}
                        className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-20 disabled:bg-slate-400 transition-all shadow-sm"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </form>
                <div className="text-center mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                  ChatBot Engine v1.0
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
