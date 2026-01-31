/**
 * EXAMPLE COMPONENT: AgendaViewer
 *
 * Demonstrates how to create a Tambo component that:
 * - Receives structured array data from AI via props
 * - Uses a Zod schema for prop validation (see index.tsx)
 * - Renders dynamic content based on AI response
 *
 * Replace or modify this for your own use case.
 */

import { Calendar, Clock, Copy, User } from "lucide-react";
import { useState } from "react";

interface AgendaItem {
    time: string;
    topic: string;
    assignee: string;
}

interface AgendaViewerProps {
    agenda: AgendaItem[];
}

export function AgendaViewer({ agenda }: AgendaViewerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = agenda
            .map((item) => `${item.time} - ${item.topic} (${item.assignee})`)
            .join("\n");
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!agenda || agenda.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500 bg-gray-50/50 rounded-2xl border border-gray-200/60">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">No items to display yet.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header with utility button */}
            <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 tracking-tight">Timeline (Example)</h3>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                    title="Copy agenda"
                >
                    <Copy className={`w-4 h-4 transition-colors ${copied ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                </button>
            </div>

            {/* Timeline Items */}
            <div className="relative py-4">
                {/* Continuous vertical line */}
                <div className="absolute left-7 top-6 bottom-6 w-[2px] bg-violet-100" />

                <div className="flex flex-col">
                    {agenda.map((item, index) => (
                        <div
                            key={index}
                            className="relative pl-5 pr-4 py-2.5 hover:bg-gray-50/60 transition-colors group"
                        >
                            {/* Row 1: Dot + Time + Topic (all on same line) */}
                            <div className="flex items-center gap-3">
                                {/* Dot */}
                                <div className="flex-shrink-0 w-4 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-violet-500 rounded-full ring-[3px] ring-white shadow-md z-10" />
                                </div>

                                {/* Time chip */}
                                <div className="flex-shrink-0 inline-flex items-center text-xs font-mono font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm">
                                    <Clock className="w-3 h-3 mr-1 text-gray-400" />
                                    {item.time}
                                </div>

                                {/* Topic title - same line as time */}
                                <span className="text-sm font-semibold text-gray-900 group-hover:text-violet-700 transition-colors truncate">
                                    {item.topic}
                                </span>
                            </div>

                            {/* Row 2: Assignee badge (indented to align with content) */}
                            <div className="flex items-center gap-1 mt-1.5 ml-7 pl-[88px]">
                                <User className="w-3 h-3 text-gray-400" />
                                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
                                    {item.assignee}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center font-medium">
                    {agenda.length} item{agenda.length !== 1 ? 's' : ''} • Example component rendered via Tambo
                </p>
            </div>
        </div>
    );
}
