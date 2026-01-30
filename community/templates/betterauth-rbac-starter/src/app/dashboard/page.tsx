"use client";

import { AdminStats } from "@/components/tambo/AdminStats";
import { ErrorPopup } from "@/components/tambo/ErrorPopup";
import { UserCard } from "@/components/tambo/UserCard";
import { tamboComponents } from "@/lib/tools";
import { useTambo } from "@tambo-ai/react";
import {
  AlertCircle,
  ArrowDown,
  Bot,
  Mic,
  MicOff,
  Send,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface TamboContentPart {
  type: string;
  text?: string;
  toolName?: string;
  result?: Record<string, unknown>;
  name?: string;
  props?: Record<string, unknown>;
  content?: unknown;
}

interface TamboMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: TamboContentPart[];
  createdAt?: string | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: {
    new (): SpeechRecognition;
  };
  webkitSpeechRecognition?: {
    new (): SpeechRecognition;
  };
}

export default function DashboardPage() {
  const { thread, sendThreadMessage, streaming } = useTambo();
  const messages = useMemo(() => thread?.messages || [], [thread?.messages]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Ref to track if the user *wants* to be listening, to survive closure staleness in onend
  const shouldBeListeningRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  // Listen for suggestions click
  useEffect(() => {
    const handlePopulate = (e: CustomEvent) => {
      setInput(e.detail);
    };
    window.addEventListener("populateInput", handlePopulate as EventListener);
    return () =>
      window.removeEventListener(
        "populateInput",
        handlePopulate as EventListener,
      );
  }, []);

  useEffect(() => {
    const win = window as unknown as WindowWithSpeech;
    const SpeechRecognitionClass =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (typeof window !== "undefined") {
      if (!SpeechRecognitionClass) {
        // eslint-disable-next-line
        setIsSupported(false);
        setVoiceError("Browser not supported");
        return;
      }

      recognitionRef.current = new SpeechRecognitionClass();
      const recognition = recognitionRef.current;
      recognition.continuous = true; // Changed to true to keep listening
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        // Safety check for resultIndex
        const index =
          typeof event.resultIndex === "number" ? event.resultIndex : 0;

        for (let i = index; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          // We got a command!
          setInput(finalTranscript);
          setVoiceError(null);

          // Stop listening temporarily to process (optional, but good for UX)
          // actually let's keep listening if it's continuous mode?
          // User usually wants to speak one command then wait.
          // Let's stop to reset state and avoid echo.
          shouldBeListeningRef.current = false;
          setIsListening(false);
          recognition.stop();

          // Auto-send voice commands for "magic" UX
          setTimeout(async () => {
            try {
              await sendThreadMessage(finalTranscript);
              setInput("");
            } catch (err) {
              console.error("Voice send failed:", err);
            }
          }, 500);
        } else if (interimTranscript) {
          setInput(interimTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorType = event.error;

        // Strictly ignore no-speech
        if (errorType === "no-speech") {
          return;
        }

        // For other real errors, we stop.
        shouldBeListeningRef.current = false;
        setIsListening(false);

        if (errorType === "not-allowed") {
          setVoiceError("Microphone access denied");
        } else if (errorType === "network") {
          setVoiceError("Network error. Check connection.");
        } else {
          setVoiceError(`Voice Error: ${errorType}`);
        }
      };

      recognition.onend = () => {
        if (shouldBeListeningRef.current) {
          // Restart with a small delay to avoid browser thrashing
          setTimeout(() => {
            if (shouldBeListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch {
                // Error during restart, stop listening
                shouldBeListeningRef.current = false;
                setIsListening(false);
              }
            }
          }, 300);
        } else {
          setIsListening(false);
        }
      };
    }

    // Cleanup function to prevent memory leaks and zombie recognizers
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, [sendThreadMessage]);

  const toggleVoice = () => {
    if (!isSupported) {
      setVoiceError("Voice not supported in this browser");
      return;
    }

    setVoiceError(null);
    if (isListening) {
      shouldBeListeningRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      shouldBeListeningRef.current = true;
      setIsListening(true);
      try {
        recognitionRef.current?.start();
      } catch {
        setVoiceError("Could not start microphone");
        shouldBeListeningRef.current = false;
        setIsListening(false);
      }
    }
  };

  const handleSend = async () => {
    const message = input.trim();
    if (!message) return;
    try {
      setGlobalError(null);
      await sendThreadMessage(message);
      setInput("");
    } catch (err: unknown) {
      console.error("Failed to send message:", err);
      const error = err as { message?: string };
      const errorMsg = error.message?.toLowerCase() || "";
      // Detect common streaming or connectivity errors
      if (
        errorMsg.includes("streaming") ||
        errorMsg.includes("response") ||
        errorMsg.includes("network")
      ) {
        setGlobalError(
          "Network error detected. Please check your internet connection or API availability and try again.",
        );
      } else {
        setVoiceError("Failed to send message. Please try again.");
      }
    }
  };

  return (
    <div className="h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden dark">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950 pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-8 max-w-3xl mx-auto w-full scroll-smooth relative z-10"
      >
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center p-0.5 shadow-2xl rotate-3">
              <div className="w-full h-full bg-zinc-950 rounded-[22px] flex items-center justify-center text-white">
                <Sparkles size={32} className="text-indigo-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight">
                How can I assist you?
              </h2>
              <p className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">
                Use voice or text to explore system diagnostics, user profiles,
                or general assistance.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {["Check System Health", "Show My Profile"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    void handleSend();
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-zinc-300 hover:text-white transition-all active:scale-95"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="pt-8 opacity-20 flex flex-col items-center gap-2">
              <div className="w-px h-12 bg-gradient-to-b from-indigo-500 to-transparent" />
              <ArrowDown size={14} />
            </div>
          </div>
        )}

        {(messages || []).map((message: TamboMessage, messageIdx: number) => (
          <div
            key={message.id || `msg-${messageIdx}`}
            className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-lg ${
                message.role === "user"
                  ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                  : "bg-indigo-600 border-indigo-500 text-white"
              }`}
            >
              {message.role === "user" ? (
                <UserIcon size={14} />
              ) : (
                <Bot size={14} />
              )}
            </div>
            <div
              className={`max-w-[85%] space-y-2 ${message.role === "user" ? "text-right" : "text-left"}`}
            >
              <div
                className={`inline-block px-5 py-3.5 rounded-[22px] text-sm leading-relaxed font-sans shadow-xl ${
                  message.role === "user"
                    ? "text-white bg-white/5 hover:bg-white/10 transition-colors rounded-tr-none border border-white/10"
                    : "text-white bg-zinc-900/50 backdrop-blur-sm border border-white/5"
                }`}
              >
                {(Array.isArray(message.content)
                  ? (message.content as TamboContentPart[])
                  : []
                ).map((part, i) => {
                  if (part.type === "text") {
                    // 🛡️ HEURISTIC: Catch JSON Hallucinations (Crucial for this template's stability)
                    const text = part.text || "";
                    if (
                      text.includes("{") &&
                      text.includes("}") &&
                      (text.includes('"status"') || text.includes('"cpu"'))
                    ) {
                      try {
                        const jsonMatch = text.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                          const data = JSON.parse(jsonMatch[0]) as Record<
                            string,
                            unknown
                          >;
                          const status = (data.status || "") as string;
                          const innerData = (data.data || data) as {
                            cpu?: string;
                            disk?: string;
                            bandwidth?: string;
                            uptime?: string;
                          };
                          const cpu = innerData.cpu;
                          const messageVal = (data.message || "") as string;

                          if (
                            status === "optimal" ||
                            status === "warning" ||
                            status === "critical" ||
                            status === "denied" ||
                            cpu
                          ) {
                            return (
                              <div
                                key={`heuristic-stats-${i}`}
                                className="mt-4 pt-4 border-t border-white/5 w-full"
                              >
                                <AdminStats
                                  data={innerData}
                                  status={
                                    status as
                                      | "optimal"
                                      | "warning"
                                      | "critical"
                                      | "denied"
                                  }
                                  message={messageVal}
                                />
                              </div>
                            );
                          } else if (status === "active") {
                            return (
                              <div
                                key={`heuristic-user-${i}`}
                                className="mt-4 pt-4 border-t border-white/5 w-full"
                              >
                                <UserCard />
                              </div>
                            );
                          }
                        }
                      } catch (e) {
                        console.warn("Failed to parse heuristic JSON:", e);
                      }
                    }
                    return (
                      <p key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    );
                  }

                  // Handle Tool Results
                  if (
                    part.type === "tool-result" ||
                    part.type === "tool_result"
                  ) {
                    const toolName = part.toolName || part.name;
                    const rawResult = part.result || part.content;
                    const result =
                      typeof rawResult === "object" && !Array.isArray(rawResult)
                        ? rawResult
                        : null;
                    const componentConfig = tamboComponents.find(
                      (c) => c.name === toolName,
                    );

                    if (componentConfig && result) {
                      const Component = componentConfig.component;
                      return (
                        <div
                          key={i}
                          className="mt-4 pt-4 border-t border-white/10 w-full flex justify-center"
                        >
                          <Component {...result} />
                        </div>
                      );
                    }

                    // Fallback
                    if (rawResult) {
                      return (
                        <div
                          key={i}
                          className="mt-2 p-3 bg-white/5 rounded-xl border border-white/5 font-mono text-xs overflow-auto max-h-[200px]"
                        >
                          <pre>{JSON.stringify(rawResult, null, 2)}</pre>
                        </div>
                      );
                    }
                  }

                  // Handle Components
                  if (part.type === "component" && part.name) {
                    const componentConfig = tamboComponents.find(
                      (c) => c.name === part.name,
                    );
                    if (componentConfig) {
                      const Component = componentConfig.component;
                      return (
                        <div
                          key={i}
                          className="mt-4 pt-4 border-t border-white/10 w-full flex justify-center"
                        >
                          <Component {...(part.props || {})} />
                        </div>
                      );
                    }
                  }

                  return null;
                })}
              </div>
              <div
                className="text-[10px] text-muted-foreground uppercase tracking-wider px-1"
                suppressHydrationWarning
              >
                {message.createdAt && !isNaN(Date.parse(message.createdAt))
                  ? new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Syncing..."}
              </div>
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot size={14} className="text-primary" />
            </div>
            <div className="bg-muted w-16 h-8 rounded-full" />
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-10 bg-zinc-950/80 backdrop-blur-xl border-t border-white/10 shrink-0 relative z-20">
        <div className="max-w-3xl mx-auto">
          {/* Visual Error Feedback */}
          {globalError && (
            <ErrorPopup
              message={globalError}
              onClose={() => setGlobalError(null)}
            />
          )}
          {voiceError && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 bg-red-900/80 border border-red-500/30 text-red-200 text-xs rounded-full flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle size={12} />
              {voiceError}
            </div>
          )}

          <div className="flex gap-2 items-center bg-white/5 border border-white/10 p-2 rounded-full focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-200">
            <button
              onClick={toggleVoice}
              disabled={!isSupported}
              className={`p-2.5 rounded-full transition-all duration-200 ${
                isSupported
                  ? isListening
                    ? "bg-red-500/20 text-red-500 animate-pulse ring-1 ring-red-500/50"
                    : "text-muted-foreground hover:bg-white/10 hover:text-white"
                  : "opacity-30 cursor-not-allowed text-zinc-600"
              }`}
              title={
                !isSupported
                  ? "Voice not supported in this browser"
                  : isListening
                    ? "Stop Listening"
                    : "Start Voice"
              }
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSend()}
              placeholder={isListening ? "Listening..." : "Message agent..."}
              className="flex-1 bg-transparent text-white px-2 py-2 focus:outline-none placeholder:text-zinc-500 text-sm"
            />

            <button
              onClick={() => void handleSend()}
              disabled={!input.trim()}
              className="bg-white text-black p-2.5 rounded-full hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="mt-3 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
              Powered by Tambo V3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
