"use client";

import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";

export function TamboChat() {
    const { thread } = useTamboThread();
    const { value, setValue, submit, isPending } = useTamboThreadInput();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim() && !isPending) {
            submit();
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {thread.messages.length === 0 ? (
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                            Welcome to Tambo Notes
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Try saying things like:
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    setValue("Save a note: I need to buy groceries tomorrow");
                                    setTimeout(() => submit(), 100);
                                }}
                                className="block w-full max-w-md mx-auto px-4 py-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <span className="text-gray-700 dark:text-gray-300">
                                    &ldquo;Save a note: I need to buy groceries tomorrow&rdquo;
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    setValue("Show me all my notes");
                                    setTimeout(() => submit(), 100);
                                }}
                                className="block w-full max-w-md mx-auto px-4 py-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <span className="text-gray-700 dark:text-gray-300">
                                    &ldquo;Show me all my notes&rdquo;
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    setValue("Save a note: Remember to call mom on Sunday");
                                    setTimeout(() => submit(), 100);
                                }}
                                className="block w-full max-w-md mx-auto px-4 py-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <span className="text-gray-700 dark:text-gray-300">
                                    &ldquo;Save a note: Remember to call mom on Sunday&rdquo;
                                </span>
                            </button>
                        </div>
                    </div>
                ) : (
                    thread.messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-5 py-3 ${message.role === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    }`}
                            >
                                {Array.isArray(message.content) ? (
                                    <div className="space-y-2">
                                        {message.content.map((part, i) =>
                                            part.type === "text" ? (
                                                <p key={i} className="whitespace-pre-wrap">
                                                    {part.text}
                                                </p>
                                            ) : null,
                                        )}
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{String(message.content)}</p>
                                )}
                                {message.renderedComponent && (
                                    <div className="mt-3">{message.renderedComponent}</div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {isPending && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-gray-100 dark:bg-gray-800">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                                <div
                                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.1s" }}
                                />
                                <div
                                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.2s" }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="Ask me to save a note, show your notes, or delete a note..."
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            disabled={isPending}
                        />
                        <button
                            type="submit"
                            disabled={isPending || !value.trim()}
                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
