"use client";

import { Send, Bot, User, AlertCircle } from "lucide-react";
import { useRef, useEffect, useState } from "react";

// Demo mode component when no API key is available
function DemoChat() {
    const [inputValue, setInputValue] = useState("");

    const demoMessages = [
        {
            id: "demo-1",
            role: "assistant",
            content: "Welcome! I can help you generate dashboard components like metrics, charts, and tables. Configure your Tambo API key to enable AI features.",
        },
    ];

    return (
        <div className="flex h-full flex-col rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-card-foreground">AI Assistant</h3>
                    <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
                        Demo Mode
                    </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    Configure API key to enable AI features
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    {demoMessages.map((message) => (
                        <div key={message.id} className="flex gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="rounded-lg bg-secondary px-4 py-2">
                                <p className="text-sm text-secondary-foreground">{message.content}</p>
                            </div>
                        </div>
                    ))}

                    <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 text-warning" />
                            <div>
                                <p className="text-sm font-medium text-foreground">API Key Required</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Add your Tambo API key to <code className="rounded bg-secondary px-1">.env.local</code>:
                                </p>
                                <code className="mt-2 block rounded bg-secondary p-2 text-xs">
                                    NEXT_PUBLIC_TAMBO_API_KEY=your_key_here
                                </code>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Get your key at{" "}
                                    <a
                                        href="https://tambo.co"
                                        className="text-primary hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        tambo.co
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <form className="border-t border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Configure API key to chat..."
                        className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        disabled
                    />
                    <button
                        type="button"
                        disabled
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/50 text-primary-foreground cursor-not-allowed"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}

// Live chat component when API key is available
function LiveChat() {
    const [hooks, setHooks] = useState<{
        useTamboThread: () => { thread: { messages: Array<{ id: string; role: string; content: unknown; renderedComponent?: React.ReactNode }> } };
        useTamboThreadInput: () => { value: string; setValue: (v: string) => void; submit: () => void; isPending: boolean };
    } | null>(null);

    useEffect(() => {
        import("@tambo-ai/react").then((module) => {
            setHooks({
                useTamboThread: module.useTamboThread,
                useTamboThreadInput: module.useTamboThreadInput,
            });
        });
    }, []);

    if (!hooks) {
        return <DemoChat />;
    }

    return <LiveChatInner hooks={hooks} />;
}

function LiveChatInner({ hooks }: {
    hooks: {
        useTamboThread: () => { thread: { messages: Array<{ id: string; role: string; content: unknown; renderedComponent?: React.ReactNode }> } };
        useTamboThreadInput: () => { value: string; setValue: (v: string) => void; submit: () => void; isPending: boolean };
    }
}) {
    const { thread } = hooks.useTamboThread();
    const { value, setValue, submit, isPending } = hooks.useTamboThreadInput();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [thread.messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim() && !isPending) {
            submit();
        }
    };

    return (
        <div className="flex h-full flex-col rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-card-foreground">AI Assistant</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    Ask me to generate metrics, charts, or data tables
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {thread.messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <Bot className="mb-4 h-12 w-12 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                            Start a conversation to generate dashboard components
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {[
                                "Show me revenue metrics",
                                "Create a sales chart",
                                "Display recent orders",
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => setValue(suggestion)}
                                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {thread.messages.map((message) => {
                            const isUser = message.role === "user";
                            const content = message.content;
                            return (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                                >
                                    {!isUser && (
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                                            <Bot className="h-4 w-4 text-primary" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] space-y-2 ${isUser ? "items-end" : "items-start"
                                            }`}
                                    >
                                        {Array.isArray(content) ? (
                                            content.map((part: { type?: string; text?: string }, i: number) =>
                                                part.type === "text" ? (
                                                    <div
                                                        key={i}
                                                        className={`rounded-lg px-4 py-2 ${isUser
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-secondary text-secondary-foreground"
                                                            }`}
                                                    >
                                                        <p className="text-sm">{part.text}</p>
                                                    </div>
                                                ) : null
                                            )
                                        ) : (
                                            <div
                                                className={`rounded-lg px-4 py-2 ${isUser
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-secondary text-secondary-foreground"
                                                    }`}
                                            >
                                                <p className="text-sm">{String(content)}</p>
                                            </div>
                                        )}
                                        {message.renderedComponent && (
                                            <div className="mt-2">{message.renderedComponent}</div>
                                        )}
                                    </div>
                                    {isUser && (
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                                            <User className="h-4 w-4 text-secondary-foreground" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <form
                onSubmit={handleSubmit}
                className="border-t border-border bg-muted/30 p-4"
            >
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Ask AI to generate components..."
                        className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        disabled={isPending}
                    />
                    <button
                        type="submit"
                        disabled={isPending || !value.trim()}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function TamboChat() {
    const [mounted, setMounted] = useState(false);
    const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <DemoChat />;
    }

    if (!apiKey) {
        return <DemoChat />;
    }

    return <LiveChat />;
}
