"use client";

import { Lightbulb, Shield, User } from "lucide-react";

interface SuggestionsPanelProps {
    role: "admin" | "user";
}

export function SuggestionsPanel({ role }: SuggestionsPanelProps) {
    const suggestions = role === "admin"
        ? [
            { id: 1, text: "I need a complete system health report.", icon: <Shield size={14} /> },
            { id: 2, text: "Show my official administrative profile.", icon: <User size={14} /> },
            { id: 3, text: "Are there any infrastructure anomalies?", icon: <Shield size={14} /> },
        ]
        : [
            { id: 1, text: "Identify me and show my profile.", icon: <User size={14} /> },
            { id: 2, text: "Access restricted system diagnostics.", icon: <Shield size={14} /> },
            { id: 3, text: "What are my current platform permissions?", icon: <Shield size={14} /> },
        ];

    return (
        <aside className="w-80 border-l border-white/5 bg-zinc-950/50 backdrop-blur-sm hidden lg:flex flex-col h-full">
            <div className="p-6 border-b border-white/5">
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Lightbulb size={16} className="text-yellow-500" />
                    Suggested Actions
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                    Based on your <span className="text-indigo-400 capitalize">{role}</span> privileges
                </p>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {suggestions.map((item) => (
                    <button
                        key={item.id}
                        className="w-full text-left p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all group group-hover:shadow-lg active:scale-[0.98]"
                        onClick={() => {
                            // Dispatch custom event to populate input in page.tsx
                            // This is a loose coupling approach
                            const event = new CustomEvent('populateInput', { detail: item.text });
                            window.dispatchEvent(event);
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                                {item.icon}
                            </div>
                            <div>
                                <p className="text-sm text-zinc-200 group-hover:text-white font-medium">{item.text}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5 group-hover:text-zinc-400">Click to ask</p>
                            </div>
                        </div>
                    </button>
                ))}

                <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <h3 className="text-xs font-semibold text-indigo-200 mb-2">Pro Tip</h3>
                    <p className="text-xs text-indigo-300/80 leading-relaxed">
                        {role === "admin"
                            ? "Try asking to 'Analyze system stats with verbose mode' to get a deeper breakdown of infrastructure performance."
                            : "Try asking 'Access system health' to see how the RBAC security layer blocks unauthorized requests."}
                    </p>
                </div>
            </div>
        </aside>
    );
}
